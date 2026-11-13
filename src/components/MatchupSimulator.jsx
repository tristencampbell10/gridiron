import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Trophy,
  Play,
  RotateCcw,
  Shield,
  Zap,
  Award,
  Flame,
  Users,
  ChevronDown,
  ChevronUp,
  Activity,
  X,
  CheckCircle2,
  TrendingUp,
  Trash2,
  History,
  Clock
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const GUEST_MATCHUPS_KEY = 'gridiron_guest_matchups';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const toUuidOrNull = (val) => (typeof val === 'string' && UUID_REGEX.test(val) ? val : null);

const DEFAULT_SLOTS = [
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
];

const getAvatarUrl = (player, color = '38bdf8') => {
  if (player?.avatar_url && typeof player.avatar_url === 'string' && player.avatar_url.trim() !== '') {
    return player.avatar_url;
  }
  const cleanName = encodeURIComponent(player?.name || 'NFL Star');
  return `https://ui-avatars.com/api/?name=${cleanName}&background=0a0f1d&color=${color}&bold=true&size=128`;
};

const isActivePlayer = (p) => {
  if (!p) return false;
  const status = String(p.status || 'ACTIVE').toUpperCase();
  return status === 'ACTIVE' || status === 'PROBABLE' || status === 'QUESTIONABLE';
};

const getPos = (p) => p?.pos || p?.position || 'FLEX';

const getTeamAbbr = (p) => p?.teamAbbr || p?.team || 'NFL';

/**
 * Deterministic seeded PRNG for Mystery Draft CPU rosters
 */
function seededValue(seed, index) {
  const x = Math.sin(seed * 9301 + index * 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * Build a dynamic 11-player CPU roster matching current formation slots
 */
function buildCpuRoster(allPlayers, formationSlots, config = {}) {
  const {
    priorityTeams = [],
    tier = 'ALL_PRO', // 'ALL_PRO' | 'COMPETITIVE' | 'ROOKIE' | 'AIR_RAID' | 'GROUND_POUND' | 'RANDOM'
    seed = 1
  } = Array.isArray(config) ? { priorityTeams: config } : config;

  const usedIds = new Set();
  const activePool = (allPlayers || []).filter(isActivePlayer);
  const fallbackPool = allPlayers || [];

  return formationSlots.map((slot, slotIdx) => {
    const eligibleSet = new Set(slot.eligible || []);
    const candidates = (activePool.length > 0 ? activePool : fallbackPool).filter(
      (p) => eligibleSet.has(getPos(p)) && !usedIds.has(p.id)
    );

    const sorted = [...candidates].sort((a, b) => {
      const aPriority = priorityTeams.includes(getTeamAbbr(a)) ? 1 : 0;
      const bPriority = priorityTeams.includes(getTeamAbbr(b)) ? 1 : 0;
      if (aPriority !== bPriority) return bPriority - aPriority;

      if (tier === 'AIR_RAID') {
        const aAir =
          Number(a.passYds || 0) * 0.04 +
          Number(a.recYds || 0) * 0.08 +
          Number(a.passTd || 0) * 3 +
          Number(a.recTd || 0) * 4 +
          Number(a.player_performance_rating || 4.0) * 12;
        const bAir =
          Number(b.passYds || 0) * 0.04 +
          Number(b.recYds || 0) * 0.08 +
          Number(b.passTd || 0) * 3 +
          Number(b.recTd || 0) * 4 +
          Number(b.player_performance_rating || 4.0) * 12;
        return bAir - aAir;
      }

      if (tier === 'GROUND_POUND') {
        const aGround =
          Number(a.rushYds || 0) * 0.09 +
          Number(a.rushTd || 0) * 4 +
          Number(a.tackles || 0) * 0.6 +
          Number(a.sacks || 0) * 3 +
          Number(a.player_performance_rating || 4.0) * 12;
        const bGround =
          Number(b.rushYds || 0) * 0.09 +
          Number(b.rushTd || 0) * 4 +
          Number(b.tackles || 0) * 0.6 +
          Number(b.sacks || 0) * 3 +
          Number(b.player_performance_rating || 4.0) * 12;
        return bGround - aGround;
      }

      const ratingDiff = Number(b.player_performance_rating || 4.0) - Number(a.player_performance_rating || 4.0);
      if (Math.abs(ratingDiff) > 0.01) return ratingDiff;

      return Number(b.fantasyPts || 100) - Number(a.fantasyPts || 100);
    });

    let chosen = null;
    if (sorted.length > 0) {
      if (tier === 'COMPETITIVE') {
        // Pick upper-mid starters (roughly 25%–50% down the sorted list)
        const targetIdx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.3) + (slotIdx % 3));
        chosen = sorted[targetIdx];
      } else if (tier === 'ROOKIE') {
        // Pick lower-rated starters for a warmup matchup
        const targetIdx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.68) + (slotIdx % 3));
        chosen = sorted[targetIdx];
      } else if (tier === 'RANDOM') {
        const randIdx = Math.floor(seededValue(seed, slotIdx + 1) * Math.min(sorted.length, 18));
        chosen = sorted[randIdx];
      } else {
        chosen = sorted[0];
      }
    }

    if (!chosen) {
      chosen = fallbackPool.find((p) => eligibleSet.has(getPos(p))) || null;
    }

    if (chosen?.id) {
      usedIds.add(chosen.id);
    }

    return {
      slotId: slot.id,
      slotName: slot.name,
      player: chosen
    };
  });
}

/**
 * Compute aggregate roster profile metrics for probability & simulation
 */
function computeRosterMetrics(slotsList) {
  const players = (slotsList || []).map((s) => s.player || s).filter(Boolean);
  if (players.length === 0) {
    return {
      count: 0,
      avgRating: 0,
      totalFantasyPts: 0,
      passingScore: 0,
      rushingScore: 0,
      receivingScore: 0,
      defenseScore: 0,
      compositePower: 0
    };
  }

  let ratingSum = 0;
  let fpSum = 0;
  let passYds = 0;
  let passTd = 0;
  let rushYds = 0;
  let rushTd = 0;
  let recYds = 0;
  let recTd = 0;
  let defImpact = 0;

  players.forEach((p) => {
    const rating = Number(p.player_performance_rating || 4.0);
    const fp = Number(p.fantasyPts || 110);
    ratingSum += rating;
    fpSum += fp;

    passYds += Number(p.passYds || p.passing_yards || 0);
    passTd += Number(p.passTd || p.passing_tds || 0);
    rushYds += Number(p.rushYds || p.rushing_yards || 0);
    rushTd += Number(p.rushTd || p.rushing_tds || 0);
    recYds += Number(p.recYds || p.receiving_yards || 0);
    recTd += Number(p.recTd || p.receiving_tds || 0);

    const tackles = Number(p.tackles || 0);
    const sacks = Number(p.sacks || 0);
    const ints = Number(p.interceptions || 0);
    const turnovers = Number(p.turnovers || 0);
    const ff = Number(p.forcedFumbles || 0);
    const pd = Number(p.passDefended || 0);
    defImpact += tackles * 0.4 + sacks * 3.5 + ints * 5.0 + turnovers * 2.5 + ff * 3.5 + pd * 1.5;

    // Give K / DST baseline defensive/special teams value if not covered above
    if (getPos(p) === 'K') {
      defImpact += Number(p.fieldGoalsMade || 20) * 1.4;
    }
  });

  const avgRating = ratingSum / players.length;
  const passingScore = passYds / 100 + passTd * 2.5;
  const rushingScore = rushYds / 60 + rushTd * 2.8;
  const receivingScore = recYds / 70 + recTd * 2.6;
  const defenseScore = defImpact;

  const compositePower = avgRating * 24 + fpSum * 0.045 + (passingScore + rushingScore + receivingScore + defenseScore) * 0.08;

  return {
    count: players.length,
    avgRating,
    totalFantasyPts: fpSum,
    passingScore,
    rushingScore,
    receivingScore,
    defenseScore,
    compositePower
  };
}

/**
 * Helper to pick a representative player by position preference
 */
function pickByPosition(players, preferredPositions, fallbackIndex = 0) {
  const pool = (players || []).filter(Boolean);
  for (const pos of preferredPositions) {
    const matches = pool.filter((p) => getPos(p) === pos);
    if (matches.length > 0) {
      return matches[Math.floor(Math.random() * matches.length)];
    }
  }
  return pool[fallbackIndex % Math.max(pool.length, 1)] || { name: 'Team Captain', pos: 'FLEX', teamAbbr: 'NFL' };
}

/**
 * Generate a realistic single-game stat line for the Game MVP
 */
