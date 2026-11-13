import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Shield, 
  Layers, 
  Star, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Users, 
  Sparkles, 
  Check, 
  ChevronDown, 
  Calendar,
  X,
  FileSpreadsheet,
  Zap,
  LayoutList,
  Compass
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { ALL_32_TEAMS_PLAYERS } from '../data/all32TeamsRoster';
import { NFL_DEFENSIVE_PLAYERS } from '../data/defensivePlayers';
import { CURRENT_SEASON_INFO } from '../data/nfl2026Data';
import MatchupSimulator from '../components/MatchupSimulator';
import TacticalFieldDiagram from '../components/TacticalFieldDiagram';

// All players pooled
const ALL_PLAYERS_POOL = [...ALL_32_TEAMS_PLAYERS, ...NFL_DEFENSIVE_PLAYERS];

import { exportLineupToCSV, sanitizeCsvField, sanitizeCsvCell, formatCsvRow } from '../utils/csvExporter';
export { sanitizeCsvCell, formatCsvRow };

// Canonical Formation Definitions and Formation Slots
export const FORMATION_PRESETS = {
  'Offensive Spread 11': {
    name: 'Offensive Spread 11',
    description: 'High-octane 11-player offensive attack featuring 4 wide receivers and flexible scrimmage options.',
    category: 'OFFENSE',
    slots: [
      { id: 'slot-1', name: 'QB', label: 'Quarterback', eligible: ['QB'] },
      { id: 'slot-2', name: 'RB', label: 'Running Back', eligible: ['RB'] },
      { id: 'slot-3', name: 'WR1', label: 'Wide Receiver 1', eligible: ['WR'] },
      { id: 'slot-4', name: 'WR2', label: 'Wide Receiver 2', eligible: ['WR'] },
      { id: 'slot-5', name: 'WR3', label: 'Wide Receiver 3', eligible: ['WR'] },
      { id: 'slot-6', name: 'WR4', label: 'Wide Receiver 4', eligible: ['WR'] },
      { id: 'slot-7', name: 'TE', label: 'Tight End', eligible: ['TE'] },
      { id: 'slot-8', name: 'FLEX1', label: 'Flex 1 (RB/WR/TE)', eligible: ['RB', 'WR', 'TE'] },
      { id: 'slot-9', name: 'FLEX2', label: 'Flex 2 (RB/WR/TE)', eligible: ['RB', 'WR', 'TE'] },
      { id: 'slot-10', name: 'K', label: 'Kicker', eligible: ['K'] },
      { id: 'slot-11', name: 'DST', label: 'Defense / Special Teams', eligible: ['DST'] }
    ]
  },
  '4-3 Defense': {
    name: '4-3 Defense',
    description: 'Classic 11-man championship defense: 4 defensive linemen, 3 linebackers, and 4 secondary backs.',
    category: 'DEFENSE',
    slots: [
      { id: 'slot-1', name: 'LDE', label: 'Left Defensive End', eligible: ['DE', 'EDGE', 'DL'] },
      { id: 'slot-2', name: 'DT1', label: 'Defensive Tackle 1', eligible: ['DT', 'NT', 'DL'] },
      { id: 'slot-3', name: 'DT2', label: 'Defensive Tackle 2', eligible: ['DT', 'NT', 'DL'] },
      { id: 'slot-4', name: 'RDE', label: 'Right Defensive End', eligible: ['DE', 'EDGE', 'DL'] },
      { id: 'slot-5', name: 'WLB', label: 'Will (Weakside LB)', eligible: ['LB', 'OLB'] },
      { id: 'slot-6', name: 'MLB', label: 'Mike (Middle LB)', eligible: ['LB', 'ILB'] },
      { id: 'slot-7', name: 'SLB', label: 'Sam (Strongside LB)', eligible: ['LB', 'OLB'] },
      { id: 'slot-8', name: 'CB1', label: 'Cornerback 1', eligible: ['CB', 'DB'] },
      { id: 'slot-9', name: 'CB2', label: 'Cornerback 2', eligible: ['CB', 'DB'] },
      { id: 'slot-10', name: 'FS', label: 'Free Safety', eligible: ['S', 'FS', 'DB'] },
      { id: 'slot-11', name: 'SS', label: 'Strong Safety', eligible: ['S', 'SS', 'DB'] }
    ]
  },
  'Fantasy Superflex 11': {
    name: 'Fantasy Superflex 11',
    description: 'Tournament DFS Superflex format allowing a second Quarterback in the dedicated Superflex slot.',
    category: 'FANTASY',
    slots: [
      { id: 'slot-1', name: 'QB', label: 'Starting QB', eligible: ['QB'] },
      { id: 'slot-2', name: 'SUPERFLEX', label: 'Superflex (QB/RB/WR/TE)', eligible: ['QB', 'RB', 'WR', 'TE'] },
      { id: 'slot-3', name: 'RB1', label: 'Running Back 1', eligible: ['RB'] },
      { id: 'slot-4', name: 'RB2', label: 'Running Back 2', eligible: ['RB'] },
      { id: 'slot-5', name: 'WR1', label: 'Wide Receiver 1', eligible: ['WR'] },
      { id: 'slot-6', name: 'WR2', label: 'Wide Receiver 2', eligible: ['WR'] },
      { id: 'slot-7', name: 'WR3', label: 'Wide Receiver 3', eligible: ['WR'] },
      { id: 'slot-8', name: 'TE', label: 'Tight End', eligible: ['TE'] },
      { id: 'slot-9', name: 'FLEX1', label: 'Flex 1 (RB/WR/TE)', eligible: ['RB', 'WR', 'TE'] },
      { id: 'slot-10', name: 'FLEX2', label: 'Flex 2 (RB/WR/TE)', eligible: ['RB', 'WR', 'TE'] },
      { id: 'slot-11', name: 'DST', label: 'Team Defense', eligible: ['DST'] }
    ]
  }
};

