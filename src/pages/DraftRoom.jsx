import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Play,
  Pause,
  Star,
  Users,
  Search,
  Trophy,
  Zap,
  CheckCircle2,
  Shuffle,
  ArrowRight,
  Layers,
  ListOrdered,
  Grid,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  X
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { ALL_32_TEAMS_PLAYERS } from '../data/all32TeamsRoster';
import { NFL_DEFENSIVE_PLAYERS } from '../data/defensivePlayers';
import { EXPANDED_OFFENSE_DEPTH } from '../data/expandedDraftPool';
import { FORMATION_PRESETS } from './Lineups';

const RAW_POOL = [...ALL_32_TEAMS_PLAYERS, ...NFL_DEFENSIVE_PLAYERS, ...EXPANDED_OFFENSE_DEPTH];
const seenIds = new Set();
const LOCAL_POOL = RAW_POOL.filter((p) => {
  if (!p?.id || seenIds.has(p.id)) return false;
  seenIds.add(p.id);
  return true;
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const toUuidOrNull = (val) => (typeof val === 'string' && UUID_REGEX.test(val) ? val : null);

const generateUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getAvatarUrl = (player) => {
  if (player?.avatar_url && typeof player.avatar_url === 'string' && player.avatar_url.trim() !== '') {
    return player.avatar_url;
  }
  const cleanName = encodeURIComponent(player?.name || 'NFL');
  return `https://ui-avatars.com/api/?name=${cleanName}&background=0a0f1d&color=38bdf8&bold=true&size=128`;
};

const getPos = (player) => player?.pos || player?.position || 'FLEX';

const CPU_TEAM_NAMES = [
  'Bay Area Blitz (CPU)',
  'Buffalo Stampede (CPU)',
  'Kansas City Reign (CPU)',
  'Motor City Grit (CPU)',
  'Baltimore Flock (CPU)',
  'Philly Trench (CPU)',
  'Twin Cities Frost (CPU)',
  'Mile High Thunder (CPU)',
  'Space City Orbit (CPU)',
  'Emerald Coast 12s (CPU)',
  'Big D Mavericks (CPU)'
];

/**
 * Find the best open formation slot index for a player on a given team's roster.
 * Prioritizes exact single-position slots before multi-position flex slots.
 */
function findBestOpenSlotIndex(teamSlots, formationSlots, player) {
  if (!player) return -1;
  const pos = getPos(player);

  // Pass 1: Strict single-position slots first
  for (let i = 0; i < formationSlots.length; i++) {
    if (!teamSlots[i]?.player) {
      const eligible = formationSlots[i].eligible || [];
      if (eligible.length === 1 && eligible.includes(pos)) {
        return i;
      }
    }
  }

  // Pass 2: Flexible / multi-position slots
  for (let i = 0; i < formationSlots.length; i++) {
    if (!teamSlots[i]?.player) {
      const eligible = formationSlots[i].eligible || [];
      if (eligible.includes(pos)) {
        return i;
      }
    }
  }

  return -1;
}

/**
 * Smart CPU Draft AI: Evaluates open formation slots and picks top available player with slight ADP variance
 */
function selectCpuDraftPick(cpuTeam, availablePlayers, formationSlots, currentRound) {
  const openSlots = formationSlots.filter((_, idx) => !cpuTeam.slots[idx]?.player);
  if (openSlots.length === 0) return null;

  // Determine all positions this CPU team can still legally draft
  const eligiblePositions = new Set();
  openSlots.forEach((s) => (s.eligible || []).forEach((pos) => eligiblePositions.add(pos)));

  // Prefer not drafting K or DST in the first 7 rounds unless those are the only open slots
  const nonSpecialOpen = openSlots.some((s) => !(s.eligible || []).every((p) => p === 'K' || p === 'DST'));

  let candidates = availablePlayers.filter((p) => eligiblePositions.has(getPos(p)));
  if (currentRound <= 8 && nonSpecialOpen) {
    const skillCandidates = candidates.filter((p) => {
      const pos = getPos(p);
      return pos !== 'K' && pos !== 'DST';
    });
    if (skillCandidates.length > 0) {
      candidates = skillCandidates;
    }
  }

  if (candidates.length === 0) return null;

  // Evaluate top 6 candidates with slight ADP variance for realistic draft flow
  const poolWindow = candidates.slice(0, Math.min(6, candidates.length));
  const scored = poolWindow.map((p, idx) => {
    const ratingScore = Number(p.player_performance_rating || 4.0) * 20;
    const fpBonus = Number(p.fantasyPts || 100) * 0.04;
    const rankWeight = (poolWindow.length - idx) * 1.4;
    const variance = (Math.random() - 0.35) * 4.5;
    return { player: p, score: ratingScore + fpBonus + rankWeight + variance };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.player || candidates[0];
}

export default function DraftRoom() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Master player pool sorted by consensus performance rating
  const [masterPlayers, setMasterPlayers] = useState(() =>
    [...LOCAL_POOL]
      .filter((p) => String(p.status || 'ACTIVE').toUpperCase() !== 'INACTIVE')
      .sort((a, b) => {
        const diff = Number(b.player_performance_rating || 4.0) - Number(a.player_performance_rating || 4.0);
        if (Math.abs(diff) > 0.005) return diff;
        return Number(b.fantasyPts || 100) - Number(a.fantasyPts || 100);
      })
      .map((p, idx) => ({ ...p, draftRank: idx + 1 }))
  );

  // Lobby config state
  const [draftPhase, setDraftPhase] = useState('LOBBY'); // 'LOBBY' | 'LIVE' | 'COMPLETE'
  const [leagueSize, setLeagueSize] = useState(10); // 8 | 10 | 12
  const [userDraftSlot, setUserDraftSlot] = useState(1); // 1..leagueSize
  const [pickTimerSeconds, setPickTimerSeconds] = useState(30); // 15 | 30 | 60
  const [selectedFormation, setSelectedFormation] = useState('Offensive Spread 11');
  const [teamName, setTeamName] = useState('Gridiron Champions 2026');

  // Live draft state
  const [teams, setTeams] = useState([]);
  const [draftedIds, setDraftedIds] = useState(() => new Set());
  const [pickHistory, setPickHistory] = useState([]);
  const [currentPickIndex, setCurrentPickIndex] = useState(0); // 0 to leagueSize * 11 - 1
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [isPaused, setIsPaused] = useState(false);

  // Draft Room Board UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [openSlotsOnly, setOpenSlotsOnly] = useState(true);
  const [userQueue, setUserQueue] = useState([]); // array of player IDs
  const [sidebarTab, setSidebarTab] = useState('ROSTER'); // 'ROSTER' | 'QUEUE' | 'GRID'
  const [savingLineup, setSavingLineup] = useState(false);
  const [lastPickBanner, setLastPickBanner] = useState(null);

  const formationConfig = FORMATION_PRESETS[selectedFormation] || FORMATION_PRESETS['Offensive Spread 11'];
  const formationSlots = formationConfig.slots;
  const totalPicks = leagueSize * 11;

  // Fetch active 2026 NFL players from Supabase on mount (merge with local defense/K/DST pool)
  useEffect(() => {
    let active = true;
    async function loadDraftPool() {
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
              rushing_yards,
              rushing_tds,
              receptions,
              receiving_yards,
              receiving_tds,
              player_performance_rating
            )
          `)
          .eq('status', 'ACTIVE');

        if (!active || error || !Array.isArray(data) || data.length === 0) return;

        const mapped = data.map((p) => {
          const stats = p.player_season_stats?.[0] || {};
          const localMatch = LOCAL_POOL.find(
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
            rushYds: stats.rushing_yards ?? localMatch?.rushYds ?? 0,
            rushTd: stats.rushing_tds ?? localMatch?.rushTd ?? 0,
            rec: stats.receptions ?? localMatch?.rec ?? 0,
            recYds: stats.receiving_yards ?? localMatch?.recYds ?? 0,
            recTd: stats.receiving_tds ?? localMatch?.recTd ?? 0,
            fantasyPts: localMatch?.fantasyPts || 140.0
          };
        });

        // Merge local defensive/K/DST/remaining players if not already present
        const combined = [...mapped];
        LOCAL_POOL.forEach((lp) => {
          if (!combined.some((c) => c.name.toLowerCase() === lp.name.toLowerCase())) {
            combined.push(lp);
          }
        });

        const sorted = combined
          .filter((p) => String(p.status || 'ACTIVE').toUpperCase() !== 'INACTIVE')
          .sort((a, b) => {
            const diff = Number(b.player_performance_rating || 4.0) - Number(a.player_performance_rating || 4.0);
            if (Math.abs(diff) > 0.005) return diff;
            return Number(b.fantasyPts || 100) - Number(a.fantasyPts || 100);
          })
          .map((p, idx) => ({ ...p, draftRank: idx + 1 }));

        if (active) {
          setMasterPlayers(sorted);
        }
      } catch (err) {
        console.warn('Supabase draft pool load notice:', err);
      }
    }

    loadDraftPool();
    return () => {
      active = false;
    };
  }, []);

  // Clamp userDraftSlot if leagueSize shrinks
  useEffect(() => {
    if (userDraftSlot > leagueSize) {
      setUserDraftSlot(leagueSize);
    }
  }, [leagueSize, userDraftSlot]);

  // Available players (unpicked)
  const availablePlayers = useMemo(() => {
    return masterPlayers.filter((p) => !draftedIds.has(p.id));
  }, [masterPlayers, draftedIds]);

  // Position filter tabs tailored to selected formation
  const positionTabs = useMemo(() => {
    if (selectedFormation === '4-3 Defense') {
      return ['ALL', 'DE', 'DT', 'LB', 'CB', 'S'];
    }
    if (selectedFormation === 'Fantasy Superflex 11') {
      return ['ALL', 'QB', 'RB', 'WR', 'TE', 'DST'];
    }
    return ['ALL', 'QB', 'RB', 'WR', 'TE', 'K', 'DST'];
  }, [selectedFormation]);

  // Reset position filter on formation change
  useEffect(() => {
    setPositionFilter('ALL');
  }, [selectedFormation]);

  // All positions eligible anywhere in the active formation
  const formationEligiblePositions = useMemo(() => {
    const set = new Set();
    formationSlots.forEach((s) => (s.eligible || []).forEach((pos) => set.add(pos)));
    return set;
  }, [formationSlots]);

  // Calculate active round, pick-in-round, and active snake draft slot
  const currentTurn = useMemo(() => {
    if (draftPhase !== 'LIVE' || teams.length === 0 || currentPickIndex >= totalPicks) {
      return { round: 1, pickInRound: 1, overallPick: 1, activeTeam: null };
    }
    const round = Math.floor(currentPickIndex / leagueSize) + 1;
    const indexInRound = currentPickIndex % leagueSize;
    const pickInRound = indexInRound + 1;
    const snakeSlot = round % 2 === 1 ? indexInRound + 1 : leagueSize - indexInRound;
    const activeTeam = teams.find((t) => t.draftSlot === snakeSlot) || null;
    return { round, pickInRound, overallPick: currentPickIndex + 1, activeTeam };
  }, [draftPhase, teams, currentPickIndex, totalPicks, leagueSize]);

  const userTeam = useMemo(() => teams.find((t) => t.isUser) || null, [teams]);
  const isUserOnClock = Boolean(draftPhase === 'LIVE' && currentTurn.activeTeam?.isUser);

  // Filtered available players for main Draft Board
  const filteredAvailablePlayers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const hasOpenSlots = userTeam ? userTeam.slots.some((s) => !s.player) : false;

    return availablePlayers.filter((p) => {
      const pos = getPos(p);
      // Only show players eligible for the selected formation
      if (!formationEligiblePositions.has(pos)) {
        return false;
      }

      if (positionFilter !== 'ALL' && pos !== positionFilter) {
        const aliases = {
          DE: ['DE', 'EDGE', 'DL'],
          DT: ['DT', 'NT', 'DL'],
          LB: ['LB', 'ILB', 'OLB'],
          CB: ['CB', 'DB'],
          S: ['S', 'FS', 'SS', 'DB']
        };
        if (!(aliases[positionFilter] && aliases[positionFilter].includes(pos))) {
          return false;
        }
      }

      if (
        openSlotsOnly &&
        positionFilter === 'ALL' &&
        draftPhase === 'LIVE' &&
        hasOpenSlots &&
        userTeam &&
        findBestOpenSlotIndex(userTeam.slots, formationSlots, p) === -1
      ) {
        return false;
      }

      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        String(p.team || '').toLowerCase().includes(query) ||
        String(p.teamAbbr || '').toLowerCase().includes(query) ||
        pos.toLowerCase().includes(query)
      );
    });
  }, [
    availablePlayers,
    formationEligiblePositions,
    positionFilter,
    openSlotsOnly,
    draftPhase,
    userTeam,
    formationSlots,
    searchQuery
  ]);

  // Start Live Draft
  const handleStartDraft = () => {
    const builtTeams = [];
    let cpuIdx = 0;

    for (let slot = 1; slot <= leagueSize; slot++) {
      const isUser = slot === userDraftSlot;
      builtTeams.push({
        id: isUser ? 'user-team' : `cpu-team-${slot}`,
        name: isUser ? teamName.trim() || 'Championship Squad 2026' : CPU_TEAM_NAMES[cpuIdx++] || `CPU Franchise ${slot}`,
        draftSlot: slot,
        isUser,
        slots: formationSlots.map((s) => ({
          slotId: s.id,
          slotName: s.name,
          player: null
        }))
      });
    }

    setTeams(builtTeams);
    setDraftedIds(new Set());
    setPickHistory([]);
    setUserQueue([]);
    setCurrentPickIndex(0);
    setSecondsLeft(pickTimerSeconds);
    setIsPaused(false);
    setLastPickBanner(null);
    setSidebarTab('ROSTER');
    setDraftPhase('LIVE');
  };

  const handleRandomizePick = () => {
    const randomSlot = Math.floor(Math.random() * leagueSize) + 1;
    setUserDraftSlot(randomSlot);
  };

  // Execute a draft pick for a team into an eligible slot
  const commitDraftPick = useCallback(
    (teamId, player, isAutoPick = false) => {
      if (!player) return;

      const targetTeam = teams.find((t) => t.id === teamId);
      if (!targetTeam) return;

      const slotIndex = findBestOpenSlotIndex(targetTeam.slots, formationSlots, player);
      if (slotIndex === -1) return;

      const assignedSlot = formationSlots[slotIndex];
      const round = Math.floor(currentPickIndex / leagueSize) + 1;
      const pickInRound = (currentPickIndex % leagueSize) + 1;

      setTeams((prev) =>
        prev.map((t) => {
          if (t.id !== teamId) return t;
          const updatedSlots = [...t.slots];
          updatedSlots[slotIndex] = {
            ...updatedSlots[slotIndex],
            player
          };
          return { ...t, slots: updatedSlots };
        })
      );

      setDraftedIds((prev) => {
        const next = new Set(prev);
        next.add(player.id);
        return next;
      });

      setUserQueue((prev) => prev.filter((id) => id !== player.id));

      const record = {
        overall: currentPickIndex + 1,
        round,
        pickInRound,
        teamId: targetTeam.id,
        teamName: targetTeam.name,
        draftSlot: targetTeam.draftSlot,
        isUser: targetTeam.isUser,
        slotName: assignedSlot.name,
        player,
        isAutoPick
      };

      setPickHistory((prev) => [...prev, record]);
      setLastPickBanner(record);

      const nextPickIdx = currentPickIndex + 1;
      if (nextPickIdx >= totalPicks) {
        setCurrentPickIndex(nextPickIdx);
        setDraftPhase('COMPLETE');
        setIsPaused(false);
      } else {
        setCurrentPickIndex(nextPickIdx);
        setSecondsLeft(pickTimerSeconds);
      }
    },
    [teams, formationSlots, currentPickIndex, leagueSize, totalPicks, pickTimerSeconds]
  );

  // Auto-draft for user when countdown reaches 0
  const triggerUserAutoDraft = useCallback(() => {
    if (!userTeam) return;

    // 1. Check user's queue in order for first available player with an open eligible slot
    for (const queuedId of userQueue) {
      const candidate = availablePlayers.find((p) => p.id === queuedId);
      if (candidate && findBestOpenSlotIndex(userTeam.slots, formationSlots, candidate) !== -1) {
        commitDraftPick(userTeam.id, candidate, true);
        return;
      }
    }

    // 2. Otherwise pick highest-rated available player matching an open slot
    const bestAvailable = availablePlayers.find(
      (p) => findBestOpenSlotIndex(userTeam.slots, formationSlots, p) !== -1
    );
    if (bestAvailable) {
      commitDraftPick(userTeam.id, bestAvailable, true);
    }
  }, [userTeam, userQueue, availablePlayers, formationSlots, commitDraftPick]);

  // Countdown Timer Effect when User is On the Clock
  useEffect(() => {
    if (draftPhase !== 'LIVE' || isPaused || !isUserOnClock) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [draftPhase, isPaused, isUserOnClock, currentPickIndex]);

  // Trigger auto-draft immediately when secondsLeft hits 0 on user turn
  useEffect(() => {
    if (draftPhase === 'LIVE' && !isPaused && isUserOnClock && secondsLeft === 0) {
      triggerUserAutoDraft();
    }
  }, [draftPhase, isPaused, isUserOnClock, secondsLeft, triggerUserAutoDraft]);

  // Smart CPU AI Auto-Pick Effect (~600ms cadence)
  useEffect(() => {
    if (draftPhase !== 'LIVE' || isPaused || !currentTurn.activeTeam || currentTurn.activeTeam.isUser) {
      return;
    }

    const cpuTeam = currentTurn.activeTeam;
    const timeoutId = setTimeout(() => {
      const chosen = selectCpuDraftPick(cpuTeam, availablePlayers, formationSlots, currentTurn.round);
      if (chosen) {
        commitDraftPick(cpuTeam.id, chosen, false);
      }
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [draftPhase, isPaused, currentTurn, availablePlayers, formationSlots, commitDraftPick]);

  // Toggle player in User Queue
  const toggleQueuePlayer = (playerId) => {
    setUserQueue((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const moveQueueItem = (index, direction) => {
    setUserQueue((prev) => {
      const next = [...prev];
      const swapIdx = index + direction;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
      return next;
    });
  };

  // User Draft Stats Summary
  const userRosterSummary = useMemo(() => {
    if (!userTeam) return { filled: 0, avgRating: '0.00', totalFP: '0.0' };
    const filledPlayers = userTeam.slots.map((s) => s.player).filter(Boolean);
    const ratingSum = filledPlayers.reduce((acc, p) => acc + Number(p.player_performance_rating || 4.0), 0);
    const fpSum = filledPlayers.reduce((acc, p) => acc + Number(p.fantasyPts || 120), 0);
    return {
      filled: filledPlayers.length,
      avgRating: filledPlayers.length > 0 ? (ratingSum / filledPlayers.length).toFixed(2) : '0.00',
      totalFP: fpSum.toFixed(1)
    };
  }, [userTeam]);

  // Save Drafted 11-Player Roster & Navigate to /lineups
  const handleSaveAndOpenLineup = async () => {
    if (!userTeam) return;
    setSavingLineup(true);

    const newLineupId = generateUuid();
    const draftedLineup = {
      id: newLineupId,
      name: userTeam.name || teamName || 'Drafted Roster 2026',
      formation: selectedFormation,
      personal_rating: 5,
      slots: userTeam.slots,
      updated_at: new Date().toISOString()
    };

    const dbPayload = {
      id: newLineupId,
      name: draftedLineup.name,
      formation: draftedLineup.formation,
      personal_rating: 5,
      slots: userTeam.slots.map((s) => ({
        slot: s.slotName,
        playerId: s.player?.id,
        playerName: s.player?.name,
        team: s.player?.teamAbbr || s.player?.team,
        rating: s.player?.player_performance_rating
      })),
      updated_at: draftedLineup.updated_at
    };

    try {
      // Save individual lineup key for Lineup Builder / Opponent Selector
      localStorage.setItem(`gridiron_lineup_${newLineupId}`, JSON.stringify(dbPayload));

      const userUuid = toUuidOrNull(user?.id);
      if (isSupabaseConfigured && userUuid) {
        const { error } = await supabase
          .from('custom_lineups')
          .upsert({ ...dbPayload, user_id: userUuid });

        if (error) {
          console.warn('Supabase drafted lineup save notice:', error.message);
        }
      } else {
        // Guest persistence under 'gridiron_guest_lineups'
        try {
          const existingRaw = localStorage.getItem('gridiron_guest_lineups');
          const existing = existingRaw ? JSON.parse(existingRaw) : [];
          const list = Array.isArray(existing) ? existing : [];
          localStorage.setItem('gridiron_guest_lineups', JSON.stringify([dbPayload, ...list]));
        } catch {
          // ignore localStorage serialization errors
        }
      }

      sessionStorage.setItem('gridiron_pending_drafted_lineup', JSON.stringify(draftedLineup));
    } catch (err) {
      console.warn('Draft save notice:', err);
    } finally {
      setSavingLineup(false);
      navigate('/lineups', { state: { draftedLineup } });
    }
  };

  // Build Snake Draft Grid grouped by Round (1..11)
  const draftGridByRound = useMemo(() => {
    const rounds = [];
    for (let r = 1; r <= 11; r++) {
      const picks = pickHistory.filter((p) => p.round === r);
      rounds.push({ round: r, picks });
    }
    return rounds;
  }, [pickHistory]);

  const timerPct = Math.max(0, Math.min(100, Math.round((secondsLeft / pickTimerSeconds) * 100)));

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.78rem',
              fontFamily: 'var(--font-tech)',
              fontWeight: 800,
              color: '#38bdf8',
              marginBottom: 4
            }}
          >
            <Zap size={14} /> 2026 NFL LIVE TIMED SNAKE DRAFT ROOM
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.6rem',
              lineHeight: 1,
              textTransform: 'uppercase',
              margin: 0
            }}
          >
            LIVE SNAKE <span style={{ color: '#38bdf8' }}>DRAFT ROOM</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Compete against smart CPU franchises across 11 snake rounds, then launch your drafted squad directly into the 2D Field & Matchup Simulator.
          </p>
        </div>

        {draftPhase !== 'LOBBY' && (
          <button
            type="button"
            onClick={() => {
              setIsPaused(false);
              setDraftPhase('LOBBY');
            }}
            style={{
              backgroundColor: 'var(--card-slate)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-primary)',
              padding: '8px 14px',
              borderRadius: 6,
              fontFamily: 'var(--font-tech)',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={15} style={{ color: '#38bdf8' }} />
            New Draft Lobby
          </button>
        )}
      </div>

      {/* PHASE 1: PRE-DRAFT LOBBY CONFIGURATION */}
      {draftPhase === 'LOBBY' && (
        <div
          style={{
            backgroundColor: '#111827',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: 12,
            padding: '1.75rem',
            boxShadow: '0 18px 40px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
              paddingBottom: '1rem',
              borderBottom: '1px solid rgba(148, 163, 184, 0.22)',
              marginBottom: '1.5rem'
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: '#f8fafc' }}>
                CONFIGURE DRAFT ROOM SETTINGS
              </h2>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                {masterPlayers.length} active 2026 NFL players loaded and ranked by consensus Performance Rating.
              </span>
            </div>
            <span
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.14)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: 6,
                padding: '5px 12px',
                fontFamily: 'var(--font-tech)',
                fontSize: '0.78rem',
                fontWeight: 800
              }}
            >
              11 ROUNDS • SNAKE ORDER
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.5rem'
            }}
          >
            {/* Team Name */}
            <div style={{ backgroundColor: '#0a0f1d', border: '1px solid var(--card-border)', borderRadius: 8, padding: '1rem' }}>
              <label
                htmlFor="draft-team-name"
                style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-tech)', fontWeight: 800, color: '#94a3b8', marginBottom: 8 }}
              >
                YOUR TEAM NAME
              </label>
              <input
                id="draft-team-name"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your franchise name..."
                style={{
                  width: '100%',
                  backgroundColor: '#111827',
                  color: '#f8fafc',
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  borderRadius: 6,
                  padding: '9px 12px',
                  fontFamily: 'var(--font-tech)',
                  fontSize: '0.92rem',
                  fontWeight: 700
                }}
              />
            </div>

            {/* League Size */}
            <div style={{ backgroundColor: '#0a0f1d', border: '1px solid var(--card-border)', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-tech)', fontWeight: 800, color: '#94a3b8', marginBottom: 8 }}>
                LEAGUE SIZE (1 USER + CPU OPPONENTS)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[8, 10, 12].map((size) => {
                  const active = leagueSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setLeagueSize(size)}
                      style={{
                        backgroundColor: active ? '#38bdf8' : '#111827',
                        color: active ? '#0a0f1d' : '#cbd5e1',
                        border: active ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.28)',
                        borderRadius: 6,
                        padding: '9px 6px',
                        fontFamily: 'var(--font-tech)',
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {size} Teams
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pick Timer */}
            <div style={{ backgroundColor: '#0a0f1d', border: '1px solid var(--card-border)', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-tech)', fontWeight: 800, color: '#94a3b8', marginBottom: 8 }}>
                PICK CLOCK TIMER
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { secs: 15, label: '15s Blitz' },
                  { secs: 30, label: '30s Std' },
                  { secs: 60, label: '60s Classic' }
                ].map((opt) => {
                  const active = pickTimerSeconds === opt.secs;
                  return (
                    <button
                      key={opt.secs}
                      type="button"
                      onClick={() => setPickTimerSeconds(opt.secs)}
                      style={{
                        backgroundColor: active ? '#38bdf8' : '#111827',
                        color: active ? '#0a0f1d' : '#cbd5e1',
                        border: active ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.28)',
                        borderRadius: 6,
                        padding: '9px 6px',
                        fontFamily: 'var(--font-tech)',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Draft Position Selector + Randomize */}
            <div style={{ backgroundColor: '#0a0f1d', border: '1px solid var(--card-border)', borderRadius: 8, padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-tech)', fontWeight: 800, color: '#94a3b8' }}>
                  YOUR DRAFT POSITION (1 – {leagueSize})
                </span>
                <button
                  type="button"
                  onClick={handleRandomizePick}
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.14)',
                    border: '1px solid rgba(56, 189, 248, 0.45)',
                    color: '#38bdf8',
                    borderRadius: 4,
                    padding: '3px 8px',
                    fontFamily: 'var(--font-tech)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer'
                  }}
                >
                  <Shuffle size={12} /> Randomize Pick
                </button>
              </div>
              <select
                value={userDraftSlot}
                onChange={(e) => setUserDraftSlot(Number(e.target.value))}
                style={{
                  width: '100%',
                  backgroundColor: '#111827',
                  color: '#f8fafc',
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  borderRadius: 6,
                  padding: '9px 10px',
                  fontFamily: 'var(--font-tech)',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {Array.from({ length: leagueSize }, (_, i) => i + 1).map((slotNum) => (
                  <option key={slotNum} value={slotNum}>
                    Pick #{slotNum} {slotNum === 1 ? '(First Overall)' : slotNum === leagueSize ? '(Round Turn)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Roster Format Selector */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-tech)', fontWeight: 800, color: '#94a3b8', marginBottom: 8 }}>
              ROSTER FORMATION FORMAT (11 ROUNDS)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {Object.keys(FORMATION_PRESETS).map((key) => {
                const preset = FORMATION_PRESETS[key];
                const active = selectedFormation === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedFormation(key)}
                    style={{
                      textAlign: 'left',
                      backgroundColor: active ? 'rgba(56, 189, 248, 0.12)' : '#0a0f1d',
                      border: active ? '2px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.28)',
                      borderRadius: 8,
                      padding: '0.95rem 1rem',
                      cursor: 'pointer',
                      color: '#f8fafc'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-tech)', fontSize: '0.7rem', fontWeight: 800, color: '#38bdf8' }}>
                        {preset.category} • 11 SLOTS
                      </span>
                      {active && <CheckCircle2 size={16} style={{ color: '#38bdf8' }} />}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', lineHeight: 1.1 }}>{preset.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>{preset.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Live Draft CTA */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleStartDraft}
              style={{
                backgroundColor: '#38bdf8',
                color: '#0a0f1d',
                border: 'none',
                borderRadius: 8,
                padding: '0.95rem 2rem',
                fontFamily: 'var(--font-tech)',
                fontSize: '1rem',
                fontWeight: 900,
                letterSpacing: '0.04em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                boxShadow: '0 0 22px rgba(56, 189, 248, 0.35)'
              }}
            >
              <Play size={18} fill="#0a0f1d" />
              Start Live Draft ({leagueSize} Teams • {pickTimerSeconds}s Clock)
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2 & 3: LIVE DRAFT ROOM & POST-DRAFT RECAP */}
      {draftPhase !== 'LOBBY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Post-Draft Recap Banner */}
          {draftPhase === 'COMPLETE' && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.22) 0%, #111827 75%)',
                border: '1.5px solid #38bdf8',
                borderRadius: 12,
                padding: '1.35rem 1.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                boxShadow: '0 0 26px rgba(56, 189, 248, 0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    backgroundColor: '#38bdf8',
                    color: '#0a0f1d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Trophy size={28} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-tech)', fontSize: '0.76rem', fontWeight: 800, color: '#38bdf8' }}>
                    11-ROUND SNAKE DRAFT COMPLETE
                  </div>
                  <h2 style={{ margin: '2px 0 4px', fontFamily: 'var(--font-display)', fontSize: '2rem', lineHeight: 1, color: '#f8fafc' }}>
                    {userTeam?.name || teamName}
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontFamily: 'var(--font-tech)' }}>
                    FINAL ROSTER RATING: <strong style={{ color: '#38bdf8' }}>{userRosterSummary.avgRating} / 5.00</strong> • PROJ 2026 FPTS:{' '}
                    <strong style={{ color: '#4ade80' }}>{userRosterSummary.totalFP}</strong> • FORMAT: {selectedFormation}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={savingLineup}
                onClick={handleSaveAndOpenLineup}
                style={{
                  backgroundColor: '#38bdf8',
                  color: '#0a0f1d',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.9rem 1.5rem',
                  fontFamily: 'var(--font-tech)',
                  fontSize: '0.92rem',
                  fontWeight: 900,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: savingLineup ? 'wait' : 'pointer',
                  boxShadow: '0 0 18px rgba(56, 189, 248, 0.35)'
                }}
              >
                <Layers size={17} />
                {savingLineup ? 'Saving Roster...' : 'Save & Open in Lineup Builder'}
                <ArrowRight size={17} />
              </button>
            </div>
          )}

          {/* Top Live Draft Ticker */}
          {draftPhase === 'LIVE' && (
            <div
              style={{
                backgroundColor: '#111827',
                border: isUserOnClock ? '1.5px solid #38bdf8' : '1px solid var(--card-border)',
                borderRadius: 10,
                padding: '1rem 1.25rem',
                boxShadow: isUserOnClock ? '0 0 22px rgba(56, 189, 248, 0.25)' : 'none'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div
                    style={{
                      backgroundColor: '#0a0f1d',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontFamily: 'var(--font-tech)',
                      fontWeight: 900,
                      fontSize: '0.9rem',
                      color: '#38bdf8'
                    }}
                  >
                    RD {currentTurn.round} • PICK {currentTurn.pickInRound}
                    <span style={{ color: '#94a3b8', fontWeight: 700, marginLeft: 8 }}>
                      (#{currentTurn.overallPick} / {totalPicks})
                    </span>
                  </div>

                  {isUserOnClock ? (
                    <span
                      className="animate-pulse"
                      style={{
                        backgroundColor: '#38bdf8',
                        color: '#0a0f1d',
                        borderRadius: 6,
                        padding: '5px 12px',
                        fontFamily: 'var(--font-tech)',
                        fontSize: '0.82rem',
                        fontWeight: 900,
                        letterSpacing: '0.06em'
                      }}
                    >
                      ON THE CLOCK — YOUR PICK!
                    </span>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-tech)', fontSize: '0.88rem', fontWeight: 700, color: '#cbd5e1' }}>
                      ON THE CLOCK: <strong style={{ color: '#f8fafc' }}>{currentTurn.activeTeam?.name}</strong> (Slot #{currentTurn.activeTeam?.draftSlot})
                    </span>
                  )}

                  {lastPickBanner && (
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'var(--font-tech)' }}>
                      LAST PICK: <strong style={{ color: '#cbd5e1' }}>{lastPickBanner.player.name}</strong> ({lastPickBanner.slotName}) → {lastPickBanner.teamName}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {isUserOnClock && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: secondsLeft <= 7 ? 'rgba(239, 68, 68, 0.2)' : '#0a0f1d',
                        border: secondsLeft <= 7 ? '1px solid #ef4444' : '1px solid rgba(56, 189, 248, 0.4)',
                        color: secondsLeft <= 7 ? '#f87171' : '#38bdf8',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontFamily: 'var(--font-tech)',
                        fontSize: '1.05rem',
                        fontWeight: 900
                      }}
                    >
                      <Clock size={16} />
                      {secondsLeft}s
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsPaused((p) => !p)}
                    style={{
                      backgroundColor: isPaused ? '#38bdf8' : '#0a0f1d',
                      color: isPaused ? '#0a0f1d' : '#cbd5e1',
                      border: '1px solid rgba(148, 163, 184, 0.35)',
                      borderRadius: 6,
                      padding: '7px 14px',
                      fontFamily: 'var(--font-tech)',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer'
                    }}
                  >
                    {isPaused ? <Play size={15} fill="#0a0f1d" /> : <Pause size={15} />}
                    {isPaused ? 'Resume Draft' : 'Pause'}
                  </button>
                </div>
              </div>

              {/* Visual Countdown Progress Bar */}
              {isUserOnClock && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    height: 7,
                    borderRadius: 999,
                    backgroundColor: '#1e293b',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${timerPct}%`,
                      height: '100%',
                      backgroundColor: secondsLeft <= 7 ? '#ef4444' : '#38bdf8',
                      transition: 'width 0.3s linear'
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Main Draft Workspace: Available Players Board (Left/Center) + Roster/Queue/Grid Sidebar (Right) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '1.25rem',
              alignItems: 'start'
            }}
          >
            {/* LEFT/CENTER: Main Available Players Draft Board */}
            <div
              style={{
                gridColumn: 'span 1',
                backgroundColor: '#111827',
                border: '1px solid var(--card-border)',
                borderRadius: 10,
                overflow: 'hidden'
              }}
            >
              {/* Search & Position Filter Toolbar */}
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--card-border)', backgroundColor: '#0a0f1d' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ fontFamily: 'var(--font-tech)', fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>
                    AVAILABLE PLAYERS BOARD ({filteredAvailablePlayers.length})
                  </div>
                  <div style={{ position: 'relative', flex: '1 1 210px', maxWidth: 300 }}>
                    <Search
                      size={15}
                      style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search name or team..."
                      style={{
                        width: '100%',
                        backgroundColor: '#111827',
                        color: '#f8fafc',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        borderRadius: 6,
                        padding: '6px 10px 6px 32px',
                        fontFamily: 'var(--font-tech)',
                        fontSize: '0.84rem'
                      }}
                    />
                  </div>
                </div>

                {/* Position Pills + Open Slots Toggle */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {positionTabs.map((pos) => {
                      const active = positionFilter === pos;
                      return (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setPositionFilter(pos)}
                          style={{
                            backgroundColor: active ? '#38bdf8' : '#111827',
                            color: active ? '#0a0f1d' : '#cbd5e1',
                            border: active ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)',
                            borderRadius: 5,
                            padding: '4px 10px',
                            fontFamily: 'var(--font-tech)',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {pos}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenSlotsOnly((prev) => !prev)}
                    style={{
                      backgroundColor: openSlotsOnly ? 'rgba(74, 222, 128, 0.14)' : '#111827',
                      color: openSlotsOnly ? '#4ade80' : '#94a3b8',
                      border: openSlotsOnly ? '1px solid rgba(74, 222, 128, 0.5)' : '1px solid rgba(148, 163, 184, 0.25)',
                      borderRadius: 5,
                      padding: '4px 10px',
                      fontFamily: 'var(--font-tech)',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    title="Filter ALL view to players eligible for your remaining open roster slots"
                  >
                    {openSlotsOnly ? '✓ Open Slots Only' : 'Show Full Slots Too'}
                  </button>
                </div>
              </div>

              {/* Scrollable Player Pool Table */}
              <div style={{ maxHeight: 620, overflowY: 'auto' }}>
                {filteredAvailablePlayers.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                    No available players match this filter.
                  </div>
                ) : (
                  filteredAvailablePlayers.map((player) => {
                    const pos = getPos(player);
                    const isQueued = userQueue.includes(player.id);
                    const openSlotIdx = userTeam
                      ? findBestOpenSlotIndex(userTeam.slots, formationSlots, player)
                      : -1;
                    const canUserDraftNow =
                      draftPhase === 'LIVE' && !isPaused && isUserOnClock && openSlotIdx !== -1;

                    return (
                      <div
                        key={player.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid rgba(148, 163, 184, 0.14)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-tech)',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              color: '#94a3b8',
                              width: 30,
                              flexShrink: 0
                            }}
                          >
                            #{player.draftRank}
                          </span>

                          <img
                            src={getAvatarUrl(player)}
                            alt={player.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                player.name || 'NFL'
                              )}&background=0a0f1d&color=38bdf8&bold=true&size=128`;
                            }}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1.5px solid rgba(56, 189, 248, 0.5)',
                              backgroundColor: '#0a0f1d',
                              flexShrink: 0
                            }}
                          />

                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  fontWeight: 800,
                                  fontSize: '0.94rem',
                                  color: '#f8fafc',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {player.name}
                              </span>
                              <span
                                style={{
                                  backgroundColor: 'rgba(56, 189, 248, 0.16)',
                                  color: '#38bdf8',
                                  borderRadius: 4,
                                  padding: '1px 6px',
                                  fontFamily: 'var(--font-tech)',
                                  fontSize: '0.68rem',
                                  fontWeight: 800
                                }}
                              >
                                {pos}
                              </span>
                              <span
                                style={{
                                  backgroundColor: '#0a0f1d',
                                  color: '#cbd5e1',
                                  border: '1px solid rgba(148, 163, 184, 0.25)',
                                  borderRadius: 4,
                                  padding: '1px 6px',
                                  fontFamily: 'var(--font-tech)',
                                  fontSize: '0.68rem',
                                  fontWeight: 700
                                }}
                              >
                                {player.teamAbbr || player.team}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontFamily: 'var(--font-tech)', marginTop: 2 }}>
                              PROJ FPTS: <strong style={{ color: '#cbd5e1' }}>{Number(player.fantasyPts || 120).toFixed(1)}</strong> • RATING:{' '}
                              <strong style={{ color: '#4ade80' }}>{Number(player.player_performance_rating || 4.0).toFixed(2)}</strong>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => toggleQueuePlayer(player.id)}
                            title={isQueued ? 'Remove from Queue' : 'Add to Draft Queue'}
                            style={{
                              backgroundColor: isQueued ? 'rgba(56, 189, 248, 0.16)' : '#0a0f1d',
                              border: isQueued ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.28)',
                              color: isQueued ? '#38bdf8' : '#94a3b8',
                              borderRadius: 6,
                              padding: '6px 9px',
                              fontFamily: 'var(--font-tech)',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              cursor: 'pointer'
                            }}
                          >
                            <Star size={13} fill={isQueued ? '#38bdf8' : 'none'} />
                            {isQueued ? 'Queued' : 'Queue'}
                          </button>

                          <button
                            type="button"
                            disabled={!canUserDraftNow}
                            onClick={() => canUserDraftNow && commitDraftPick(userTeam.id, player, false)}
                            title={
                              openSlotIdx === -1
                                ? `No open ${pos} or flex slot left on your roster`
                                : !isUserOnClock
                                ? 'Wait for your turn on the clock'
                                : `Draft ${player.name}`
                            }
                            style={{
                              backgroundColor: canUserDraftNow ? '#38bdf8' : '#1e293b',
                              color: canUserDraftNow ? '#0a0f1d' : '#64748b',
                              border: 'none',
                              borderRadius: 6,
                              padding: '6px 12px',
                              fontFamily: 'var(--font-tech)',
                              fontSize: '0.78rem',
                              fontWeight: 900,
                              cursor: canUserDraftNow ? 'pointer' : 'not-allowed'
                            }}
                          >
                            {openSlotIdx === -1 ? 'Slot Full' : 'Draft'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT SIDEBAR: Tabbed Roster / Queue / Snake Draft Grid */}
            <div
              style={{
                backgroundColor: '#111827',
                border: '1px solid var(--card-border)',
                borderRadius: 10,
                overflow: 'hidden'
              }}
            >
              {/* Sidebar Tabs */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  backgroundColor: '#0a0f1d',
                  borderBottom: '1px solid var(--card-border)'
                }}
              >
                {[
                  { id: 'ROSTER', label: `My Roster (${userRosterSummary.filled}/11)`, icon: Users },
                  { id: 'QUEUE', label: `Queue (${userQueue.length})`, icon: ListOrdered },
                  { id: 'GRID', label: `Draft Grid (${pickHistory.length})`, icon: Grid }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = sidebarTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSidebarTab(tab.id)}
                      style={{
                        backgroundColor: active ? 'rgba(56, 189, 248, 0.14)' : 'transparent',
                        color: active ? '#38bdf8' : '#94a3b8',
                        border: 'none',
                        borderBottom: active ? '2px solid #38bdf8' : '2px solid transparent',
                        padding: '0.8rem 0.5rem',
                        fontFamily: 'var(--font-tech)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        cursor: 'pointer'
                      }}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: MY 11-SLOT ROSTER */}
              {sidebarTab === 'ROSTER' && (
                <div style={{ padding: '0.9rem', maxHeight: 620, overflowY: 'auto' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.76rem',
                      fontFamily: 'var(--font-tech)',
                      color: '#94a3b8',
                      marginBottom: '0.75rem'
                    }}
                  >
                    <span>FORMAT: {selectedFormation}</span>
                    <span>
                      AVG: <strong style={{ color: '#38bdf8' }}>{userRosterSummary.avgRating}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(userTeam?.slots || []).map((slotItem, idx) => {
                      const rule = formationSlots[idx];
                      const player = slotItem.player;
                      return (
                        <div
                          key={slotItem.slotId}
                          style={{
                            backgroundColor: '#0a0f1d',
                            border: player ? '1px solid rgba(56, 189, 248, 0.35)' : '1px dashed rgba(148, 163, 184, 0.25)',
                            borderRadius: 6,
                            padding: '0.55rem 0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <span
                              style={{
                                fontFamily: 'var(--font-tech)',
                                fontWeight: 900,
                                fontSize: '0.76rem',
                                color: '#38bdf8',
                                width: 64,
                                flexShrink: 0
                              }}
                            >
                              {slotItem.slotName}
                            </span>

                            {player ? (
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>
                                  {player.name}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-tech)' }}>
                                  {getPos(player)} • {player.teamAbbr || player.team}
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                                Open [{rule?.eligible?.join('/')}]
                              </span>
                            )}
                          </div>

                          {player && (
                            <span style={{ fontFamily: 'var(--font-tech)', fontWeight: 800, fontSize: '0.8rem', color: '#4ade80' }}>
                              {Number(player.player_performance_rating || 4.0).toFixed(2)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: MY QUEUE */}
              {sidebarTab === 'QUEUE' && (
                <div style={{ padding: '0.9rem', maxHeight: 620, overflowY: 'auto' }}>
                  {userQueue.length === 0 ? (
                    <div
                      style={{
                        padding: '1.5rem 1rem',
                        textAlign: 'center',
                        fontSize: '0.84rem',
                        color: '#94a3b8',
                        backgroundColor: '#0a0f1d',
                        borderRadius: 8,
                        border: '1px dashed rgba(148, 163, 184, 0.25)'
                      }}
                    >
                      Your draft queue is empty. Click <strong style={{ color: '#38bdf8' }}>Queue</strong> on players to prioritize them for auto-drafting.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {userQueue.map((qId, qIdx) => {
                        const player = masterPlayers.find((p) => p.id === qId);
                        if (!player) return null;
                        const openSlotIdx = userTeam
                          ? findBestOpenSlotIndex(userTeam.slots, formationSlots, player)
                          : -1;
                        const canDraft = isUserOnClock && !isPaused && openSlotIdx !== -1;

                        return (
                          <div
                            key={qId}
                            style={{
                              backgroundColor: '#0a0f1d',
                              border: '1px solid rgba(148, 163, 184, 0.25)',
                              borderRadius: 6,
                              padding: '0.6rem 0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f8fafc' }}>
                                {qIdx + 1}. {player.name}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-tech)' }}>
                                {getPos(player)} • {player.teamAbbr || player.team} • RTG{' '}
                                {Number(player.player_performance_rating || 4.0).toFixed(2)}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {canDraft && (
                                <button
                                  type="button"
                                  onClick={() => commitDraftPick(userTeam.id, player, false)}
                                  style={{
                                    backgroundColor: '#38bdf8',
                                    color: '#0a0f1d',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '4px 8px',
                                    fontFamily: 'var(--font-tech)',
                                    fontSize: '0.7rem',
                                    fontWeight: 900,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Draft
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => moveQueueItem(qIdx, -1)}
                                disabled={qIdx === 0}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
                                title="Move Up"
                              >
                                <ChevronUp size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveQueueItem(qIdx, 1)}
                                disabled={qIdx === userQueue.length - 1}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
                                title="Move Down"
                              >
                                <ChevronDown size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleQueuePlayer(qId)}
                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 2 }}
                                title="Remove from Queue"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: FULL SNAKE DRAFT GRID (ROUND-BY-ROUND HISTORY) */}
              {sidebarTab === 'GRID' && (
                <div style={{ padding: '0.9rem', maxHeight: 620, overflowY: 'auto' }}>
                  {pickHistory.length === 0 ? (
                    <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.84rem' }}>
                      No picks completed yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                      {draftGridByRound
                        .filter((r) => r.picks.length > 0)
                        .reverse()
                        .map((roundGroup) => (
                          <div key={roundGroup.round}>
                            <div
                              style={{
                                fontFamily: 'var(--font-tech)',
                                fontSize: '0.74rem',
                                fontWeight: 900,
                                color: '#38bdf8',
                                marginBottom: 6,
                                display: 'flex',
                                justifyContent: 'space-between'
                              }}
                            >
                              <span>ROUND {roundGroup.round}</span>
                              <span style={{ color: '#94a3b8' }}>
                                {roundGroup.round % 2 === 1 ? 'ORDER: 1 → ' + leagueSize : 'ORDER: ' + leagueSize + ' → 1'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {roundGroup.picks.map((pick) => (
                                <div
                                  key={pick.overall}
                                  style={{
                                    backgroundColor: pick.isUser ? 'rgba(56, 189, 248, 0.14)' : '#0a0f1d',
                                    border: pick.isUser
                                      ? '1px solid rgba(56, 189, 248, 0.5)'
                                      : '1px solid rgba(148, 163, 184, 0.18)',
                                    borderRadius: 5,
                                    padding: '0.45rem 0.65rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 8,
                                    fontSize: '0.78rem'
                                  }}
                                >
                                  <div style={{ minWidth: 0 }}>
                                    <span style={{ fontFamily: 'var(--font-tech)', color: '#94a3b8', marginRight: 6 }}>
                                      {pick.round}.{String(pick.pickInRound).padStart(2, '0')}
                                    </span>
                                    <strong style={{ color: '#f8fafc' }}>{pick.player.name}</strong>
                                    <span style={{ color: '#38bdf8', marginLeft: 6, fontFamily: 'var(--font-tech)', fontWeight: 700 }}>
                                      {getPos(pick.player)}
                                    </span>
                                  </div>
                                  <span
                                    style={{
                                      fontFamily: 'var(--font-tech)',
                                      fontSize: '0.7rem',
                                      color: pick.isUser ? '#38bdf8' : '#94a3b8',
                                      fontWeight: pick.isUser ? 800 : 600,
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {pick.isUser ? 'YOU' : pick.teamName.replace(' (CPU)', '')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