function buildMvpStatLine(player, didTeamWin) {
  const pos = getPos(player);
  const rating = Number(player?.player_performance_rating || 4.4);
  const boost = didTeamWin ? 1.15 : 0.98;

  if (pos === 'QB') {
    const yards = Math.round((255 + (rating - 3.8) * 95 + Math.random() * 65) * boost);
    const att = Math.round(30 + Math.random() * 11);
    const cmp = Math.min(att - 2, Math.round(att * (0.64 + (rating - 4.0) * 0.08)));
    const td = Math.max(2, Math.min(5, Math.round((2 + (rating - 4.1) * 1.6 + Math.random() * 1.2) * boost)));
    const rushYds = Math.round(12 + Math.random() * 38);
    return `${cmp}/${att} CMP • ${yards} PASS YDS • ${td} TD • ${rushYds} RUSH YDS`;
  }

  if (pos === 'RB') {
    const car = Math.round(17 + Math.random() * 9);
    const rushYds = Math.round((95 + (rating - 3.9) * 55 + Math.random() * 48) * boost);
    const td = Math.max(1, Math.min(4, Math.round(1 + Math.random() * 1.8)));
    const rec = Math.round(2 + Math.random() * 4);
    return `${car} CAR • ${rushYds} RUSH YDS • ${td} TD • ${rec} REC`;
  }

  if (pos === 'WR' || pos === 'TE') {
    const rec = Math.round(6 + Math.random() * 6);
    const recYds = Math.round((98 + (rating - 3.9) * 60 + Math.random() * 52) * boost);
    const td = Math.max(1, Math.min(3, Math.round(1 + Math.random() * 1.6)));
    return `${rec} REC • ${recYds} REC YDS • ${td} REC TD`;
  }

  if (pos === 'K') {
    const fg = Math.round(3 + Math.random() * 2);
    const xp = Math.round(2 + Math.random() * 3);
    return `${fg}/${fg} FG • LONG 56 YDS • ${xp} XP • ${fg * 3 + xp} PTS`;
  }

  if (pos === 'DST') {
    const sacks = Math.round(3 + Math.random() * 4);
    const ints = Math.round(1 + Math.random() * 2);
    const ptsAllowed = Math.round(10 + Math.random() * 9);
    return `${sacks} SCK • ${ints} INT • 1 DEF TD • ${ptsAllowed} PA`;
  }

  // Individual Defensive Players (DE, DT, LB, CB, S, etc.)
  const tackles = Math.round(6 + Math.random() * 7);
  if (['DE', 'DT', 'NT', 'EDGE', 'DL'].includes(pos)) {
    const sacks = (1.5 + Math.random() * 2.0).toFixed(1);
    const tfl = Math.round(2 + Math.random() * 3);
    return `${tackles} TCKL • ${sacks} SCK • ${tfl} TFL • 1 FF`;
  }
  if (['CB', 'S', 'FS', 'SS', 'DB'].includes(pos)) {
    const pd = Math.round(2 + Math.random() * 3);
    const ints = Math.round(1 + Math.random());
    return `${tackles} TCKL • ${ints} INT • ${pd} PD`;
  }
  const sacks = (1.0 + Math.random() * 1.5).toFixed(1);
  return `${tackles} TCKL • ${sacks} SCK • 1 INT • 2 TFL`;
}

/**
 * Distribute team total points realistically across 4 NFL quarters
 */
function distributeQuarterScores(totalPoints) {
  const nflIncrements = [0, 3, 7, 10, 14];
  const quarters = [0, 0, 0, 0];
  let remaining = Math.max(7, totalPoints);

  for (let i = 0; i < 3; i++) {
    const affordable = nflIncrements.filter((v) => v <= remaining);
    const pick = affordable[Math.floor(Math.random() * affordable.length)] ?? 0;
    quarters[i] = pick;
    remaining -= pick;
  }
  quarters[3] = Math.max(0, remaining);
  return quarters;
}

/**
 * Format simulated NFL game highlight events across Q1–Q4
 */
function generatePlayByPlayFeed(userPlayersList, oppPlayersList, userTeamName, oppTeamName, userQuarters, oppQuarters) {
  const events = [];
  const quarterLabels = ['Q1', 'Q2', 'Q3', 'Q4'];
  const clocks = ['11:42', '08:19', '04:55', '01:28'];

  const uQB = pickByPosition(userPlayersList, ['QB']);
  const uRB = pickByPosition(userPlayersList, ['RB', 'FLEX']);
  const uWR = pickByPosition(userPlayersList, ['WR', 'TE']);
  const uTE = pickByPosition(userPlayersList, ['TE', 'WR']);
  const uDef = pickByPosition(userPlayersList, ['DE', 'LB', 'CB', 'S', 'DST', 'DT']);
  const uK = pickByPosition(userPlayersList, ['K', 'QB']);

  const oQB = pickByPosition(oppPlayersList, ['QB']);
  const oRB = pickByPosition(oppPlayersList, ['RB', 'FLEX']);
  const oWR = pickByPosition(oppPlayersList, ['WR', 'TE']);
  const oDef = pickByPosition(oppPlayersList, ['DE', 'LB', 'CB', 'S', 'DST', 'DT']);
  const oK = pickByPosition(oppPlayersList, ['K', 'QB']);

  const pickReceiver = (primary, secondary) => (Math.random() > 0.35 ? primary : secondary);

  quarterLabels.forEach((qtr, idx) => {
    const uPts = userQuarters[idx];
    const oPts = oppQuarters[idx];

    if (uPts >= 10) {
      const target1 = pickReceiver(uWR, uTE);
      const yds = Math.round(19 + Math.random() * 34);
      events.push({
        id: `${qtr}-u-td1`,
        quarter: qtr,
        clock: clocks[0],
        team: 'USER',
        teamLabel: userTeamName,
        type: 'TD',
        title: `TOUCHDOWN • ${uQB.name} to ${target1.name}`,
        detail: `${uQB.name} drops a dime down the seam to ${target1.name} for a ${yds}-yard touchdown strike.`
      });
      const fgYds = Math.round(38 + Math.random() * 16);
      events.push({
        id: `${qtr}-u-big`,
        quarter: qtr,
        clock: clocks[2],
        team: 'USER',
        teamLabel: userTeamName,
        type: uPts >= 14 ? 'TD' : 'FG',
        title: uPts >= 14 ? `EXPLOSIVE TD • ${uRB.name}` : `FIELD GOAL • ${uK.name}`,
        detail:
          uPts >= 14
            ? `${uRB.name} breaks two arm tackles on the outside zone and sprints ${Math.round(24 + Math.random() * 28)} yards to the house.`
            : `${uK.name} drills a ${fgYds}-yard field goal right down the middle after a red-zone stall.`
      });
    } else if (uPts >= 6) {
      const isRush = Math.random() > 0.55;
      const yds = Math.round(14 + Math.random() * 31);
      events.push({
        id: `${qtr}-u-td`,
        quarter: qtr,
        clock: clocks[1],
        team: 'USER',
        teamLabel: userTeamName,
        type: 'TD',
        title: isRush ? `RUSHING TD • ${uRB.name}` : `PASSING TD • ${uQB.name} to ${uWR.name}`,
        detail: isRush
          ? `${uRB.name} powers through the A-gap behind clean blocks for a ${yds}-yard rushing touchdown.`
          : `${uQB.name} hits ${uWR.name} on a crisp back-shoulder fade from ${yds} yards out for 6.`
      });
    } else if (uPts > 0) {
      const fgYds = Math.round(41 + Math.random() * 15);
      events.push({
        id: `${qtr}-u-fg`,
        quarter: qtr,
        clock: clocks[2],
        team: 'USER',
        teamLabel: userTeamName,
        type: 'FG',
        title: `CLUTCH KICK • ${uK.name} (${fgYds} YDS)`,
        detail: `${uK.name} splits the uprights from ${fgYds} yards out to keep points flowing on the drive.`
      });
    } else {
      events.push({
        id: `${qtr}-u-defstop`,
        quarter: qtr,
        clock: clocks[1],
        team: 'OPP',
        teamLabel: oppTeamName,
        type: 'DEFENSE',
        title: `DEFENSIVE STAND • ${oDef.name}`,
        detail: `${oDef.name} blows up the 3rd-and-short screen pass for a 4-yard loss, forcing a punt.`
      });
    }

    if (oPts >= 10) {
      const yds = Math.round(21 + Math.random() * 36);
      events.push({
        id: `${qtr}-o-td1`,
        quarter: qtr,
        clock: clocks[1],
        team: 'OPP',
        teamLabel: oppTeamName,
        type: 'TD',
        title: `OPPONENT TD • ${oQB.name} to ${oWR.name}`,
        detail: `${oQB.name} escapes pocket pressure and connects with ${oWR.name} for a ${yds}-yard touchdown.`
      });
      events.push({
        id: `${qtr}-o-score2`,
        quarter: qtr,
        clock: clocks[3],
        team: 'OPP',
        teamLabel: oppTeamName,
        type: oPts >= 14 ? 'TD' : 'FG',
        title: oPts >= 14 ? `GOAL-LINE TD • ${oRB.name}` : `FIELD GOAL • ${oK.name}`,
        detail:
          oPts >= 14
            ? `${oRB.name} leaps over the pile for a short-yardage touchdown to cap an 11-play march.`
            : `${oK.name} converts from ${Math.round(35 + Math.random() * 17)} yards before the quarter horn.`
      });
    } else if (oPts >= 6) {
      const isRush = Math.random() > 0.5;
      events.push({
        id: `${qtr}-o-td`,
        quarter: qtr,
        clock: clocks[2],
        team: 'OPP',
        teamLabel: oppTeamName,
        type: 'TD',
        title: isRush ? `OPPONENT RUSH TD • ${oRB.name}` : `DEEP STRIKE TD • ${oQB.name} to ${oWR.name}`,
        detail: isRush
          ? `${oRB.name} finds a crease off right tackle for a ${Math.round(11 + Math.random() * 20)}-yard score.`
          : `${oQB.name} threads the needle to ${oWR.name} across the middle for a ${Math.round(22 + Math.random() * 25)}-yard touchdown.`
      });
    } else if (oPts > 0) {
      events.push({
        id: `${qtr}-o-fg`,
        quarter: qtr,
        clock: clocks[3],
        team: 'OPP',
        teamLabel: oppTeamName,
        type: 'FG',
        title: `OPPONENT FG • ${oK.name}`,
        detail: `${oK.name} adds three points from ${Math.round(39 + Math.random() * 14)} yards after ${uDef.name} forces a 4th down.`
      });
    } else {
      const isPick = Math.random() > 0.5;
      events.push({
        id: `${qtr}-u-stop`,
        quarter: qtr,
        clock: clocks[3],
        team: 'USER',
        teamLabel: userTeamName,
        type: 'DEFENSE',
        title: isPick ? `TURNOVER • ${uDef.name} INTERCEPTION` : `DRIVE KILLER • ${uDef.name} SACK`,
        detail: isPick
          ? `${uDef.name} jumps the slant route and hauls in a momentum-swinging interception at midfield!`
          : `${uDef.name} beats the edge block cleanly for a devastating 9-yard third-down sack.`
      });
    }
  });

  return events;
}