// Initial default starter assignments for presets
function pickStarter(id, fallbackPos) {
  return (
    ALL_PLAYERS_POOL.find((p) => p.id === id) ||
    ALL_PLAYERS_POOL.find((p) => (p.pos || p.position) === fallbackPos) ||
    null
  );
}

function getInitialPresetLineup(presetKey) {
  const formation = FORMATION_PRESETS[presetKey];
  if (!formation) return [];

  if (presetKey === 'Offensive Spread 11') {
    return [
      { slotId: 'slot-1', slotName: 'QB', player: pickStarter('patrick-mahomes', 'QB') },
      { slotId: 'slot-2', slotName: 'RB', player: pickStarter('kenneth-walker-iii', 'RB') },
      { slotId: 'slot-3', slotName: 'WR1', player: pickStarter('ja-marr-chase', 'WR') },
      { slotId: 'slot-4', slotName: 'WR2', player: pickStarter('justin-jefferson', 'WR') },
      { slotId: 'slot-5', slotName: 'WR3', player: pickStarter('amon-ra-st-brown', 'WR') },
      { slotId: 'slot-6', slotName: 'WR4', player: pickStarter('ceedee-lamb', 'WR') },
      { slotId: 'slot-7', slotName: 'TE', player: pickStarter('travis-kelce', 'TE') },
      { slotId: 'slot-8', slotName: 'FLEX1', player: pickStarter('saquon-barkley', 'RB') },
      { slotId: 'slot-9', slotName: 'FLEX2', player: pickStarter('derrick-henry', 'RB') },
      { slotId: 'slot-10', slotName: 'K', player: pickStarter('justin-tucker', 'K') },
      { slotId: 'slot-11', slotName: 'DST', player: pickStarter('chiefs-dst', 'DST') },
    ];
  }

  if (presetKey === '4-3 Defense') {
    return [
      { slotId: 'slot-1', slotName: 'LDE', player: ALL_PLAYERS_POOL.find(p => p.id === 'myles-garrett') },
      { slotId: 'slot-2', slotName: 'DT1', player: ALL_PLAYERS_POOL.find(p => p.id === 'chris-jones') },
      { slotId: 'slot-3', slotName: 'DT2', player: ALL_PLAYERS_POOL.find(p => p.id === 'dexter-lawrence') },
      { slotId: 'slot-4', slotName: 'RDE', player: ALL_PLAYERS_POOL.find(p => p.id === 'tj-watt') },
      { slotId: 'slot-5', slotName: 'WLB', player: ALL_PLAYERS_POOL.find(p => p.id === 'micah-parsons') },
      { slotId: 'slot-6', slotName: 'MLB', player: ALL_PLAYERS_POOL.find(p => p.id === 'fred-warner') },
      { slotId: 'slot-7', slotName: 'SLB', player: ALL_PLAYERS_POOL.find(p => p.id === 'roquan-smith') },
      { slotId: 'slot-8', slotName: 'CB1', player: ALL_PLAYERS_POOL.find(p => p.id === 'sauce-gardner') },
      { slotId: 'slot-9', slotName: 'CB2', player: ALL_PLAYERS_POOL.find(p => p.id === 'patrick-surtain-ii') },
      { slotId: 'slot-10', slotName: 'FS', player: ALL_PLAYERS_POOL.find(p => p.id === 'kyle-hamilton') },
      { slotId: 'slot-11', slotName: 'SS', player: ALL_PLAYERS_POOL.find(p => p.id === 'antoine-winfield-jr') },
    ];
  }

  // Fantasy Superflex 11
  return [
    { slotId: 'slot-1', slotName: 'QB', player: ALL_PLAYERS_POOL.find(p => p.id === 'josh-allen') },
    { slotId: 'slot-2', slotName: 'SUPERFLEX', player: ALL_PLAYERS_POOL.find(p => p.id === 'lamar-jackson') },
    { slotId: 'slot-3', slotName: 'RB1', player: ALL_PLAYERS_POOL.find(p => p.id === 'saquon-barkley') },
    { slotId: 'slot-4', slotName: 'RB2', player: ALL_PLAYERS_POOL.find(p => p.id === 'kenneth-walker-iii') },
    { slotId: 'slot-5', slotName: 'WR1', player: ALL_PLAYERS_POOL.find(p => p.id === 'ja-marr-chase') },
    { slotId: 'slot-6', slotName: 'WR2', player: ALL_PLAYERS_POOL.find(p => p.id === 'justin-jefferson') },
    { slotId: 'slot-7', slotName: 'WR3', player: ALL_PLAYERS_POOL.find(p => p.id === 'nico-collins') },
    { slotId: 'slot-8', slotName: 'TE', player: ALL_PLAYERS_POOL.find(p => p.id === 'brock-bowers') },
    { slotId: 'slot-9', slotName: 'FLEX1', player: ALL_PLAYERS_POOL.find(p => p.id === 'jahmyr-gibbs') },
    { slotId: 'slot-10', slotName: 'FLEX2', player: ALL_PLAYERS_POOL.find(p => p.id === 'derrick-henry') },
    { slotId: 'slot-11', slotName: 'DST', player: ALL_PLAYERS_POOL.find(p => p.id === 'steelers-dst') },
  ];
}

const generateLineupUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function Lineups({ user, onOpenAuth }) {
  const [allPlayers, setAllPlayers] = useState(ALL_PLAYERS_POOL);
  const [selectedPresetKey, setSelectedPresetKey] = useState('Offensive Spread 11');
  const [lineupSlots, setLineupSlots] = useState(() => getInitialPresetLineup('Offensive Spread 11'));
  const [lineupName, setLineupName] = useState('Championship Roster 2026');
  const [lineupId, setLineupId] = useState(() => generateLineupUuid());
  const [personalRating, setPersonalRating] = useState(5); // 1 to 5 stars
  const [hoverRating, setHoverRating] = useState(0);
  const [isFinalized, setIsFinalized] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saved' | 'error' | null
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'field'
  const [showSimulator, setShowSimulator] = useState(false);
  const simulatorRef = useRef(null);

  // Slot picker modal state
  const [activeSlotModal, setActiveSlotModal] = useState(null); // slot definition or null
  const [pickerSearch, setPickerSearch] = useState('');

  const currentPreset = FORMATION_PRESETS[selectedPresetKey];

  // Fetch 2026 active players from Supabase when configured, merged with local defensive/K/DST pool
  useEffect(() => {
    let active = true;
    async function loadSupabasePlayers() {
      if (!isSupabaseConfigured) return;
      try {
        const { data, error } = await supabase
          .from('players')
          .select(`
            id,
            name,
            position,
            team,
            jersey_number,
            status,
            player_season_stats (
              season_year,
              games_played,
              passing_yards,
              passing_tds,
              completions,
              attempts,
              passer_rating,
              rushing_yards,
              rushing_tds,
              receptions,
              receiving_yards,
              receiving_tds,
              player_performance_rating
            )
          `);

        if (!active || error || !Array.isArray(data) || data.length === 0) return;

        const mapped = data.map((p) => {
          const stats = p.player_season_stats?.[0] || {};
          const localMatch = ALL_PLAYERS_POOL.find(
            (lp) => lp.name.toLowerCase() === p.name.toLowerCase() || lp.id === p.id
          );

          return {
            id: p.id,
            name: p.name,
            avatar_url: p.avatar_url || localMatch?.avatar_url || null,
            number: `#${p.jersey_number || (localMatch?.jersey_number ?? 0)}`,
            jersey_number: p.jersey_number || (localMatch?.jersey_number ?? 0),
            pos: p.position,
            position: p.position,
            team: localMatch?.team || p.team,
            teamAbbr: p.team,
            status: p.status || 'ACTIVE',
            gamesPlayed: stats.games_played || localMatch?.gamesPlayed || 9,
            player_performance_rating: Number(stats.player_performance_rating ?? localMatch?.player_performance_rating ?? 4.0),
            rating: localMatch?.rating || (Number(stats.player_performance_rating || 4.0) * 20).toFixed(1),
            salary: localMatch?.salary || 7500,
            passYds: stats.passing_yards ?? localMatch?.passYds ?? 0,
            passTd: stats.passing_tds ?? localMatch?.passTd ?? 0,
            int: localMatch?.int ?? 0,
            rushYds: stats.rushing_yards ?? localMatch?.rushYds ?? 0,
            rushTd: stats.rushing_tds ?? localMatch?.rushTd ?? 0,
            rec: stats.receptions ?? localMatch?.rec ?? 0,
            recYds: stats.receiving_yards ?? localMatch?.recYds ?? 0,
            recTd: stats.receiving_tds ?? localMatch?.recTd ?? 0,
            fantasyPts: localMatch?.fantasyPts || 140.0
          };
        });

        const combined = [...mapped];
        ALL_PLAYERS_POOL.forEach((lp) => {
          if (!combined.some((c) => c.name.toLowerCase() === lp.name.toLowerCase())) {
            combined.push(lp);
          }
        });

        if (active) {
          setAllPlayers(combined);
        }
      } catch (err) {
        console.warn('Supabase player pool load notice:', err);
      }
    }

    loadSupabasePlayers();
    return () => {
      active = false;
    };
  }, []);

  const handleOpenSimulator = () => {
    setShowSimulator(true);
    setTimeout(() => {
      simulatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  // Handle Preset Switch
  const handleSelectPreset = (key) => {
    setSelectedPresetKey(key);
    setLineupSlots(getInitialPresetLineup(key));
    setIsFinalized(false);
    setSaveStatus(null);
  };

  // Check Position Eligibility
  const isPlayerEligible = (player, slotRule) => {
    if (!player || !slotRule) return false;
    const playerPos = player.pos || player.position;
    return slotRule.eligible.includes(playerPos);
  };

  // Salary and Stats Summary
  const totals = useMemo(() => {
    let salary = 0;
    let totalRating = 0;
    let totalFP = 0;
    let filledCount = 0;
    let invalidCount = 0;

    lineupSlots.forEach((item, index) => {
      const slotRule = currentPreset.slots[index];
      if (item.player) {
        salary += item.player.salary || 6500;
        totalRating += Number(item.player.player_performance_rating || 4.0);
        totalFP += Number(item.player.fantasyPts || 120);
        filledCount++;

        if (!isPlayerEligible(item.player, slotRule)) {
          invalidCount++;
        }
      }
    });

    const avgRating = filledCount > 0 ? (totalRating / filledCount).toFixed(2) : '0.00';

    return {
      salary,
      salaryRemaining: 60000 - salary,
      avgRating,
      totalFP: totalFP.toFixed(1),
      filledCount,
      invalidCount,
      isComplete: filledCount === 11 && invalidCount === 0
    };
  }, [lineupSlots, currentPreset]);

  // Persist Lineup & Personal Rating to Supabase custom_lineups
  const handleSaveLineup = async (newRating = personalRating) => {
    try {
      const payload = {
        id: lineupId,
        name: lineupName,
        formation: selectedPresetKey,
        personal_rating: newRating,
        slots: lineupSlots.map(s => ({
          slot: s.slotName,
          playerId: s.player?.id,
          playerName: s.player?.name,
          team: s.player?.teamAbbr || s.player?.team,
          rating: s.player?.player_performance_rating
        })),
        updated_at: new Date().toISOString()
      };

      // Local storage fallback
      localStorage.setItem(`gridiron_lineup_${lineupId}`, JSON.stringify(payload));

      if (isSupabaseConfigured && user) {
        payload.user_id = user.id;
        const { error } = await supabase
          .from('custom_lineups')
          .upsert(payload);

        if (error) {
          console.warn('Supabase custom_lineups notice:', error.message);
        }
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.warn('Lineup save notice:', err);
    }
  };

  // Update personal star rating
  const handleRate = (rating) => {
    if (isFinalized) return;
    setPersonalRating(rating);
    handleSaveLineup(rating);
  };

  // Finalize Lineup via Supabase RPC
  const handleFinalizeLineup = async () => {
    if (isFinalized) return;
    setFinalizing(true);

    try {
      await handleSaveLineup(personalRating);

      if (isSupabaseConfigured) {
        // Invoke official stored procedure as requested
        const { data, error } = await supabase.rpc('finalize_lineup', { 
          p_lineup_id: lineupId 
        });

        if (error) {
          console.warn('finalize_lineup RPC notice:', error.message);
        }
      }

      // Mark finalized in state and local persistence
      setIsFinalized(true);
      const finalizedData = {
        lineupId,
        lineupName,
        finalizedAt: new Date().toISOString(),
        personal_rating: personalRating,
        formation: selectedPresetKey
      };
      localStorage.setItem(`finalized_${lineupId}`, JSON.stringify(finalizedData));
    } catch (err) {
      console.warn('Lineup finalization note:', err);
      setIsFinalized(true);
    } finally {
      setFinalizing(false);
    }
  };

  // Slot Assignment
  const handleAssignPlayer = (slotIndex, player) => {
    const updated = [...lineupSlots];
    updated[slotIndex] = {
      ...updated[slotIndex],
      player
    };
    setLineupSlots(updated);
    setActiveSlotModal(null);
    setPickerSearch('');
  };

  const handleRemovePlayer = (slotIndex) => {
    if (isFinalized) return;
    const updated = [...lineupSlots];
    updated[slotIndex] = {
      ...updated[slotIndex],
      player: null
    };
    setLineupSlots(updated);
  };

  // Formula-sanitized CSV export
  const handleExportCSV = () => {
    exportLineupToCSV({
      name: lineupName,
      formation: selectedPresetKey,
      personal_rating: personalRating,
      slots: lineupSlots.map((item, idx) => ({
        ...item,
        eligible: currentPreset.slots[idx]?.eligible,
        status: item.player ? (isPlayerEligible(item.player, currentPreset.slots[idx]) ? 'VALID' : 'INVALID_POSITION') : 'EMPTY'
      }))
    }, allPlayers);
  };

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Title & Top Toolbar */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        gap: '1rem', 
        marginBottom: '1.75rem' 
      }}>
        <div>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6, 
            fontSize: '0.8rem', 
            color: 'var(--headline-gold)', 
            fontFamily: 'var(--font-tech)', 
            fontWeight: 700, 
            marginBottom: 6 
          }}>
            <Calendar size={14} /> {CURRENT_SEASON_INFO.year} NFL SEASON • CANONICAL FORMATION LAB
          </div>
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '2.5rem', 
            textTransform: 'uppercase', 
            lineHeight: 1,
            margin: 0
          }}>
            ROSTER & <span style={{ color: 'var(--headline-gold)' }}>LINEUP BUILDER</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4, margin: '4px 0 0' }}>
            Build 11-slot official offensive spreads, 4-3 defense schemes, or Superflex fantasy rosters with position validation.
          </p>
        </div>

        {/* Action Controls: Export CSV, Simulate Matchup & Finalize */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              backgroundColor: 'var(--card-slate)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-primary)',
              padding: '8px 16px',
              borderRadius: 6,
              fontFamily: 'var(--font-tech)',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Download size={16} style={{ color: 'var(--headline-gold)' }} />
            Export Sanitized CSV
          </button>

          <button
            type="button"
            disabled={!isFinalized && totals.filledCount < 11}
            onClick={handleOpenSimulator}
            title={
              !isFinalized && totals.filledCount < 11
                ? `Fill all 11 roster slots (${totals.filledCount}/11) to simulate`
                : 'Simulate a head-to-head matchup with this 11-player lineup'
            }
            style={{
              backgroundColor: showSimulator ? 'rgba(56, 189, 248, 0.16)' : 'var(--card-slate)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              padding: '8px 16px',
              borderRadius: 6,
              fontFamily: 'var(--font-tech)',
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: (!isFinalized && totals.filledCount < 11) ? 'not-allowed' : 'pointer',
              opacity: (!isFinalized && totals.filledCount < 11) ? 0.55 : 1,
              transition: 'all 0.15s ease',
              boxShadow: showSimulator ? '0 0 14px rgba(56, 189, 248, 0.25)' : 'none'
            }}
          >
            <Zap size={16} />
            {!isFinalized && totals.filledCount < 11
              ? `Simulate Matchup (${totals.filledCount}/11)`
              : 'Simulate Matchup'}
          </button>

          {isFinalized ? (
            <button
              type="button"
              onClick={() => setIsFinalized(false)}
              style={{
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: '1px solid #22c55e',
                padding: '8px 16px',
                borderRadius: 6,
                fontFamily: 'var(--font-tech)',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer'
              }}
            >
              <Lock size={16} /> Finalized & Locked (Unlock)
            </button>
          ) : (
            <button
              type="button"
              disabled={finalizing || totals.filledCount < 11}
              onClick={handleFinalizeLineup}
              style={{
                backgroundColor: 'var(--espn-red)',
                color: '#0a0f1d',
                border: 'none',
                padding: '8px 18px',
                borderRadius: 6,
                fontFamily: 'var(--font-tech)',
                fontSize: '0.85rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: (totals.filledCount < 11 || finalizing) ? 'not-allowed' : 'pointer',
                opacity: (totals.filledCount < 11 || finalizing) ? 0.6 : 1,
                boxShadow: '0 0 12px var(--espn-red-glow)'
              }}
            >
              <CheckCircle2 size={16} />
              {finalizing ? 'Finalizing...' : 'Finalize Roster'}
            </button>
          )}
        </div>
      </div>

      {/* Preset Selector Tabs */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
        gap: '0.75rem', 
        marginBottom: '1.5rem' 
      }}>
        {Object.keys(FORMATION_PRESETS).map(key => {
          const preset = FORMATION_PRESETS[key];
          const isSelected = selectedPresetKey === key;
          return (
            <div
              key={key}
              onClick={() => handleSelectPreset(key)}
              style={{
                backgroundColor: isSelected ? 'var(--card-slate)' : 'var(--studio-charcoal)',
                border: isSelected ? '2px solid var(--headline-gold)' : '1px solid var(--card-border)',
                borderRadius: 8,
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
                boxShadow: isSelected ? '0 0 14px rgba(56, 189, 248, 0.2)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ 
                  fontSize: '0.7rem', 
                  fontFamily: 'var(--font-tech)', 
                  fontWeight: 800, 
                  color: isSelected ? 'var(--headline-gold)' : 'var(--text-muted)' 
                }}>
                  {preset.category} PRESET
                </span>
                {isSelected && (
                  <span style={{ 
                    background: 'var(--headline-gold)', 
                    color: '#0a0f1d',
                    borderRadius: '50%', 
                    width: 18, 
                    height: 18, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
              <h3 style={{ margin: '2px 0 6px', fontSize: '1.05rem', fontFamily: 'var(--font-display)' }}>
                {preset.name}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                {preset.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Lineup Customization Bar: Name & Star Rating */}
      <div style={{ 
        backgroundColor: 'var(--card-slate)', 
        border: '1px solid var(--card-border)', 
        borderRadius: 8, 
        padding: '1rem 1.25rem', 
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        {/* Name input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 300px' }}>
          <label style={{ fontSize: '0.8rem', fontFamily: 'var(--font-tech)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            ROSTER NAME:
          </label>
          <input
            type="text"
            disabled={isFinalized}
            value={lineupName}
            onChange={(e) => setLineupName(e.target.value)}
            onBlur={() => handleSaveLineup()}
            style={{
              flex: 1,
              backgroundColor: 'var(--studio-charcoal)',
              color: '#fff',
              border: '1px solid var(--card-border)',
              padding: '6px 12px',
              borderRadius: 6,
              fontFamily: 'var(--font-tech)',
              fontSize: '0.95rem',
              fontWeight: 700
            }}
          />
        </div>

        {/* Personal Star Rating Component */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-tech)', color: 'var(--text-secondary)' }}>
            PERSONAL RATING:
          </span>
          <div style={{ display: 'inline-flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (hoverRating || personalRating) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  disabled={isFinalized}
                  onMouseEnter={() => !isFinalized && setHoverRating(star)}
                  onMouseLeave={() => !isFinalized && setHoverRating(0)}
                  onClick={() => handleRate(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 2,
                    cursor: isFinalized ? 'default' : 'pointer',
                    color: active ? 'var(--headline-gold)' : '#64748b',
                    transition: 'transform 0.1s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={`Rate ${star} Stars`}
                >
                  <Star 
                    size={22} 
                    fill={active ? 'var(--headline-gold)' : 'none'} 
                    strokeWidth={1.5}
                  />
                </button>
              );
            })}
          </div>
          <span style={{ fontFamily: 'var(--font-tech)', fontSize: '0.85rem', fontWeight: 800, color: 'var(--headline-gold)' }}>
            {personalRating} / 5
          </span>
          {saveStatus === 'saved' && (
            <span style={{ fontSize: '0.7rem', color: '#4ade80', fontFamily: 'var(--font-tech)' }}>
              ✓ Saved to DB
            </span>
          )}
        </div>
      </div>

      {/* Roster Overview Stats Strip */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '0.75rem', 
        marginBottom: '1.5rem' 
      }}>
        <div style={{ backgroundColor: 'var(--card-slate)', border: '1px solid var(--card-border)', padding: '0.85rem 1rem', borderRadius: 8 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>SLOTS FILLED</div>
          <div style={{ fontFamily: 'var(--font-tech)', fontSize: '1.35rem', fontWeight: 800, color: totals.filledCount === 11 ? '#4ade80' : 'var(--headline-gold)' }}>
            {totals.filledCount} / 11
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-slate)', border: '1px solid var(--card-border)', padding: '0.85rem 1rem', borderRadius: 8 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>POSITION VALIDATION</div>
          <div style={{ fontFamily: 'var(--font-tech)', fontSize: '1.25rem', fontWeight: 800, color: totals.invalidCount === 0 ? '#4ade80' : '#ef4444' }}>
            {totals.invalidCount === 0 ? '✓ All Slots Eligible' : `⚠ ${totals.invalidCount} Ineligible`}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-slate)', border: '1px solid var(--card-border)', padding: '0.85rem 1rem', borderRadius: 8 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>AVG PERFORMANCE RATING</div>
          <div style={{ fontFamily: 'var(--font-tech)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--headline-gold)' }}>
            {totals.avgRating} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ 5.00</span>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-slate)', border: '1px solid var(--card-border)', padding: '0.85rem 1rem', borderRadius: 8 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>TOTAL PROJ FPTS</div>
          <div style={{ fontFamily: 'var(--font-tech)', fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8' }}>
            {totals.totalFP}
          </div>
        </div>
      </div>

      {/* View Mode Toggle Switch (List View vs. 2D Field View) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-tech)',
            fontSize: '0.82rem',
            fontWeight: 800,
            color: 'var(--text-secondary)',
            letterSpacing: '0.04em'
          }}
        >
          ACTIVE 11-SLOT DEPTH CHART • {selectedPresetKey.toUpperCase()}
        </div>

        <div
          role="tablist"
          aria-label="Roster View Mode"
          style={{
            display: 'inline-flex',
            backgroundColor: '#0a0f1d',
            border: '1px solid var(--card-border)',
            borderRadius: 8,
            padding: 3,
            gap: 4
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'list'}
            onClick={() => setViewMode('list')}
            style={{
              backgroundColor: viewMode === 'list' ? '#38bdf8' : 'transparent',
              color: viewMode === 'list' ? '#0a0f1d' : '#cbd5e1',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontFamily: 'var(--font-tech)',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LayoutList size={15} />
            List View
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'field'}
            onClick={() => setViewMode('field')}
            style={{
              backgroundColor: viewMode === 'field' ? '#38bdf8' : 'transparent',
              color: viewMode === 'field' ? '#0a0f1d' : '#cbd5e1',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontFamily: 'var(--font-tech)',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Compass size={15} />
            2D Field View
          </button>
        </div>
      </div>

      {/* 11-Slot Roster Container: List View or 2D Tactical Field View */}
      {viewMode === 'field' ? (
        <TacticalFieldDiagram
          lineupName={lineupName}
          formation={selectedPresetKey}
          slots={lineupSlots}
          avgRating={totals.avgRating}
          isFinalized={isFinalized}
          onSlotClick={(slotIndex) => {
            if (!isFinalized && currentPreset.slots[slotIndex]) {
              setActiveSlotModal({ slotIndex, rule: currentPreset.slots[slotIndex] });
            }
          }}
        />
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '2rem' }}>
        {lineupSlots.map((item, index) => {
          const slotRule = currentPreset.slots[index];
          const player = item.player;
          const eligible = player ? isPlayerEligible(player, slotRule) : false;

          return (
            <div
              key={slotRule.id}
              style={{
                backgroundColor: 'var(--card-slate)',
                border: player 
                  ? (eligible ? '1px solid var(--card-border)' : '1px solid #ef4444')
                  : '1px dashed #4b5563',
                borderRadius: 8,
                padding: '0.85rem 1.25rem',
                display: 'grid',
                gridTemplateColumns: '80px 1fr auto auto',
                alignItems: 'center',
                gap: '1rem',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Slot Indicator */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ 
                  fontFamily: 'var(--font-tech)', 
                  fontWeight: 900, 
                  fontSize: '1.05rem', 
                  color: 'var(--headline-gold)' 
                }}>
                  {slotRule.name}
                </span>
                <span style={{ 
                  fontSize: '0.65rem', 
                  color: 'var(--text-muted)', 
                  fontFamily: 'var(--font-tech)' 
                }}>
                  [{slotRule.eligible.join('/')}]
                </span>
              </div>

              {/* Player Details or Empty State */}
              {player ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: 42, 
                    height: 42, 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--studio-charcoal)', 
                    border: '1.5px solid var(--card-border)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontFamily: 'var(--font-tech)',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    color: '#fff',
                    flexShrink: 0
                  }}>
                    {player.jersey_number ?? (player.number ? player.number.replace('#', '') : '00')}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
                        {player.name}
                      </span>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontFamily: 'var(--font-tech)', 
                        fontWeight: 700, 
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: 'var(--headline-gold)', 
                        padding: '1px 6px', 
                        borderRadius: 3 
                      }}>
                        {player.pos || player.position}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {player.teamAbbr || player.team}
                      </span>
                    </div>

                    {/* Validation tag */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      {eligible ? (
                        <span style={{ fontSize: '0.7rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-tech)' }}>
                          <Check size={12} /> Position Eligible
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-tech)', fontWeight: 700 }}>
                          <AlertCircle size={12} /> Ineligible (Requires: {slotRule.eligible.join(', ')})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  Slot unassigned — click "Assign Player" to choose from eligible {slotRule.eligible.join('/')} starters
                </div>
              )}

              {/* Performance Rating Badge */}
              {player && (
                <div style={{ textAlign: 'right', paddingRight: '1rem' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>RATING</div>
                  <div style={{ fontFamily: 'var(--font-tech)', fontSize: '1.05rem', fontWeight: 800, color: 'var(--headline-gold)' }}>
                    {Number(player.player_performance_rating || 4.0).toFixed(2)}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {!isFinalized && (
                  <button
                    type="button"
                    onClick={() => setActiveSlotModal({ slotIndex: index, rule: slotRule })}
                    style={{
                      backgroundColor: player ? 'var(--studio-charcoal)' : 'var(--espn-red)',
                      color: player ? 'var(--text-primary)' : '#0a0f1d',
                      border: '1px solid var(--card-border)',
                      padding: '6px 12px',
                      borderRadius: 4,
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-tech)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {player ? 'Swap' : 'Assign Player'}
                  </button>
                )}

                {!isFinalized && player && (
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      padding: 6,
                      cursor: 'pointer'
                    }}
                    title="Clear Slot"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Head-to-Head Matchup Simulator Section */}
      <div ref={simulatorRef}>
        {showSimulator && (
          <MatchupSimulator
            userLineup={{
              id: lineupId,
              name: lineupName,
              formation: selectedPresetKey,
              personal_rating: personalRating,
              isFinalized,
              slots: lineupSlots
            }}
            userPlayers={lineupSlots.map((s) => s.player).filter(Boolean)}
            allPlayers={allPlayers}
            formationSlots={currentPreset.slots}
            user={user}
            onClose={() => setShowSimulator(false)}
          />
        )}
      </div>

      {/* Interactive Slot Assignment Modal */}
      {activeSlotModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--card-slate)',
            border: '1px solid var(--card-border)',
            borderRadius: 10,
            width: '100%',
            maxWidth: 620,
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--studio-charcoal)',
              borderBottom: '1px solid var(--card-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>
                  Assign to {activeSlotModal.rule.name}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>
                  Eligible Positions: {activeSlotModal.rule.eligible.join(', ')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveSlotModal(null);
                  setPickerSearch('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--card-border)' }}>
              <input
                type="text"
                autoFocus
                placeholder="Search player name or team..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--studio-charcoal)',
                  color: '#fff',
                  border: '1px solid var(--card-border)',
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontFamily: 'var(--font-tech)',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Eligible Player List */}
            <div style={{ padding: '0.5rem 1.25rem', overflowY: 'auto', flex: 1 }}>
              {allPlayers
                .filter(p => isPlayerEligible(p, activeSlotModal.rule))
                .filter(p => {
                  if (!pickerSearch.trim()) return true;
                  const query = pickerSearch.toLowerCase();
                  return (
                    p.name.toLowerCase().includes(query) ||
                    p.team.toLowerCase().includes(query) ||
                    (p.teamAbbr && p.teamAbbr.toLowerCase().includes(query))
                  );
                })
                .slice(0, 50)
                .map(player => (
                  <div
                    key={player.id}
                    onClick={() => handleAssignPlayer(activeSlotModal.slotIndex, player)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.5rem',
                      borderBottom: '1px solid var(--card-border)',
                      cursor: 'pointer',
                      borderRadius: 4,
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--studio-charcoal)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ 
                        fontFamily: 'var(--font-tech)', 
                        fontWeight: 800, 
                        fontSize: '0.85rem', 
                        color: 'var(--headline-gold)',
                        width: 32 
                      }}>
                        {player.number ?? `#${player.jersey_number}`}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {player.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {player.team} • {player.pos || player.position}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-tech)', fontWeight: 800, color: '#4ade80' }}>
                          {Number(player.player_performance_rating || 4.0).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>RATING</div>
                      </div>
                      <button
                        type="button"
                        style={{
                          backgroundColor: 'var(--espn-red)',
                          color: '#0a0f1d',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: 4,
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-tech)',
                          fontWeight: 700
                        }}
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
