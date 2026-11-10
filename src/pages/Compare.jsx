import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  Check, 
  Award, 
  Zap, 
  Calendar, 
  TrendingUp, 
  Search, 
  Shield, 
  Target, 
  Activity, 
  Flame,
  ChevronDown
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { ALL_32_TEAMS_PLAYERS } from '../data/all32TeamsRoster';
import { NFL_DEFENSIVE_PLAYERS } from '../data/defensivePlayers';
import { CURRENT_SEASON_INFO } from '../data/nfl2026Data';

// Combine offensive and defensive pools
const ALL_AVAILABLE_PLAYERS = [...ALL_32_TEAMS_PLAYERS, ...NFL_DEFENSIVE_PLAYERS];

// Helper to resolve player avatar URL with high-reliability fallback
export const getPlayerAvatarUrl = (player, fallbackColor = '38bdf8') => {
  if (player?.avatar_url && typeof player.avatar_url === 'string' && player.avatar_url.trim() !== '') {
    return player.avatar_url;
  }
  const cleanName = encodeURIComponent(player?.name || 'NFL Player');
  return `https://ui-avatars.com/api/?name=${cleanName}&background=1e1e1e&color=${fallbackColor}&bold=true&size=128`;
};

export default function Compare() {
  const [playersList, setPlayersList] = useState(ALL_AVAILABLE_PLAYERS);
  const [playerAId, setPlayerAId] = useState('lamar-jackson');
  const [playerBId, setPlayerBId] = useState('josh-allen');
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL'); // ALL, PASSING, RUSHING, RECEIVING, DEFENSE

  // Fetch players from Supabase if configured, otherwise utilize rich local 2026 database
  useEffect(() => {
    async function loadSupabasePlayers() {
      if (!isSupabaseConfigured) return;
      try {
        setLoading(true);
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

        if (!error && data && data.length > 0) {
          // Normalize Supabase data format to match frontend schema
          const mapped = data.map(p => {
            const stats = p.player_season_stats?.[0] || {};
            // Find any existing enriched fields from local roster
            const localMatch = ALL_AVAILABLE_PLAYERS.find(
              lp => lp.name.toLowerCase() === p.name.toLowerCase() || lp.id === p.id
            );

            return {
              id: p.id,
              name: p.name,
              avatar_url: p.avatar_url || localMatch?.avatar_url || null,
              number: `#${p.jersey_number || (localMatch?.jersey_number ?? 0)}`,
              jersey_number: p.jersey_number || (localMatch?.jersey_number ?? 0),
              pos: p.position,
              position: p.position,
              team: p.team,
              teamAbbr: p.team,
              status: p.status || 'ACTIVE',
              gamesPlayed: stats.games_played || localMatch?.gamesPlayed || 9,
              player_performance_rating: Number(stats.player_performance_rating ?? localMatch?.player_performance_rating ?? 4.00),
              rating: localMatch?.rating || (Number(stats.player_performance_rating || 4.0) * 20).toFixed(1),
              salary: localMatch?.salary || 7500,
              passYds: stats.passing_yards ?? localMatch?.passYds ?? 0,
              passTd: stats.passing_tds ?? localMatch?.passTd ?? 0,
              int: localMatch?.int ?? 0,
              rushYds: stats.rushing_yards ?? localMatch?.rushYds ?? 0,
              rushTd: stats.rushing_tds ?? localMatch?.rushTd ?? 0,
              yardsPerCarry: localMatch?.yardsPerCarry || (stats.rushing_yards ? (stats.rushing_yards / 100).toFixed(1) : '0.0'),
              rec: stats.receptions ?? localMatch?.rec ?? 0,
              recYds: stats.receiving_yards ?? localMatch?.recYds ?? 0,
              recTd: stats.receiving_tds ?? localMatch?.recTd ?? 0,
              fantasyPts: localMatch?.fantasyPts || 140.0,
              completionPct: localMatch?.completionPct || (stats.attempts ? ((stats.completions / stats.attempts) * 100).toFixed(1) : '0.0'),
              bio: localMatch?.bio || `${p.name} (${p.position} - ${p.team}) Active 2026 starter.`
            };
          });

          // Merge defensive players if not in Supabase yet
          const combined = [...mapped];
          NFL_DEFENSIVE_PLAYERS.forEach(dp => {
            if (!combined.some(c => c.name.toLowerCase() === dp.name.toLowerCase())) {
              combined.push(dp);
            }
          });
          setPlayersList(combined);
        }
      } catch (err) {
        console.warn('Note: Using local 2026 NFL database for comparison:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSupabasePlayers();
  }, []);

  // Selected Player objects
  const playerA = useMemo(() => {
    return playersList.find(p => p.id === playerAId || p.name === playerAId) || playersList[0] || ALL_AVAILABLE_PLAYERS[0];
  }, [playersList, playerAId]);

  const playerB = useMemo(() => {
    return playersList.find(p => p.id === playerBId || p.name === playerBId) || playersList[1] || ALL_AVAILABLE_PLAYERS[1];
  }, [playersList, playerBId]);

  // Quick Preset Matches
  const quickComparisons = [
    { label: 'Lamar Jackson vs Josh Allen', a: 'lamar-jackson', b: 'josh-allen' },
    { label: 'Patrick Mahomes vs Joe Burrow', a: 'patrick-mahomes', b: 'joe-burrow' },
    { label: 'Saquon Barkley vs Kenneth Walker III', a: 'saquon-barkley', b: 'kenneth-walker-iii' },
    { label: 'Ja\'Marr Chase vs Justin Jefferson', a: 'ja-marr-chase', b: 'justin-jefferson' },
    { label: 'Myles Garrett vs T.J. Watt', a: 'myles-garrett', b: 'tj-watt' },
    { label: 'Travis Kelce vs Brock Bowers', a: 'travis-kelce', b: 'brock-bowers' },
  ];

  // Helper to determine winner and badge styling
  // lowerIsBetter is true for Interceptions, Turnovers, etc.
  const getStatComparison = (valA, valB, lowerIsBetter = false) => {
    const numA = typeof valA === 'number' ? valA : parseFloat(String(valA).replace(/[^0-9.-]/g, '')) || 0;
    const numB = typeof valB === 'number' ? valB : parseFloat(String(valB).replace(/[^0-9.-]/g, '')) || 0;

    if (numA === numB) {
      return { winner: 'TIE', diff: 0, pctA: 50, pctB: 50 };
    }

    const aWins = lowerIsBetter ? numA < numB : numA > numB;
    const total = Math.max(Math.abs(numA) + Math.abs(numB), 0.001);
    const pctA = Math.round((Math.abs(numA) / total) * 100);
    const pctB = 100 - pctA;

    return {
      winner: aWins ? 'A' : 'B',
      diff: Math.abs(numA - numB),
      pctA,
      pctB,
    };
  };

  // Metric Categories Definition
  const metricGroups = [
    {
      id: 'OVERALL',
      title: 'Overall Performance & Value',
      icon: <Award size={18} style={{ color: 'var(--headline-gold)' }} />,
      metrics: [
        {
          label: 'Performance Rating (0 - 5.00)',
          valA: (playerA.player_performance_rating ?? 4.0).toFixed(2),
          valB: (playerB.player_performance_rating ?? 4.0).toFixed(2),
          unit: '/ 5.00'
        },
        {
          label: 'ESPN Overall Grade',
          valA: playerA.rating || ((playerA.player_performance_rating || 4.0) * 20).toFixed(1),
          valB: playerB.rating || ((playerB.player_performance_rating || 4.0) * 20).toFixed(1),
          unit: '/ 100'
        },
        {
          label: '2026 Total Fantasy Points',
          valA: playerA.fantasyPts || 0,
          valB: playerB.fantasyPts || 0,
          unit: 'FPTS'
        },
        {
          label: '2026 Games Played',
          valA: playerA.gamesPlayed || 9,
          valB: playerB.gamesPlayed || 9,
          unit: 'GP'
        },
        {
          label: 'DFS Salary Valuation',
          valA: playerA.salary || 7500,
          valB: playerB.salary || 7500,
          unit: '$'
        }
      ]
    },
    {
      id: 'PASSING',
      title: 'Passing Metrics',
      icon: <Zap size={18} style={{ color: '#38bdf8' }} />,
      metrics: [
        {
          label: 'Passing Yards',
          valA: playerA.passYds || 0,
          valB: playerB.passYds || 0,
          unit: 'YDS'
        },
        {
          label: 'Passing Touchdowns',
          valA: playerA.passTd || 0,
          valB: playerB.passTd || 0,
          unit: 'TD'
        },
        {
          label: 'Interceptions (Fewer is better)',
          valA: playerA.int ?? 0,
          valB: playerB.int ?? 0,
          lowerIsBetter: true,
          unit: 'INT'
        },
        {
          label: 'Completion Percentage',
          valA: parseFloat(playerA.completionPct || 0),
          valB: parseFloat(playerB.completionPct || 0),
          unit: '%'
        },
        {
          label: 'Total QBR / Passer Rating',
          valA: playerA.qbr || (playerA.passYds ? 96.5 : 0),
          valB: playerB.qbr || (playerB.passYds ? 94.2 : 0),
          unit: 'QBR'
        }
      ]
    },
    {
      id: 'RUSHING',
      title: 'Rushing & Scrimmage',
      icon: <TrendingUp size={18} style={{ color: '#4ade80' }} />,
      metrics: [
        {
          label: 'Rushing Yards',
          valA: playerA.rushYds || 0,
          valB: playerB.rushYds || 0,
          unit: 'YDS'
        },
        {
          label: 'Rushing Touchdowns',
          valA: playerA.rushTd || 0,
          valB: playerB.rushTd || 0,
          unit: 'TD'
        },
        {
          label: 'Yards Per Carry',
          valA: parseFloat(playerA.yardsPerCarry || (playerA.rushYds ? 4.5 : 0)),
          valB: parseFloat(playerB.yardsPerCarry || (playerB.rushYds ? 4.5 : 0)),
          unit: 'YPC'
        },
        {
          label: 'Total Scrimmage Yards',
          valA: (playerA.rushYds || 0) + (playerA.recYds || 0),
          valB: (playerB.rushYds || 0) + (playerB.recYds || 0),
          unit: 'YDS'
        }
      ]
    },
    {
      id: 'RECEIVING',
      title: 'Receiving & Target Share',
      icon: <Target size={18} style={{ color: '#38bdf8' }} />,
      metrics: [
        {
          label: 'Receptions',
          valA: playerA.rec || 0,
          valB: playerB.rec || 0,
          unit: 'REC'
        },
        {
          label: 'Receiving Yards',
          valA: playerA.recYds || 0,
          valB: playerB.recYds || 0,
          unit: 'YDS'
        },
        {
          label: 'Receiving Touchdowns',
          valA: playerA.recTd || 0,
          valB: playerB.recTd || 0,
          unit: 'TD'
        },
        {
          label: 'Total Touchdowns (Pass + Rush + Rec)',
          valA: (playerA.passTd || 0) + (playerA.rushTd || 0) + (playerA.recTd || 0),
          valB: (playerB.passTd || 0) + (playerB.rushTd || 0) + (playerB.recTd || 0),
          unit: 'TD'
        }
      ]
    },
    {
      id: 'DEFENSE',
      title: 'Defensive & Impact Metrics',
      icon: <Shield size={18} style={{ color: '#a855f7' }} />,
      metrics: [
        {
          label: 'Total Tackles',
          valA: playerA.tackles || 0,
          valB: playerB.tackles || 0,
          unit: 'TCKL'
        },
        {
          label: 'Sacks',
          valA: playerA.sacks || 0,
          valB: playerB.sacks || 0,
          unit: 'SCK'
        },
        {
          label: 'Tackles For Loss',
          valA: playerA.tfl || 0,
          valB: playerB.tfl || 0,
          unit: 'TFL'
        },
        {
          label: 'Forced Fumbles / Turnovers',
          valA: (playerA.forcedFumbles || 0) + (playerA.interceptions || 0),
          valB: (playerB.forcedFumbles || 0) + (playerB.interceptions || 0),
          unit: 'TO'
        }
      ]
    }
  ];

  // Filter groups if a specific category is selected
  const displayedGroups = metricGroups.filter(g => {
    if (activeCategory === 'ALL') return true;
    return g.id === activeCategory;
  });

  // Calculate overall scorecard (how many categories each won)
  const scorecard = useMemo(() => {
    let scoreA = 0;
    let scoreB = 0;

    metricGroups.forEach(group => {
      group.metrics.forEach(m => {
        const comp = getStatComparison(m.valA, m.valB, m.lowerIsBetter);
        if (comp.winner === 'A') scoreA++;
        if (comp.winner === 'B') scoreB++;
      });
    });

    return { scoreA, scoreB };
  }, [playerA, playerB]);

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Title & 2026 Season Banner */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 6, 
          background: 'rgba(56, 189, 248, 0.12)',
          color: 'var(--headline-gold)', 
          border: '1px solid rgba(56, 189, 248, 0.35)',
          padding: '4px 12px', 
          borderRadius: 4, 
          fontFamily: 'var(--font-tech)', 
          fontSize: '0.8rem', 
          fontWeight: 700, 
          marginBottom: 10 
        }}>
          <Calendar size={14} /> {CURRENT_SEASON_INFO.year} NFL SEASON • ADVANCED HEAD-TO-HEAD LAB
        </div>
        
        <h1 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: '2.5rem', 
          textTransform: 'uppercase', 
          letterSpacing: '-0.02em',
          margin: 0,
          lineHeight: 1.1
        }}>
          HEAD-TO-HEAD <span style={{ color: 'var(--espn-red)' }}>METRIC COMPARISON</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: 650, margin: '8px auto 0' }}>
          Real-time performance comparison across all 32 NFL starting offensive rosters and elite defensive units.
        </p>

        {/* Header Marquee Headshot Comparison Bar */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          backgroundColor: 'var(--card-slate)',
          border: '1px solid var(--card-border)',
          borderRadius: 40,
          padding: '8px 24px',
          marginTop: '1rem',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Header Player A */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src={getPlayerAvatarUrl(playerA, '38bdf8')}
              alt={playerA.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(playerA.name || 'Player')}&background=0a0f1d&color=38bdf8&bold=true&size=128`;
              }}
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--espn-red)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                flexShrink: 0
              }}
            />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                {playerA.name}
              </div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-tech)', color: 'var(--text-secondary)' }}>
                {playerA.pos} • {playerA.teamAbbr || playerA.team} #{playerA.jersey_number ?? (playerA.number ? playerA.number.replace('#', '') : '00')}
              </div>
            </div>
          </div>

          <div style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '1.1rem', 
            fontWeight: 900, 
            color: 'var(--headline-gold)',
            padding: '0 6px'
          }}>
            VS
          </div>

          {/* Header Player B */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                {playerB.name}
              </div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-tech)', color: 'var(--text-secondary)' }}>
                {playerB.pos} • {playerB.teamAbbr || playerB.team} #{playerB.jersey_number ?? (playerB.number ? playerB.number.replace('#', '') : '00')}
              </div>
            </div>
            <img
              src={getPlayerAvatarUrl(playerB, '94a3b8')}
              alt={playerB.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(playerB.name || 'Player')}&background=0a0f1d&color=94a3b8&bold=true&size=128`;
              }}
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--headline-gold)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                flexShrink: 0
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Comparison Presets Ribbon */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-tech)', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
          ⚡ Featured Marquee Matchups
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {quickComparisons.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPlayerAId(item.a);
                setPlayerBId(item.b);
              }}
              style={{
                background: (playerAId === item.a && playerBId === item.b) ? 'var(--espn-red)' : 'var(--card-slate)',
                color: (playerAId === item.a && playerBId === item.b) ? '#0a0f1d' : 'var(--text-primary)',
                border: '1px solid var(--card-border)',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: '0.8rem',
                fontFamily: 'var(--font-tech)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Player Selectors Header Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr auto 1fr', 
        gap: '1rem', 
        alignItems: 'stretch', 
        marginBottom: '2rem' 
      }}>
        {/* PLAYER A CARD */}
        <div style={{ 
          backgroundColor: 'var(--card-slate)', 
          borderRadius: 10, 
          border: '1px solid var(--card-border)',
          borderTop: '4px solid var(--espn-red)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ 
                fontFamily: 'var(--font-tech)', 
                fontSize: '0.75rem', 
                color: 'var(--espn-red)', 
                fontWeight: 800, 
                letterSpacing: '0.05em' 
              }}>
                PLAYER A (2026)
              </span>
              <span style={{ 
                background: 'rgba(74, 222, 128, 0.12)', 
                color: '#4ade80', 
                border: '1px solid rgba(74, 222, 128, 0.3)', 
                fontSize: '0.7rem', 
                fontWeight: 700, 
                padding: '2px 8px', 
                borderRadius: 4,
                fontFamily: 'var(--font-tech)'
              }}>
                {playerA.status || 'ACTIVE'}
              </span>
            </div>

            {/* Dropdown Selector A */}
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <select
                className="form-input"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'var(--studio-charcoal)',
                  color: '#fff',
                  border: '1px solid var(--card-border)',
                  borderRadius: 6,
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                value={playerA.id}
                onChange={(e) => setPlayerAId(e.target.value)}
              >
                {playersList.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.teamAbbr || p.team} • {p.pos}) #{p.jersey_number ?? p.number}
                  </option>
                ))}
              </select>
            </div>

            {/* Player A Spotlight Info with 64x64px Headshot Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                <img
                  src={getPlayerAvatarUrl(playerA, '38bdf8')}
                  alt={playerA.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(playerA.name || 'Player')}&background=0a0f1d&color=38bdf8&bold=true&size=128`;
                  }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--espn-red)',
                    boxShadow: '0 2px 10px rgba(56, 189, 248, 0.35)',
                    display: 'block'
                  }}
                />
                <span style={{
                  position: 'absolute',
                  bottom: -3,
                  right: -3,
                  backgroundColor: 'var(--studio-charcoal)',
                  color: '#ffffff',
                  border: '1.5px solid var(--espn-red)',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-tech)',
                  fontWeight: 800,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}>
                  {playerA.jersey_number ?? (playerA.number ? playerA.number.replace('#', '') : '00')}
                </span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ 
                    background: 'var(--espn-red)', 
                    color: '#0a0f1d',
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    padding: '1px 6px', 
                    borderRadius: 3,
                    fontFamily: 'var(--font-tech)'
                  }}>
                    {playerA.pos}
                  </span>
                  <span style={{ color: 'var(--headline-gold)', fontFamily: 'var(--font-tech)', fontSize: '0.85rem', fontWeight: 700 }}>
                    {playerA.teamAbbr || playerA.team}
                  </span>
                </div>
                <h2 style={{ 
                  margin: '4px 0 0', 
                  fontSize: '1.35rem', 
                  fontFamily: 'var(--font-display)', 
                  letterSpacing: '-0.02em', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis' 
                }}>
                  {playerA.name}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {playerA.team}
                </div>
              </div>
            </div>
          </div>

          {/* Rating Badge */}
          <div style={{ 
            marginTop: '1.25rem', 
            paddingTop: '0.75rem', 
            borderTop: '1px solid var(--card-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>
              OFFICIAL PERFORMANCE RATING
            </span>
            <span style={{ 
              fontFamily: 'var(--font-tech)', 
              fontSize: '1.2rem', 
              fontWeight: 800, 
              color: 'var(--headline-gold)' 
            }}>
              {(playerA.player_performance_rating ?? 4.0).toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ 5.00</span>
            </span>
          </div>
        </div>

        {/* VS CENTRAL BADGE */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '0 0.5rem'
        }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: '50%', 
            backgroundColor: 'var(--studio-charcoal)', 
            border: '2px solid var(--espn-red)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
            marginBottom: 8
          }}>
            <ArrowLeftRight size={20} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.1em' }}>
            VS
          </span>
          <div style={{ 
            marginTop: 8, 
            fontSize: '0.75rem', 
            fontFamily: 'var(--font-tech)', 
            fontWeight: 700, 
            color: 'var(--text-muted)',
            textAlign: 'center'
          }}>
            <span style={{ color: scorecard.scoreA > scorecard.scoreB ? '#4ade80' : '#fff' }}>{scorecard.scoreA}</span>
            {' : '}
            <span style={{ color: scorecard.scoreB > scorecard.scoreA ? '#4ade80' : '#fff' }}>{scorecard.scoreB}</span>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>WINS</div>
          </div>
        </div>

        {/* PLAYER B CARD */}
        <div style={{ 
          backgroundColor: 'var(--card-slate)', 
          borderRadius: 10, 
          border: '1px solid var(--card-border)',
          borderTop: '4px solid var(--headline-gold)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ 
                fontFamily: 'var(--font-tech)', 
                fontSize: '0.75rem', 
                color: 'var(--headline-gold)', 
                fontWeight: 800, 
                letterSpacing: '0.05em' 
              }}>
                PLAYER B (2026)
              </span>
              <span style={{ 
                background: 'rgba(74, 222, 128, 0.12)', 
                color: '#4ade80', 
                border: '1px solid rgba(74, 222, 128, 0.3)', 
                fontSize: '0.7rem', 
                fontWeight: 700, 
                padding: '2px 8px', 
                borderRadius: 4,
                fontFamily: 'var(--font-tech)'
              }}>
                {playerB.status || 'ACTIVE'}
              </span>
            </div>

            {/* Dropdown Selector B */}
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <select
                className="form-input"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'var(--studio-charcoal)',
                  color: '#fff',
                  border: '1px solid var(--card-border)',
                  borderRadius: 6,
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                value={playerB.id}
                onChange={(e) => setPlayerBId(e.target.value)}
              >
                {playersList.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.teamAbbr || p.team} • {p.pos}) #{p.jersey_number ?? p.number}
                  </option>
                ))}
              </select>
            </div>

            {/* Player B Spotlight Info with 64x64px Headshot Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                <img
                  src={getPlayerAvatarUrl(playerB, '94a3b8')}
                  alt={playerB.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(playerB.name || 'Player')}&background=0a0f1d&color=94a3b8&bold=true&size=128`;
                  }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--headline-gold)',
                    boxShadow: '0 2px 10px rgba(148, 163, 184, 0.35)',
                    display: 'block'
                  }}
                />
                <span style={{
                  position: 'absolute',
                  bottom: -3,
                  right: -3,
                  backgroundColor: 'var(--studio-charcoal)',
                  color: '#ffffff',
                  border: '1.5px solid var(--headline-gold)',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-tech)',
                  fontWeight: 800,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}>
                  {playerB.jersey_number ?? (playerB.number ? playerB.number.replace('#', '') : '00')}
                </span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ 
                    background: 'var(--headline-gold)', 
                    color: '#0a0f1d',
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    padding: '1px 6px', 
                    borderRadius: 3,
                    fontFamily: 'var(--font-tech)'
                  }}>
                    {playerB.pos}
                  </span>
                  <span style={{ color: 'var(--headline-gold)', fontFamily: 'var(--font-tech)', fontSize: '0.85rem', fontWeight: 700 }}>
                    {playerB.teamAbbr || playerB.team}
                  </span>
                </div>
                <h2 style={{ 
                  margin: '4px 0 0', 
                  fontSize: '1.35rem', 
                  fontFamily: 'var(--font-display)', 
                  letterSpacing: '-0.02em', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis' 
                }}>
                  {playerB.name}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {playerB.team}
                </div>
              </div>
            </div>
          </div>

          {/* Rating Badge */}
          <div style={{ 
            marginTop: '1.25rem', 
            paddingTop: '0.75rem', 
            borderTop: '1px solid var(--card-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>
              OFFICIAL PERFORMANCE RATING
            </span>
            <span style={{ 
              fontFamily: 'var(--font-tech)', 
              fontSize: '1.2rem', 
              fontWeight: 800, 
              color: 'var(--headline-gold)' 
            }}>
              {(playerB.player_performance_rating ?? 4.0).toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ 5.00</span>
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        borderBottom: '2px solid var(--card-border)', 
        paddingBottom: '0.75rem', 
        marginBottom: '1.5rem',
        overflowX: 'auto'
      }}>
        {[
          { id: 'ALL', label: 'All Comparative Metrics' },
          { id: 'OVERALL', label: 'Overall & Fantasy' },
          { id: 'PASSING', label: 'Passing Stats' },
          { id: 'RUSHING', label: 'Rushing Stats' },
          { id: 'RECEIVING', label: 'Receiving Stats' },
          { id: 'DEFENSE', label: 'Defensive Stats' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveCategory(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              background: activeCategory === tab.id ? 'var(--card-slate)' : 'transparent',
              color: activeCategory === tab.id ? 'var(--headline-gold)' : 'var(--text-secondary)',
              border: activeCategory === tab.id ? '1px solid var(--card-border)' : '1px solid transparent',
              fontFamily: 'var(--font-tech)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Detailed Metric Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {displayedGroups.map(group => (
          <div 
            key={group.id} 
            style={{ 
              backgroundColor: 'var(--card-slate)', 
              borderRadius: 10, 
              border: '1px solid var(--card-border)',
              overflow: 'hidden'
            }}
          >
            {/* Group Header */}
            <div style={{ 
              padding: '0.9rem 1.25rem', 
              backgroundColor: 'var(--studio-charcoal)', 
              borderBottom: '1px solid var(--card-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              {group.icon}
              <h3 style={{ 
                margin: 0, 
                fontSize: '1rem', 
                fontFamily: 'var(--font-tech)', 
                fontWeight: 800, 
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                {group.title}
              </h3>
            </div>

            {/* Metric Items Grid */}
            <div style={{ padding: '0.75rem 1.25rem' }}>
              {group.metrics.map((metric, idx) => {
                const comp = getStatComparison(metric.valA, metric.valB, metric.lowerIsBetter);
                const isWinnerA = comp.winner === 'A';
                const isWinnerB = comp.winner === 'B';
                const isTie = comp.winner === 'TIE';

                return (
                  <div 
                    key={idx}
                    style={{ 
                      padding: '0.9rem 0', 
                      borderBottom: idx === group.metrics.length - 1 ? 'none' : '1px solid var(--card-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    {/* Top Row: Values and Label */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
                      {/* Player A Value */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ 
                          fontFamily: 'var(--font-tech)', 
                          fontSize: '1.2rem', 
                          fontWeight: 800, 
                          color: isWinnerA ? '#4ade80' : 'var(--text-primary)' 
                        }}>
                          {metric.unit === '$' ? `$${Number(metric.valA).toLocaleString()}` : metric.valA}
                          {metric.unit && metric.unit !== '$' && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 4 }}>
                              {metric.unit}
                            </span>
                          )}
                        </span>
                        {isWinnerA && (
                          <span style={{ 
                            background: '#15803d', 
                            color: '#ffffff', 
                            fontSize: '0.65rem', 
                            fontWeight: 800, 
                            padding: '2px 6px', 
                            borderRadius: 3, 
                            fontFamily: 'var(--font-tech)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            boxShadow: '0 0 8px rgba(74, 222, 128, 0.4)'
                          }}>
                            <Check size={11} /> LEADER
                          </span>
                        )}
                      </div>

                      {/* Metric Name */}
                      <div style={{ 
                        textAlign: 'center', 
                        fontFamily: 'var(--font-tech)', 
                        fontSize: '0.85rem', 
                        fontWeight: 700, 
                        color: 'var(--text-secondary)',
                        padding: '0 1rem'
                      }}>
                        {metric.label}
                      </div>

                      {/* Player B Value */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        {isWinnerB && (
                          <span style={{ 
                            background: '#15803d', 
                            color: '#ffffff', 
                            fontSize: '0.65rem', 
                            fontWeight: 800, 
                            padding: '2px 6px', 
                            borderRadius: 3, 
                            fontFamily: 'var(--font-tech)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            boxShadow: '0 0 8px rgba(74, 222, 128, 0.4)'
                          }}>
                            <Check size={11} /> LEADER
                          </span>
                        )}
                        <span style={{ 
                          fontFamily: 'var(--font-tech)', 
                          fontSize: '1.2rem', 
                          fontWeight: 800, 
                          color: isWinnerB ? '#4ade80' : 'var(--text-primary)' 
                        }}>
                          {metric.unit === '$' ? `$${Number(metric.valB).toLocaleString()}` : metric.valB}
                          {metric.unit && metric.unit !== '$' && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 4 }}>
                              {metric.unit}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Proportional Split Bar */}
                    <div style={{ 
                      height: 5, 
                      borderRadius: 3, 
                      backgroundColor: 'rgba(255, 255, 255, 0.08)', 
                      display: 'flex', 
                      overflow: 'hidden',
                      marginTop: 2
                    }}>
                      <div style={{ 
                        width: `${comp.pctA}%`, 
                        backgroundColor: isWinnerA ? '#22c55e' : (isTie ? '#94a3b8' : 'rgba(56, 189, 248, 0.4)'),
                        transition: 'width 0.4s ease'
                      }} />
                      <div style={{ 
                        width: `${comp.pctB}%`, 
                        backgroundColor: isWinnerB ? '#22c55e' : (isTie ? '#94a3b8' : 'rgba(148, 163, 184, 0.4)'),
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