export default function MatchupSimulator({
  userLineup,
  userPlayers = [],
  allPlayers = [],
  formationSlots = DEFAULT_SLOTS,
  user: propUser,
  onClose
}) {
  const auth = useAuth();
  const activeUser = auth?.user || propUser || null;

  const [savedOpponents, setSavedOpponents] = useState([]);
  const [selectedOpponentId, setSelectedOpponentId] = useState('cpu-all-pro');
  const [mysteryCpuSeed, setMysteryCpuSeed] = useState(1);
  const [showOpponentRoster, setShowOpponentRoster] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [activeQuarterFilter, setActiveQuarterFilter] = useState('ALL');
  const [isSimulating, setIsSimulating] = useState(false);
  const resultsRef = useRef(null);

  // Matchup history persistence state
  const [matchupHistory, setMatchupHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saveBadgeText, setSaveBadgeText] = useState(null);

  const readGuestHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem(GUEST_MATCHUPS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const writeGuestHistory = useCallback((records) => {
    try {
      localStorage.setItem(GUEST_MATCHUPS_KEY, JSON.stringify(records));
    } catch (err) {
      console.warn('Guest matchup storage notice:', err);
    }
  }, []);

  const fetchMatchupHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const userUuid = toUuidOrNull(activeUser?.id);
      if (isSupabaseConfigured && userUuid) {
        const { data, error } = await supabase
          .from('matchup_history')
          .select('*')
          .eq('user_id', userUuid)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          setMatchupHistory(data);
          return;
        }
        if (error) {
          console.warn('matchup_history fetch notice:', error.message);
        }
      }

      // Guest or offline/preview fallback
      const localRecords = readGuestHistory();
      const sorted = [...localRecords].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      setMatchupHistory(sorted);
    } catch (err) {
      console.warn('Matchup history load notice:', err);
      setMatchupHistory(readGuestHistory());
    } finally {
      setHistoryLoading(false);
    }
  }, [activeUser?.id, readGuestHistory]);

  useEffect(() => {
    fetchMatchupHistory();
  }, [fetchMatchupHistory]);

  const careerRecord = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let ties = 0;

    matchupHistory.forEach((item) => {
      if (item.result === 'WIN') wins++;
      else if (item.result === 'LOSS') losses++;
      else if (item.result === 'TIE') ties++;
    });

    const total = wins + losses + ties;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    return { wins, losses, ties, total, winRate };
  }, [matchupHistory]);

  const persistMatchupResult = useCallback(
    async ({
      userRosterName,
      oppRosterName,
      finalUserScore,
      finalOppScore,
      userQuarters,
      oppQuarters,
      userSlotWins,
      mvpPlayer,
      mvpStatLine,
      feed
    }) => {
      const resultCode =
        finalUserScore > finalOppScore ? 'WIN' : finalUserScore < finalOppScore ? 'LOSS' : 'TIE';

      const boxScorePayload = {
        user_quarters: userQuarters,
        opponent_quarters: oppQuarters,
        user_final: finalUserScore,
        opponent_final: finalOppScore,
        slot_matchups_won: userSlotWins,
        formation: userLineup?.formation || 'Offensive Spread 11'
      };

      const userUuid = toUuidOrNull(activeUser?.id);
      const lineupUuid = toUuidOrNull(userLineup?.id);
      const mvpUuid = toUuidOrNull(mvpPlayer?.id);

      const baseRecord = {
        lineup_id: lineupUuid,
        lineup_name: userRosterName,
        opponent_name: oppRosterName,
        user_score: finalUserScore,
        opponent_score: finalOppScore,
        result: resultCode,
        mvp_player_id: mvpUuid,
        mvp_player_name: mvpPlayer?.name || null,
        mvp_stat_line: mvpStatLine,
        box_score: boxScorePayload,
        play_by_play: feed
      };

      let savedToDb = false;

      if (isSupabaseConfigured && userUuid) {
        try {
          const insertRow = { ...baseRecord, user_id: userUuid };
          let { error } = await supabase.from('matchup_history').insert(insertRow);

          // Retry with nullable foreign keys if lineup or mock player isn't seeded in DB yet
          if (error && (error.code === '23503' || String(error.message || '').includes('foreign key'))) {
            const retryRow = {
              ...insertRow,
              lineup_id: null,
              mvp_player_id: null
            };
            const retryRes = await supabase.from('matchup_history').insert(retryRow);
            error = retryRes.error;
          }

          if (!error) {
            savedToDb = true;
            await fetchMatchupHistory();
            setSaveBadgeText('✓ Match Saved to Profile');
          } else {
            console.warn('Supabase matchup_history insert notice:', error.message);
          }
        } catch (err) {
          console.warn('Supabase matchup_history save notice:', err);
        }
      }

      if (!savedToDb) {
        const localEntry = {
          id:
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `match_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          ...baseRecord,
          user_id: activeUser?.id || 'guest',
          created_at: new Date().toISOString()
        };
        const existing = readGuestHistory();
        const updated = [localEntry, ...existing];
        writeGuestHistory(updated);
        setMatchupHistory(updated);
        setSaveBadgeText(activeUser ? '✓ Match Saved to Profile' : '✓ Match Saved to Profile (Guest)');
      }

      setTimeout(() => {
        setSaveBadgeText(null);
      }, 4500);
    },
    [activeUser, userLineup?.id, userLineup?.formation, fetchMatchupHistory, readGuestHistory, writeGuestHistory]
  );

  const handleDeleteHistoryEntry = async (entryId) => {
    setMatchupHistory((prev) => prev.filter((item) => item.id !== entryId));

    const existingLocal = readGuestHistory();
    if (existingLocal.some((item) => item.id === entryId)) {
      writeGuestHistory(existingLocal.filter((item) => item.id !== entryId));
    }

    const userUuid = toUuidOrNull(activeUser?.id);
    if (isSupabaseConfigured && userUuid && toUuidOrNull(entryId)) {
      try {
        const { error } = await supabase
          .from('matchup_history')
          .delete()
          .eq('id', entryId)
          .eq('user_id', userUuid);

        if (error) {
          console.warn('matchup_history delete notice:', error.message);
        }
      } catch (err) {
        console.warn('Matchup history delete error:', err);
      }
    }
  };

  const activeUserSlots = useMemo(() => {
    if (userLineup?.slots && userLineup.slots.length === 11) {
      return userLineup.slots;
    }
    return formationSlots.map((slot, idx) => ({
      slotId: slot.id,
      slotName: slot.name,
      player: userPlayers[idx] || null
    }));
  }, [userLineup, userPlayers, formationSlots]);

  // Load saved custom_lineups from Supabase + localStorage as selectable opponents
  useEffect(() => {
    let mounted = true;

    async function loadSavedLineups() {
      const collected = [];
      const seenIds = new Set([userLineup?.id]);

      const resolveSlotPlayers = (rawSlots) => {
        if (!Array.isArray(rawSlots)) return [];
        return formationSlots.map((slotRule, idx) => {
          const savedSlot = rawSlots[idx] || {};
          const found =
            allPlayers.find((p) => p.id === savedSlot.playerId) ||
            allPlayers.find(
              (p) => savedSlot.playerName && p.name.toLowerCase() === String(savedSlot.playerName).toLowerCase()
            ) ||
            allPlayers.find((p) => (slotRule.eligible || []).includes(getPos(p)));

          return {
            slotId: slotRule.id,
            slotName: savedSlot.slot || slotRule.name,
            player: found || null
          };
        });
      };

      // 1. Fetch from Supabase custom_lineups
      if (isSupabaseConfigured && activeUser?.id) {
        try {
          const { data, error } = await supabase
            .from('custom_lineups')
            .select('id, name, formation, personal_rating, slots, is_finalized, updated_at')
            .eq('user_id', activeUser.id)
            .order('updated_at', { ascending: false });

          if (!error && Array.isArray(data)) {
            data.forEach((row) => {
              if (!seenIds.has(row.id) && Array.isArray(row.slots) && row.slots.length > 0) {
                seenIds.add(row.id);
                collected.push({
                  id: `saved_${row.id}`,
                  rawId: row.id,
                  name: `${row.name} (Saved • ${row.formation})`,
                  shortName: row.name,
                  source: 'SAVED',
                  formation: row.formation,
                  slots: resolveSlotPlayers(row.slots)
                });
              }
            });
          }
        } catch (err) {
          console.warn('Saved opponents Supabase notice:', err);
        }
      }

      // 2. Also read localStorage saved lineups (gridiron_lineup_*)
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('gridiron_lineup_')) {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            if (parsed?.id && !seenIds.has(parsed.id) && Array.isArray(parsed.slots) && parsed.slots.length > 0) {
              const filled = parsed.slots.filter((s) => s.playerId || s.playerName).length;
              if (filled >= 11) {
                seenIds.add(parsed.id);
                collected.push({
                  id: `saved_${parsed.id}`,
                  rawId: parsed.id,
                  name: `${parsed.name || 'Saved Lineup'} (Saved • ${parsed.formation || 'Custom'})`,
                  shortName: parsed.name || 'Saved Lineup',
                  source: 'SAVED',
                  formation: parsed.formation,
                  slots: resolveSlotPlayers(parsed.slots)
                });
              }
            }
          }
        }
      } catch {
        // Ignore storage read issues
      }

      if (mounted) {
        setSavedOpponents(collected);
      }
    }

    loadSavedLineups();
    return () => {
      mounted = false;
    };
  }, [activeUser?.id, userLineup?.id, allPlayers, formationSlots]);

  // Build full list of selectable opponents (CPU Tiers, Pro Bowl, 2026 Contenders, Archetypes, Saved Lineups)
  const opponentOptions = useMemo(() => {
    const cpuPresets = [
      // League & Difficulty Tiers
      {
        id: 'cpu-all-pro',
        group: 'TIER',
        name: '2026 All-Pro CPU Squad (League Best)',
        shortName: '2026 All-Pro CPU',
        source: 'CPU',
        badge: 'ALL-PRO CPU • 99 OVR',
        slots: buildCpuRoster(allPlayers, formationSlots, { tier: 'ALL_PRO' })
      },
      {
        id: 'cpu-probowl-afc',
        group: 'TIER',
        name: '2026 AFC Pro Bowl All-Stars CPU',
        shortName: 'AFC Pro Bowl CPU',
        source: 'CPU',
        badge: 'CONFERENCE ALL-STARS',
        slots: buildCpuRoster(allPlayers, formationSlots, {
          priorityTeams: ['BUF', 'KC', 'BAL', 'CIN', 'HOU', 'LAC', 'DEN', 'PIT', 'MIA']
        })
      },
      {
        id: 'cpu-probowl-nfc',
        group: 'TIER',
        name: '2026 NFC Pro Bowl All-Stars CPU',
        shortName: 'NFC Pro Bowl CPU',
        source: 'CPU',
        badge: 'CONFERENCE ALL-STARS',
        slots: buildCpuRoster(allPlayers, formationSlots, {
          priorityTeams: ['SF', 'DET', 'PHI', 'MIN', 'GB', 'DAL', 'LAR', 'WAS', 'TB']
        })
      },
      {
        id: 'cpu-competitive',
        group: 'TIER',
        name: '2026 Competitive Playoff CPU (Balanced)',
        shortName: 'Playoff CPU (Balanced)',
        source: 'CPU',
        badge: 'PRO DIFFICULTY',
        slots: buildCpuRoster(allPlayers, formationSlots, { tier: 'COMPETITIVE' })
      },
      {
        id: 'cpu-rookie',
        group: 'TIER',
        name: '2026 Rookie / Warmup CPU Squad',
        shortName: 'Warmup CPU Squad',
        source: 'CPU',
        badge: 'ROOKIE DIFFICULTY',
        slots: buildCpuRoster(allPlayers, formationSlots, { tier: 'ROOKIE' })
      },

      // Contender & Division CPU Squads
      {
        id: 'cpu-contender-sf',
        group: 'CONTENDER',
        name: 'San Francisco 49ers & NFC West Contenders CPU',
        shortName: 'SF 49ers & NFC West',
        source: 'CPU',
        badge: 'NFC WEST CPU',
        slots: buildCpuRoster(allPlayers, formationSlots, { priorityTeams: ['SF', 'LAR', 'SEA', 'ARI'] })
      },
      {
        id: 'cpu-contender-buf',
        group: 'CONTENDER',
        name: 'Buffalo Bills & AFC East Contenders CPU',
        shortName: 'BUF Bills & AFC East',
        source: 'CPU',
        badge: 'AFC EAST CPU',
        slots: buildCpuRoster(allPlayers, formationSlots, { priorityTeams: ['BUF', 'MIA', 'NYJ', 'NE'] })
      },
      {
        id: 'cpu-contender-kc',
        group: 'CONTENDER',
        name: 'Kansas City Chiefs & AFC West Contenders CPU',
        shortName: 'KC Chiefs & AFC West',
        source: 'CPU',
        badge: 'AFC WEST CPU',
        slots: buildCpuRoster(allPlayers, formationSlots, { priorityTeams: ['KC', 'LAC', 'DEN', 'LV'] })
      },
      {
        id: 'cpu-contender-bal',
        group: 'CONTENDER',
        name: 'Baltimore Ravens & AFC North Contenders CPU',
        shortName: 'BAL Ravens & AFC North',
        source: 'CPU',
        badge: 'AFC NORTH CPU',
        slots: buildCpuRoster(allPlayers, formationSlots, { priorityTeams: ['BAL', 'CIN', 'PIT', 'CLE'] })
      },
      {
        id: 'cpu-contender-det',
        group: 'CONTENDER',
        name: 'Detroit Lions & NFC North Contenders CPU',
        shortName: 'DET Lions & NFC North',
        source: 'CPU',
        badge: 'NFC NORTH CPU',
        slots: buildCpuRoster(allPlayers, formationSlots, { priorityTeams: ['DET', 'MIN', 'GB', 'CHI'] })
      },
      {
        id: 'cpu-contender-phi',
        group: 'CONTENDER',
        name: 'Philadelphia Eagles & NFC East Contenders CPU',
        shortName: 'PHI Eagles & NFC East',
        source: 'CPU',
        badge: 'NFC EAST CPU',
        slots: buildCpuRoster(allPlayers, formationSlots, { priorityTeams: ['PHI', 'WAS', 'DAL', 'NYG'] })
      },
      {
        id: 'cpu-contender-hou',
        group: 'CONTENDER',
        name: 'Houston Texans & AFC South Contenders CPU',
        shortName: 'HOU Texans & AFC South',
        source: 'CPU',
        badge: 'AFC SOUTH CPU',
        slots: buildCpuRoster(allPlayers, formationSlots, { priorityTeams: ['HOU', 'IND', 'JAX', 'TEN'] })
      },
      {
        id: 'cpu-contender-tb',
        group: 'CONTENDER',
        name: 'Tampa Bay Buccaneers & NFC South Contenders CPU',
        shortName: 'TB Bucs & NFC South',
        source: 'CPU',
        badge: 'NFC SOUTH CPU',
        slots: buildCpuRoster(allPlayers, formationSlots, { priorityTeams: ['TB', 'ATL', 'NO', 'CAR'] })
      },

      // Playstyle Archetype CPUs
      {
        id: 'cpu-air-raid',
        group: 'ARCHETYPE',
        name: '2026 Air Raid Blitz CPU (High-Volume Passing)',
        shortName: 'Air Raid Blitz CPU',
        source: 'CPU',
        badge: 'PASS-HEAVY CPU',
        slots: buildCpuRoster(allPlayers, formationSlots, { tier: 'AIR_RAID' })
      },
      {
        id: 'cpu-ground-pound',
        group: 'ARCHETYPE',
        name: '2026 Ground & Pound CPU (Smashmouth Run & D)',
        shortName: 'Ground & Pound CPU',
        source: 'CPU',
        badge: 'RUN & DEFENSE CPU',
        slots: buildCpuRoster(allPlayers, formationSlots, { tier: 'GROUND_POUND' })
      },
      {
        id: 'cpu-mystery',
        group: 'ARCHETYPE',
        name: `2026 Mystery Draft CPU (Random Mix #${mysteryCpuSeed})`,
        shortName: `Mystery Draft CPU #${mysteryCpuSeed}`,
        source: 'CPU',
        badge: 'RANDOMIZED CPU',
        slots: buildCpuRoster(allPlayers, formationSlots, { tier: 'RANDOM', seed: mysteryCpuSeed })
      }
    ];

    return [...cpuPresets, ...savedOpponents];
  }, [allPlayers, formationSlots, savedOpponents, mysteryCpuSeed]);

  const currentOpponent = useMemo(() => {
    return opponentOptions.find((o) => o.id === selectedOpponentId) || opponentOptions[0];
  }, [opponentOptions, selectedOpponentId]);

  // Compute Pre-Game Metrics & Win Probability
  const preGameAnalysis = useMemo(() => {
    const userMetrics = computeRosterMetrics(activeUserSlots);
    const oppMetrics = computeRosterMetrics(currentOpponent?.slots || []);

    const ratingEdge = (userMetrics.avgRating - oppMetrics.avgRating) * 24;
    const fantasyEdge = ((userMetrics.totalFantasyPts - oppMetrics.totalFantasyPts) / Math.max(oppMetrics.totalFantasyPts, 100)) * 32;
    const rawUserProb = 50 + ratingEdge + fantasyEdge;
    const userWinProb = Math.max(14, Math.min(86, Math.round(rawUserProb)));
    const oppWinProb = 100 - userWinProb;

    return {
      userMetrics,
      oppMetrics,
      userWinProb,
      oppWinProb
    };
  }, [activeUserSlots, currentOpponent]);

  // Clear stale simulation result when opponent changes
  useEffect(() => {
    setSimResult(null);
    setActiveQuarterFilter('ALL');
  }, [selectedOpponentId, userLineup?.id, userLineup?.formation]);

  // Weighted Slot-by-Slot Kickoff Simulation
  const handleRunSimulation = () => {
    if (!currentOpponent) return;
    setIsSimulating(true);

    setTimeout(() => {
      const oppSlots = currentOpponent.slots || [];
      let userSlotWins = 0;
      let oppSlotWins = 0;
      let userImpactTotal = 0;
      let oppImpactTotal = 0;

      const userPerformances = [];
      const oppPerformances = [];

      activeUserSlots.forEach((uSlot, idx) => {
        const uPlayer = uSlot.player;
        const oPlayer = oppSlots[idx]?.player;

        const uBase =
          Number(uPlayer?.player_performance_rating || 4.0) * 18 +
          Number(uPlayer?.fantasyPts || 110) * 0.09 +
          Number(uPlayer?.passTd || 0) * 0.35 +
          Number(uPlayer?.rushTd || 0) * 0.45 +
          Number(uPlayer?.recTd || 0) * 0.45 +
          Number(uPlayer?.sacks || 0) * 0.65;

        const oBase =
          Number(oPlayer?.player_performance_rating || 4.0) * 18 +
          Number(oPlayer?.fantasyPts || 110) * 0.09 +
          Number(oPlayer?.passTd || 0) * 0.35 +
          Number(oPlayer?.rushTd || 0) * 0.45 +
          Number(oPlayer?.recTd || 0) * 0.45 +
          Number(oPlayer?.sacks || 0) * 0.65;

        const uVariance = (Math.random() - 0.46) * 24;
        const oVariance = (Math.random() - 0.46) * 24;

        const uGameScore = uBase + uVariance;
        const oGameScore = oBase + oVariance;

        userImpactTotal += uGameScore;
        oppImpactTotal += oGameScore;

        if (uGameScore >= oGameScore) {
          userSlotWins++;
        } else {
          oppSlotWins++;
        }

        if (uPlayer) {
          userPerformances.push({
            player: uPlayer,
            slotName: uSlot.slotName,
            impact: uGameScore + (getPos(uPlayer) === 'QB' ? 6 : 0)
          });
        }
        if (oPlayer) {
          oppPerformances.push({
            player: oPlayer,
            slotName: oppSlots[idx]?.slotName || uSlot.slotName,
            impact: oGameScore + (getPos(oPlayer) === 'QB' ? 6 : 0)
          });
        }
      });

      const delta = (userImpactTotal - oppImpactTotal) / 18;
      let userTotalPts = Math.max(13, Math.min(48, Math.round(24 + delta * 0.75 + (Math.random() * 8 - 4))));
      let oppTotalPts = Math.max(10, Math.min(45, Math.round(23 - delta * 0.65 + (Math.random() * 8 - 4))));

      // Ensure decisive Victory or Defeat (no tie)
      if (userTotalPts === oppTotalPts) {
        if (userImpactTotal >= oppImpactTotal) {
          userTotalPts += 3;
        } else {
          oppTotalPts += 3;
        }
      }

      const userQuarters = distributeQuarterScores(userTotalPts);
      const oppQuarters = distributeQuarterScores(oppTotalPts);
      const userFinal = userQuarters.reduce((a, b) => a + b, 0);
      const oppFinal = oppQuarters.reduce((a, b) => a + b, 0);

      // Re-verify no tie after quarter distribution
      if (userFinal === oppFinal) {
        if (userImpactTotal >= oppImpactTotal) {
          userQuarters[3] += 3;
        } else {
          oppQuarters[3] += 3;
        }
      }

      const finalUserScore = userQuarters.reduce((a, b) => a + b, 0);
      const finalOppScore = oppQuarters.reduce((a, b) => a + b, 0);
      const isVictory = finalUserScore > finalOppScore;

      // Pick Game MVP from winning roster
      const winningPool = isVictory ? userPerformances : oppPerformances;
      const mvpEntry = [...winningPool].sort((a, b) => b.impact - a.impact)[0];
      const mvpPlayer = mvpEntry?.player || activeUserSlots[0]?.player;

      const userRosterName = userLineup?.name || 'Your 2026 Roster';
      const oppRosterName = currentOpponent.shortName || currentOpponent.name;

      const feed = generatePlayByPlayFeed(
        activeUserSlots.map((s) => s.player),
        oppSlots.map((s) => s.player),
        userRosterName,
        oppRosterName,
        userQuarters,
        oppQuarters
      );

      const mvpStatLine = buildMvpStatLine(mvpPlayer, true);

      setSimResult({
        isVictory,
        userTeamName: userRosterName,
        oppTeamName: oppRosterName,
        userQuarters,
        oppQuarters,
        finalUserScore,
        finalOppScore,
        userSlotWins,
        oppSlotWins,
        mvp: {
          player: mvpPlayer,
          slotName: mvpEntry?.slotName || getPos(mvpPlayer),
          teamName: isVictory ? userRosterName : oppRosterName,
          statLine: mvpStatLine,
          side: isVictory ? 'USER' : 'OPPONENT'
        },
        feed,
        simulatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      setActiveQuarterFilter('ALL');
      setIsSimulating(false);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);

      persistMatchupResult({
        userRosterName,
        oppRosterName,
        finalUserScore,
        finalOppScore,
        userQuarters,
        oppQuarters,
        userSlotWins,
        mvpPlayer,
        mvpStatLine,
        feed
      });
    }, 280);
  };

  const filteredFeed = useMemo(() => {
    if (!simResult) return [];
    if (activeQuarterFilter === 'ALL') return simResult.feed;
    return simResult.feed.filter((item) => item.quarter === activeQuarterFilter);
  }, [simResult, activeQuarterFilter]);

  return (
    <section
      aria-label="Head-to-Head Matchup Simulator"
      style={{
        backgroundColor: '#0a0f1d',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: 12,
        padding: '1.5rem',
        marginTop: '1.5rem',
        marginBottom: '2.5rem',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.55)'
      }}
    >
      {/* Simulator Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingBottom: '1.15rem',
          borderBottom: '1px solid rgba(148, 163, 184, 0.25)',
          marginBottom: '1.25rem'
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.75rem',
              fontFamily: 'var(--font-tech)',
              fontWeight: 800,
              color: '#38bdf8',
              letterSpacing: '0.06em',
              marginBottom: 4
            }}
          >
            <Zap size={14} /> HEAD-TO-HEAD SIMULATION ENGINE
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              lineHeight: 1.05,
              textTransform: 'uppercase',
              color: '#f5f5f7'
            }}
          >
            MATCHUP <span style={{ color: '#38bdf8' }}>SIMULATOR</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Test your 11-player lineup against league All-Pro CPU squads, 2026 contenders, or your saved rosters.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Career Record Badge */}
          <div
            style={{
              backgroundColor: '#111827',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              borderRadius: 8,
              padding: '7px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'var(--font-tech)',
              fontSize: '0.82rem',
              fontWeight: 800,
              color: '#f5f5f7',
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.14)'
            }}
          >
            <Trophy size={15} style={{ color: '#38bdf8' }} />
            <span>
              RECORD:{' '}
              <strong style={{ color: '#38bdf8' }}>
                {careerRecord.wins}W - {careerRecord.losses}L
                {careerRecord.ties > 0 ? ` - ${careerRecord.ties}T` : ''}
              </strong>{' '}
              <span style={{ color: '#94a3b8' }}>({careerRecord.winRate}% WIN RATE)</span>
            </span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#111827',
                border: '1px solid rgba(148, 163, 184, 0.28)',
                color: '#cbd5e1',
                padding: '7px 12px',
                borderRadius: 6,
                fontFamily: 'var(--font-tech)',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <X size={15} /> Hide Simulator
            </button>
          )}
        </div>
      </div>

      {/* Opponent Selector & Kickoff Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          alignItems: 'end',
          marginBottom: '1.25rem'
        }}
      >
        {/* User Lineup Summary Badge */}
        <div
          style={{
            backgroundColor: '#111827',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: 8,
            padding: '0.85rem 1rem'
          }}
        >
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-tech)', color: '#38bdf8', fontWeight: 800 }}>
            HOME ROSTER ({userLineup?.formation || '11-SLOT'})
          </div>
          <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', color: '#f5f5f7', marginTop: 2 }}>
            {userLineup?.name || 'Championship Roster 2026'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'var(--font-tech)', marginTop: 3 }}>
            AVG RATING: <strong style={{ color: '#38bdf8' }}>{preGameAnalysis.userMetrics.avgRating.toFixed(2)}</strong> • PROJ FPTS:{' '}
            <strong style={{ color: '#cbd5e1' }}>{preGameAnalysis.userMetrics.totalFantasyPts.toFixed(1)}</strong>
          </div>
        </div>

        {/* Opponent Selector Dropdown */}
        <div
          style={{
            backgroundColor: '#111827',
            border: '1px solid rgba(148, 163, 184, 0.28)',
            borderRadius: 8,
            padding: '0.85rem 1rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 }}>
            <label
              htmlFor="opponent-selector"
              style={{
                fontSize: '0.7rem',
                fontFamily: 'var(--font-tech)',
                color: '#94a3b8',
                fontWeight: 800
              }}
            >
              SELECT OPPONENT SQUAD ({opponentOptions.length} AVAILABLE)
            </label>
            {currentOpponent?.badge && (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-tech)',
                  fontWeight: 800,
                  color: '#38bdf8',
                  backgroundColor: 'rgba(56, 189, 248, 0.14)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: 4,
                  padding: '1px 6px'
                }}
              >
                {currentOpponent.badge}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              id="opponent-selector"
              value={selectedOpponentId}
              onChange={(e) => setSelectedOpponentId(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: '#0a0f1d',
                color: '#f5f5f7',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                borderRadius: 6,
                padding: '8px 10px',
                fontFamily: 'var(--font-tech)',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <optgroup label="League & Difficulty CPU Tiers">
                {opponentOptions
                  .filter((o) => o.group === 'TIER')
                  .map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="2026 Divisional Contender CPUs">
                {opponentOptions
                  .filter((o) => o.group === 'CONTENDER')
                  .map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Playstyle Archetype CPUs">
                {opponentOptions
                  .filter((o) => o.group === 'ARCHETYPE')
                  .map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
              </optgroup>
              {savedOpponents.length > 0 && (
                <optgroup label="Your Saved Custom Lineups">
                  {savedOpponents.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {selectedOpponentId === 'cpu-mystery' && (
              <button
                type="button"
                onClick={() => setMysteryCpuSeed((s) => s + 1)}
                title="Generate a new randomized CPU roster"
                style={{
                  backgroundColor: '#0a0f1d',
                  color: '#38bdf8',
                  border: '1px solid #38bdf8',
                  borderRadius: 6,
                  padding: '8px 10px',
                  fontFamily: 'var(--font-tech)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <RotateCcw size={13} /> Reroll
              </button>
            )}
          </div>
        </div>

        {/* Kickoff Simulation CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            disabled={isSimulating || preGameAnalysis.userMetrics.count < 11}
            onClick={handleRunSimulation}
            style={{
              width: '100%',
              backgroundColor: '#38bdf8',
              color: '#0a0f1d',
              border: 'none',
              borderRadius: 8,
              padding: '0.9rem 1.25rem',
              fontFamily: 'var(--font-tech)',
              fontSize: '0.95rem',
              fontWeight: 900,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: isSimulating || preGameAnalysis.userMetrics.count < 11 ? 'not-allowed' : 'pointer',
              opacity: isSimulating || preGameAnalysis.userMetrics.count < 11 ? 0.65 : 1,
              boxShadow: '0 0 18px rgba(56, 189, 248, 0.35)'
            }}
          >
            {simResult ? <RotateCcw size={18} /> : <Play size={18} fill="#0a0f1d" />}
            {isSimulating
              ? 'Simulating 4 Quarters...'
              : simResult
              ? 'Rematch / Simulate Again'
              : 'Kickoff Simulation'}
          </button>
          <button
            type="button"
            onClick={() => setShowOpponentRoster((prev) => !prev)}
            style={{
              backgroundColor: '#111827',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              color: '#cbd5e1',
              borderRadius: 6,
              padding: '6px 10px',
              fontFamily: 'var(--font-tech)',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <Users size={14} style={{ color: '#38bdf8' }} />
            {showOpponentRoster ? 'Hide Opponent 11-Man Roster' : 'Preview Opponent 11-Man Roster'}
            {showOpponentRoster ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expandable Opponent 11-Man Roster Preview */}
      {showOpponentRoster && currentOpponent && (
        <div
          style={{
            backgroundColor: '#111827',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            borderRadius: 8,
            padding: '1rem',
            marginBottom: '1.25rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}
          >
            <span style={{ fontFamily: 'var(--font-tech)', fontSize: '0.8rem', fontWeight: 800, color: '#cbd5e1' }}>
              OPPONENT STARTING 11 — {currentOpponent.name.toUpperCase()}
            </span>
            <span style={{ fontFamily: 'var(--font-tech)', fontSize: '0.75rem', color: '#94a3b8' }}>
              AVG RATING: {preGameAnalysis.oppMetrics.avgRating.toFixed(2)}
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '0.55rem'
            }}
          >
            {currentOpponent.slots.map((s) => (
              <div
                key={s.slotId}
                style={{
                  backgroundColor: '#0a0f1d',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: 6,
                  padding: '0.5rem 0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontFamily: 'var(--font-tech)', fontWeight: 800 }}>
                    {s.slotName} • {getTeamAbbr(s.player)}
                  </div>
                  <div
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: '#f5f5f7',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {s.player?.name || 'CPU Starter'}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-tech)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#cbd5e1'
                  }}
                >
                  {Number(s.player?.player_performance_rating || 4.0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pre-Game Win Probability Meter */}
      <div
        style={{
          backgroundColor: '#111827',
          border: '1px solid rgba(148, 163, 184, 0.28)',
          borderRadius: 10,
          padding: '1.1rem 1.25rem',
          marginBottom: simResult ? '1.5rem' : 0
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: '0.65rem'
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-tech)',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#cbd5e1',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <TrendingUp size={15} style={{ color: '#38bdf8' }} /> PRE-GAME WIN PROBABILITY METER
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'var(--font-tech)' }}>
            WEIGHTED BY 2026 PERFORMANCE RATING & PROJECTED PRODUCTION
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 6
          }}
        >
          <div>
            <span style={{ fontFamily: 'var(--font-tech)', fontSize: '1.5rem', fontWeight: 900, color: '#38bdf8' }}>
              {preGameAnalysis.userWinProb}%
            </span>
            <span style={{ marginLeft: 8, fontSize: '0.85rem', fontWeight: 700, color: '#f5f5f7' }}>
              {userLineup?.name || 'Your Roster'}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ marginRight: 8, fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1' }}>
              {currentOpponent?.shortName || 'Opponent'}
            </span>
            <span style={{ fontFamily: 'var(--font-tech)', fontSize: '1.5rem', fontWeight: 900, color: '#94a3b8' }}>
              {preGameAnalysis.oppWinProb}%
            </span>
          </div>
        </div>

        {/* Split Bar */}
        <div
          style={{
            height: 14,
            borderRadius: 999,
            backgroundColor: '#1e293b',
            overflow: 'hidden',
            display: 'flex',
            border: '1px solid rgba(148, 163, 184, 0.25)'
          }}
        >
          <div
            style={{
              width: `${preGameAnalysis.userWinProb}%`,
              background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
              transition: 'width 0.35s ease'
            }}
          />
          <div
            style={{
              width: `${preGameAnalysis.oppWinProb}%`,
              background: 'linear-gradient(90deg, #64748b, #94a3b8)',
              transition: 'width 0.35s ease'
            }}
          />
        </div>

        {/* Side-by-Side Comparison Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '0.75rem',
            marginTop: '0.9rem'
          }}
        >
          <div style={{ backgroundColor: '#0a0f1d', borderRadius: 6, padding: '0.6rem 0.8rem' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-tech)' }}>AVG PLAYER RATING</div>
            <div style={{ fontFamily: 'var(--font-tech)', fontWeight: 800, fontSize: '0.95rem', marginTop: 2 }}>
              <span style={{ color: '#38bdf8' }}>{preGameAnalysis.userMetrics.avgRating.toFixed(2)}</span>
              <span style={{ color: '#64748b', margin: '0 6px' }}>vs</span>
              <span style={{ color: '#cbd5e1' }}>{preGameAnalysis.oppMetrics.avgRating.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ backgroundColor: '#0a0f1d', borderRadius: 6, padding: '0.6rem 0.8rem' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-tech)' }}>2026 PROJ FANTASY PTS</div>
            <div style={{ fontFamily: 'var(--font-tech)', fontWeight: 800, fontSize: '0.95rem', marginTop: 2 }}>
              <span style={{ color: '#38bdf8' }}>{preGameAnalysis.userMetrics.totalFantasyPts.toFixed(1)}</span>
              <span style={{ color: '#64748b', margin: '0 6px' }}>vs</span>
              <span style={{ color: '#cbd5e1' }}>{preGameAnalysis.oppMetrics.totalFantasyPts.toFixed(1)}</span>
            </div>
          </div>

          <div style={{ backgroundColor: '#0a0f1d', borderRadius: 6, padding: '0.6rem 0.8rem' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-tech)' }}>OFFENSIVE FIREPOWER</div>
            <div style={{ fontFamily: 'var(--font-tech)', fontWeight: 800, fontSize: '0.95rem', marginTop: 2 }}>
              <span style={{ color: '#38bdf8' }}>
                {(
                  preGameAnalysis.userMetrics.passingScore +
                  preGameAnalysis.userMetrics.rushingScore +
                  preGameAnalysis.userMetrics.receivingScore
                ).toFixed(1)}
              </span>
              <span style={{ color: '#64748b', margin: '0 6px' }}>vs</span>
              <span style={{ color: '#cbd5e1' }}>
                {(
                  preGameAnalysis.oppMetrics.passingScore +
                  preGameAnalysis.oppMetrics.rushingScore +
                  preGameAnalysis.oppMetrics.receivingScore
                ).toFixed(1)}
              </span>
            </div>
          </div>

          <div style={{ backgroundColor: '#0a0f1d', borderRadius: 6, padding: '0.6rem 0.8rem' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-tech)' }}>DEFENSE / ST INDEX</div>
            <div style={{ fontFamily: 'var(--font-tech)', fontWeight: 800, fontSize: '0.95rem', marginTop: 2 }}>
              <span style={{ color: '#38bdf8' }}>{preGameAnalysis.userMetrics.defenseScore.toFixed(1)}</span>
              <span style={{ color: '#64748b', margin: '0 6px' }}>vs</span>
              <span style={{ color: '#cbd5e1' }}>{preGameAnalysis.oppMetrics.defenseScore.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Results Dashboard */}
      {simResult && (
        <div ref={resultsRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Victory / Defeat Banner */}
          <div
            style={{
              background: simResult.isVictory
                ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.22) 0%, rgba(17, 24, 39, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(17, 24, 39, 0.95) 100%)',
              border: simResult.isVictory ? '1px solid #38bdf8' : '1px solid rgba(239, 68, 68, 0.55)',
              borderRadius: 10,
              padding: '1.15rem 1.35rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: simResult.isVictory ? '#38bdf8' : '#ef4444',
                  color: '#0a0f1d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {simResult.isVictory ? <Trophy size={26} /> : <Shield size={26} />}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '2.1rem',
                    lineHeight: 1,
                    letterSpacing: '0.03em',
                    color: simResult.isVictory ? '#38bdf8' : '#f87171'
                  }}
                >
                  {simResult.isVictory ? 'VICTORY' : 'DEFEAT'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontFamily: 'var(--font-tech)', marginTop: 3 }}>
                  FINAL SCORE: <strong style={{ color: '#fff' }}>{simResult.finalUserScore}</strong> -{' '}
                  <strong style={{ color: '#fff' }}>{simResult.finalOppScore}</strong> • SLOT MATCHUPS WON:{' '}
                  <strong style={{ color: '#38bdf8' }}>{simResult.userSlotWins} / 11</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {saveBadgeText && (
                <span
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.16)',
                    border: '1px solid rgba(34, 197, 94, 0.45)',
                    color: '#4ade80',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontFamily: 'var(--font-tech)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  {saveBadgeText}
                </span>
              )}

              <button
                type="button"
                onClick={handleRunSimulation}
                style={{
                  backgroundColor: '#38bdf8',
                  color: '#0a0f1d',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  fontFamily: 'var(--font-tech)',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={15} /> Rematch / Simulate Again
              </button>
            </div>
          </div>

          {/* 4-Quarter Box Score + Game MVP Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem',
              alignItems: 'stretch'
            }}
          >
            {/* 4-Quarter Box Score Table */}
            <div
              style={{
                backgroundColor: '#111827',
                border: '1px solid rgba(148, 163, 184, 0.28)',
                borderRadius: 10,
                padding: '1rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-tech)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#38bdf8',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Activity size={15} /> 4-QUARTER BOX SCORE
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontFamily: 'var(--font-tech)',
                      textAlign: 'center'
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.25)', color: '#94a3b8', fontSize: '0.75rem' }}>
                        <th style={{ textAlign: 'left', padding: '8px 6px' }}>TEAM</th>
                        <th style={{ padding: '8px 6px' }}>Q1</th>
                        <th style={{ padding: '8px 6px' }}>Q2</th>
                        <th style={{ padding: '8px 6px' }}>Q3</th>
                        <th style={{ padding: '8px 6px' }}>Q4</th>
                        <th style={{ padding: '8px 6px', color: '#38bdf8' }}>FINAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.14)' }}>
                        <td style={{ textAlign: 'left', padding: '10px 6px', fontWeight: 800, color: '#f5f5f7', fontSize: '0.9rem' }}>
                          {simResult.userTeamName}
                        </td>
                        {simResult.userQuarters.map((pts, i) => (
                          <td key={i} style={{ padding: '10px 6px', color: '#cbd5e1', fontWeight: 700 }}>
                            {pts}
                          </td>
                        ))}
                        <td
                          style={{
                            padding: '10px 6px',
                            fontWeight: 900,
                            fontSize: '1.1rem',
                            color: simResult.isVictory ? '#38bdf8' : '#f5f5f7'
                          }}
                        >
                          {simResult.finalUserScore}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'left', padding: '10px 6px', fontWeight: 700, color: '#94a3b8', fontSize: '0.9rem' }}>
                          {simResult.oppTeamName}
                        </td>
                        {simResult.oppQuarters.map((pts, i) => (
                          <td key={i} style={{ padding: '10px 6px', color: '#94a3b8', fontWeight: 700 }}>
                            {pts}
                          </td>
                        ))}
                        <td
                          style={{
                            padding: '10px 6px',
                            fontWeight: 900,
                            fontSize: '1.1rem',
                            color: !simResult.isVictory ? '#f87171' : '#94a3b8'
                          }}
                        >
                          {simResult.finalOppScore}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div
                style={{
                  marginTop: '0.85rem',
                  paddingTop: '0.65rem',
                  borderTop: '1px solid rgba(148, 163, 184, 0.16)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  fontFamily: 'var(--font-tech)'
                }}
              >
                <span>STATUS: FINAL</span>
                <span>SIMULATED AT {simResult.simulatedAt}</span>
              </div>
            </div>

            {/* Game MVP Card */}
            <div
              style={{
                backgroundColor: '#111827',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: 10,
                padding: '1rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem'
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-tech)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#38bdf8',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Award size={16} /> GAME MVP SPOTLIGHT
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontFamily: 'var(--font-tech)',
                    fontSize: '0.68rem',
                    fontWeight: 800
                  }}
                >
                  {simResult.mvp.side === 'USER' ? 'YOUR SQUAD' : 'OPPONENT SQUAD'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img
                  src={getAvatarUrl(
                    simResult.mvp.player,
                    simResult.mvp.side === 'USER' ? '38bdf8' : '94a3b8'
                  )}
                  alt={simResult.mvp.player?.name || 'Game MVP'}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    const fallbackColor = simResult.mvp.side === 'USER' ? '38bdf8' : '94a3b8';
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      simResult.mvp.player?.name || 'MVP'
                    )}&background=0a0f1d&color=${fallbackColor}&bold=true&size=128`;
                  }}
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #38bdf8',
                    backgroundColor: '#0a0f1d',
                    flexShrink: 0
                  }}
                />

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.45rem',
                        lineHeight: 1.05,
                        color: '#f5f5f7'
                      }}
                    >
                      {simResult.mvp.player?.name}
                    </span>
                    <span
                      style={{
                        backgroundColor: '#38bdf8',
                        color: '#0a0f1d',
                        padding: '1px 7px',
                        borderRadius: 4,
                        fontFamily: 'var(--font-tech)',
                        fontSize: '0.72rem',
                        fontWeight: 900
                      }}
                    >
                      {getPos(simResult.mvp.player)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2, fontFamily: 'var(--font-tech)' }}>
                    {getTeamAbbr(simResult.mvp.player)} • {simResult.mvp.teamName}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      backgroundColor: '#0a0f1d',
                      border: '1px solid rgba(148, 163, 184, 0.22)',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontFamily: 'var(--font-tech)',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      color: '#38bdf8'
                    }}
                  >
                    {simResult.mvp.statLine}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Quarter Play-by-Play Highlight Feed */}
          <div
            style={{
              backgroundColor: '#111827',
              border: '1px solid rgba(148, 163, 184, 0.28)',
              borderRadius: 10,
              padding: '1.1rem 1.25rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                marginBottom: '0.9rem'
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-tech)',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#f5f5f7',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Flame size={16} style={{ color: '#38bdf8' }} /> 4-QUARTER PLAY-BY-PLAY HIGHLIGHT FEED
              </div>

              <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                {['ALL', 'Q1', 'Q2', 'Q3', 'Q4'].map((qtr) => {
                  const active = activeQuarterFilter === qtr;
                  return (
                    <button
                      key={qtr}
                      type="button"
                      onClick={() => setActiveQuarterFilter(qtr)}
                      style={{
                        backgroundColor: active ? '#38bdf8' : '#0a0f1d',
                        color: active ? '#0a0f1d' : '#cbd5e1',
                        border: active ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.28)',
                        borderRadius: 5,
                        padding: '4px 10px',
                        fontFamily: 'var(--font-tech)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {qtr === 'ALL' ? 'ALL QTRS' : qtr}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {filteredFeed.map((event) => {
                const isUserHighlight = event.team === 'USER';
                return (
                  <div
                    key={event.id}
                    style={{
                      backgroundColor: '#0a0f1d',
                      borderLeft: isUserHighlight ? '3px solid #38bdf8' : '3px solid #94a3b8',
                      borderTop: '1px solid rgba(148, 163, 184, 0.16)',
                      borderRight: '1px solid rgba(148, 163, 184, 0.16)',
                      borderBottom: '1px solid rgba(148, 163, 184, 0.16)',
                      borderRadius: 6,
                      padding: '0.75rem 0.95rem',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ flex: '1 1 320px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            backgroundColor: isUserHighlight ? 'rgba(56, 189, 248, 0.16)' : 'rgba(148, 163, 184, 0.16)',
                            color: isUserHighlight ? '#38bdf8' : '#cbd5e1',
                            padding: '1px 7px',
                            borderRadius: 4,
                            fontFamily: 'var(--font-tech)',
                            fontSize: '0.7rem',
                            fontWeight: 800
                          }}
                        >
                          {event.quarter} • {event.clock}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-tech)',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            color: '#f5f5f7'
                          }}
                        >
                          {event.title}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.4 }}>
                        {event.detail}
                      </p>
                    </div>

                    <span
                      style={{
                        fontFamily: 'var(--font-tech)',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: event.type === 'TD' ? '#38bdf8' : event.type === 'DEFENSE' ? '#4ade80' : '#cbd5e1',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {event.type === 'TD' && <CheckCircle2 size={13} />}
                      {event.teamLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Saved Matchup History Log */}
      <div
        style={{
          marginTop: '1.5rem',
          backgroundColor: '#111827',
          border: '1px solid rgba(148, 163, 184, 0.28)',
          borderRadius: 10,
          padding: '1.15rem 1.25rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
            marginBottom: '0.9rem'
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-tech)',
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#f5f5f7',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <History size={16} style={{ color: '#38bdf8' }} />
            SAVED MATCHUP HISTORY ({matchupHistory.length})
          </div>

          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-tech)', color: '#94a3b8' }}>
            {activeUser ? 'SYNCED TO PROFILE' : 'GUEST LOCAL STORAGE'}
          </span>
        </div>

        {historyLoading ? (
          <div style={{ padding: '1rem 0', fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'var(--font-tech)' }}>
            Loading matchup history...
          </div>
        ) : matchupHistory.length === 0 ? (
          <div
            style={{
              padding: '1.1rem',
              backgroundColor: '#0a0f1d',
              border: '1px dashed rgba(148, 163, 184, 0.25)',
              borderRadius: 8,
              textAlign: 'center',
              fontSize: '0.85rem',
              color: '#94a3b8'
            }}
          >
            No simulated games logged yet. Click <strong style={{ color: '#38bdf8' }}>Kickoff Simulation</strong> above to record your first matchup.
          </div>
        ) : (
          <div
            style={{
              maxHeight: 360,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              paddingRight: 4
            }}
          >
            {matchupHistory.map((entry) => {
              const isWin = entry.result === 'WIN';
              const isLoss = entry.result === 'LOSS';
              const badgeColor = isWin ? '#38bdf8' : isLoss ? '#f87171' : '#cbd5e1';
              const badgeBg = isWin
                ? 'rgba(56, 189, 248, 0.16)'
                : isLoss
                ? 'rgba(239, 68, 68, 0.16)'
                : 'rgba(148, 163, 184, 0.16)';
              const formattedDate = entry.created_at
                ? new Date(entry.created_at).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Recent';

              return (
                <div
                  key={entry.id}
                  style={{
                    backgroundColor: '#0a0f1d',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderLeft: `3px solid ${badgeColor}`,
                    borderRadius: 8,
                    padding: '0.75rem 0.95rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 280px', minWidth: 0 }}>
                    <span
                      style={{
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${badgeColor}`,
                        borderRadius: 4,
                        padding: '3px 9px',
                        fontFamily: 'var(--font-tech)',
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        letterSpacing: '0.05em',
                        flexShrink: 0
                      }}
                    >
                      {entry.result}
                    </span>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-tech)',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          color: '#f5f5f7',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          flexWrap: 'wrap'
                        }}
                      >
                        <span>{entry.lineup_name}</span>
                        <span style={{ color: '#64748b', fontSize: '0.78rem' }}>vs.</span>
                        <span style={{ color: '#cbd5e1' }}>{entry.opponent_name}</span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          flexWrap: 'wrap',
                          marginTop: 3,
                          fontSize: '0.74rem',
                          color: '#94a3b8',
                          fontFamily: 'var(--font-tech)'
                        }}
                      >
                        {entry.mvp_player_name && (
                          <span
                            style={{
                              color: '#38bdf8',
                              backgroundColor: 'rgba(56, 189, 248, 0.1)',
                              padding: '1px 7px',
                              borderRadius: 4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontWeight: 700
                            }}
                          >
                            <Award size={12} /> MVP: {entry.mvp_player_name}
                            {entry.mvp_stat_line ? ` (${entry.mvp_stat_line})` : ''}
                          </span>
                        )}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-tech)',
                        fontSize: '1.05rem',
                        fontWeight: 900,
                        color: isWin ? '#38bdf8' : isLoss ? '#f87171' : '#cbd5e1',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {entry.user_score} - {entry.opponent_score}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteHistoryEntry(entry.id)}
                      title="Delete matchup entry"
                      aria-label={`Delete matchup vs ${entry.opponent_name}`}
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#f87171',
                        borderRadius: 6,
                        padding: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
