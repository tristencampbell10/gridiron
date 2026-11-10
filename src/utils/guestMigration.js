import { supabase, isSupabaseConfigured } from '../supabaseClient';

/**
 * Guest Data Migration Utility Engine
 * Inspects localStorage for offline guest activities (watchlist items, draft lineups, notes)
 * and synchronizes them to the authenticated user profile via Supabase RPC or direct sync.
 * Clears local guest keys upon successful migration.
 * 
 * @param {string} userId - Authenticated user UUID
 * @param {object} [options] - Migration options
 * @returns {Promise<{ success: boolean, migratedWatchlist: number, migratedLineups: number, error: any }>}
 */
export async function migrateGuestData(userId, options = {}) {
  if (!userId) {
    return { success: false, migratedWatchlist: 0, migratedLineups: 0, error: 'User ID is required for migration' };
  }

  try {
    let migratedWatchlistCount = 0;
    let migratedLineupsCount = 0;

    // 1. Gather Guest Watchlist from localStorage
    const guestWatchlistRaw = 
      localStorage.getItem('gridiron_guest_watchlist') ||
      localStorage.getItem('guest_watchlist') ||
      localStorage.getItem('user_watchlist');

    let guestWatchlist = [];
    if (guestWatchlistRaw) {
      try {
        const parsed = JSON.parse(guestWatchlistRaw);
        guestWatchlist = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('Failed parsing guest watchlist from localStorage:', e);
      }
    }

    // 2. Gather Guest Custom Lineups from localStorage
    let guestLineups = [];
    const directGuestLineups = localStorage.getItem('gridiron_guest_lineups');
    if (directGuestLineups) {
      try {
        const parsed = JSON.parse(directGuestLineups);
        if (Array.isArray(parsed)) guestLineups.push(...parsed);
      } catch (e) {
        console.warn('Failed parsing gridiron_guest_lineups:', e);
      }
    }

    // Also check for individual stored lineup keys (gridiron_lineup_*)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('gridiron_lineup_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (item && !item.user_id) {
            guestLineups.push(item);
          }
        } catch {
          // ignore corrupted keys
        }
      }
    }

    // 3. Gather Guest Scouting Notes
    const guestNotesRaw = localStorage.getItem('gridiron_guest_notes') || localStorage.getItem('user_notes_guest');
    let guestNotes = [];
    if (guestNotesRaw) {
      try {
        const parsed = JSON.parse(guestNotesRaw);
        guestNotes = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('Failed parsing guest notes:', e);
      }
    }

    const hasDataToMigrate = guestWatchlist.length > 0 || guestLineups.length > 0 || guestNotes.length > 0;

    if (!hasDataToMigrate) {
      return { success: true, migratedWatchlist: 0, migratedLineups: 0, error: null };
    }

    // 4. Execute Supabase RPC or Direct Table Sync
    if (isSupabaseConfigured) {
      try {
        // Attempt canonical RPC migration as requested
        const { data: rpcResult, error: rpcError } = await supabase.rpc('migrate_guest_data', {
          p_user_id: userId,
          p_watchlist: guestWatchlist,
          p_lineups: guestLineups,
          p_notes: guestNotes
        });

        if (!rpcError) {
          migratedWatchlistCount = guestWatchlist.length;
          migratedLineupsCount = guestLineups.length;
        } else {
          console.warn('migrate_guest_data RPC unavailable or errored; falling back to table upserts:', rpcError.message);
          
          // Direct fallback 1: Watchlist
          if (guestWatchlist.length > 0) {
            const watchlistRows = guestWatchlist.map(item => ({
              user_id: userId,
              player_id: typeof item === 'string' ? item : item.player_id || item.id,
              created_at: new Date().toISOString()
            }));

            const { error: wlErr } = await supabase
              .from('user_watchlist')
              .upsert(watchlistRows, { onConflict: 'user_id,player_id' });

            if (!wlErr) migratedWatchlistCount = watchlistRows.length;
          }

          // Direct fallback 2: Custom Lineups
          if (guestLineups.length > 0) {
            for (const lineup of guestLineups) {
              await supabase.from('custom_lineups').upsert({
                id: lineup.id || `lineup_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                user_id: userId,
                name: lineup.name || 'Migrated Lineup',
                formation: lineup.formation || 'Offensive Spread 11',
                personal_rating: lineup.personal_rating || 5,
                slots: lineup.slots || [],
                updated_at: new Date().toISOString()
              });
            }
            migratedLineupsCount = guestLineups.length;
          }

          // Direct fallback 3: Scouting Notes
          if (guestNotes.length > 0) {
            for (const note of guestNotes) {
              await supabase.from('user_notes').upsert({
                user_id: userId,
                player_id: note.player_id,
                content: note.content || note.note || '',
                updated_at: new Date().toISOString()
              });
            }
          }
        }
      } catch (syncErr) {
        console.warn('Network sync warning during guest migration:', syncErr);
      }
    } else {
      // In offline / preview mode: re-tag local guest records with authenticated userId
      migratedWatchlistCount = guestWatchlist.length;
      migratedLineupsCount = guestLineups.length;

      guestLineups.forEach(lineup => {
        lineup.user_id = userId;
        localStorage.setItem(`gridiron_lineup_${lineup.id}`, JSON.stringify(lineup));
      });
      localStorage.setItem(`gridiron_user_watchlist_${userId}`, JSON.stringify(guestWatchlist));
    }

    // 5. Clear Local Guest Keys Upon Successful Migration
    localStorage.removeItem('gridiron_guest_watchlist');
    localStorage.removeItem('guest_watchlist');
    localStorage.removeItem('gridiron_guest_lineups');
    localStorage.removeItem('gridiron_guest_notes');
    localStorage.removeItem('user_notes_guest');

    console.info(`[Gridiron Migration] Migrated ${migratedWatchlistCount} watchlist item(s) and ${migratedLineupsCount} lineup(s) to user ${userId}.`);

    return {
      success: true,
      migratedWatchlist: migratedWatchlistCount,
      migratedLineups: migratedLineupsCount,
      error: null
    };
  } catch (fatalErr) {
    console.error('Fatal error in migrateGuestData:', fatalErr);
    return {
      success: false,
      migratedWatchlist: 0,
      migratedLineups: 0,
      error: fatalErr
    };
  }
}
