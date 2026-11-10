import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, ChevronRight, Star, Calendar, Shield, Award } from 'lucide-react';
import { NFL_PLAYERS_2026, CURRENT_SEASON_INFO } from '../data/nfl2026Data';

export default function PlayersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPos, setSelectedPos] = useState('ALL');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [sortBy, setSortBy] = useState('fpts'); // 'fpts' | 'rating' | 'yards' | 'td' | 'name'

  // Extract unique teams for filter dropdown
  const teamsList = Array.from(new Set(NFL_PLAYERS_2026.map(p => p.teamAbbr))).sort();

  const filteredPlayers = NFL_PLAYERS_2026
    .filter((p) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        p.name.toLowerCase().includes(term) || 
        p.team.toLowerCase().includes(term) ||
        p.teamAbbr.toLowerCase().includes(term) ||
        (p.college && p.college.toLowerCase().includes(term));
      
      const matchesPos = selectedPos === 'ALL' || p.pos === selectedPos;
      const matchesTeam = selectedTeam === 'ALL' || p.teamAbbr === selectedTeam;
      return matchesSearch && matchesPos && matchesTeam;
    })
    .sort((a, b) => {
      if (sortBy === 'fpts') return b.fantasyPts - a.fantasyPts;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'yards') {
        const yA = (a.passYds || 0) + (a.rushYds || 0) + (a.recYds || 0);
        const yB = (b.passYds || 0) + (b.rushYds || 0) + (b.recYds || 0);
        return yB - yA;
      }
      if (sortBy === 'td') {
        const tdA = (a.passTd || 0) + (a.rushTd || 0) + (a.recTd || 0);
        const tdB = (b.passTd || 0) + (b.rushTd || 0) + (b.recTd || 0);
        return tdB - tdA;
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--headline-gold)', fontFamily: 'var(--font-tech)', fontWeight: 700, marginBottom: 4 }}>
            <Calendar size={14} /> {CURRENT_SEASON_INFO.year} NFL SEASON • {CURRENT_SEASON_INFO.currentWeek.toUpperCase()} ACTUALS
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', textTransform: 'uppercase', lineHeight: 1 }}>
            NFL <span style={{ color: 'var(--espn-red)' }}>STARTING ROSTER & STATS</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            Verified 2026 performance numbers, game logs, and efficiency metrics for all marquee NFL starters.
          </p>
        </div>

        {/* Count Badge */}
        <div style={{ 
          background: 'var(--card-slate)', 
          border: '1px solid var(--card-border)', 
          padding: '0.5rem 1rem', 
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--font-tech)'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Showing:</span>
          <span style={{ color: 'var(--headline-gold)', fontWeight: 700, fontSize: '1rem' }}>
            {filteredPlayers.length} of {NFL_PLAYERS_2026.length} Active Starters
          </span>
        </div>
      </div>

      {/* Control Bar: Filters & Sorting */}
      <div style={{ 
        backgroundColor: 'var(--card-slate)', 
        border: '1px solid var(--card-border)', 
        borderRadius: 8, 
        padding: '1rem', 
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        {/* Position Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {['ALL', 'QB', 'RB', 'WR', 'TE', 'DST'].map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setSelectedPos(pos)}
              style={{
                backgroundColor: selectedPos === pos ? 'var(--espn-red)' : 'var(--studio-charcoal)',
                color: selectedPos === pos ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--card-border)',
                borderRadius: 6,
                padding: '0.45rem 0.85rem',
                fontFamily: 'var(--font-tech)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.15s'
              }}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* Team Dropdown & Sort */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>TEAM:</span>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="form-input"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem', width: 'auto' }}
            >
              <option value="ALL">All 32 Teams</option>
              {teamsList.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>SORT:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-input"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem', width: 'auto' }}
            >
              <option value="fpts">2026 Fantasy Points</option>
              <option value="rating">ESPN Grade / QBR</option>
              <option value="yards">Total Scrimmage/Pass YDS</option>
              <option value="td">Total Touchdowns</option>
              <option value="name">Player Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search by player name, team, position, or college (e.g. Lamar Jackson, Saquon, KC, LSU, Eagles)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          style={{ paddingLeft: 42 }}
        />
      </div>

      {/* Players Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
        {filteredPlayers.map((player) => {
          const latestLog = player.log2026 && player.log2026.length > 0 ? player.log2026[0] : null;

          return (
            <Link
              key={player.id}
              to={`/players/${player.id}`}
              style={{
                backgroundColor: 'var(--card-slate)',
                border: '1px solid var(--card-border)',
                borderRadius: 8,
                padding: '1.25rem',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div>
                {/* Header Tag */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ 
                      backgroundColor: 'var(--studio-charcoal)', 
                      border: '1px solid var(--card-border)', 
                      padding: '3px 8px', 
                      borderRadius: 4, 
                      fontFamily: 'var(--font-tech)', 
                      fontWeight: 700, 
                      fontSize: '0.8rem',
                      color: 'var(--headline-gold)'
                    }}>
                      {player.teamAbbr} • {player.pos} {player.number}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {player.division}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-tech)', fontSize: '0.95rem', color: '#4ade80', fontWeight: 700 }}>
                      {player.fantasyPts} FPTS
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>2026 Total</div>
                  </div>
                </div>

                {/* Name & Subtitle */}
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                  {player.name}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                  {player.team} • {player.gamesPlayed} GP in 2026
                </p>

                {/* 2026 Stats Box */}
                <div style={{ 
                  background: 'var(--studio-charcoal)', 
                  padding: '0.75rem', 
                  borderRadius: 6, 
                  border: '1px solid var(--card-border)',
                  fontSize: '0.825rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.75rem'
                }}>
                  {player.pos === 'QB' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>PASS YARDS</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-tech)' }}>{player.passYds}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>PASS TD/INT</div>
                        <div style={{ fontWeight: 700, color: 'var(--headline-gold)', fontFamily: 'var(--font-tech)' }}>{player.passTd}/{player.int}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>RUSH YDS</div>
                        <div style={{ fontWeight: 700, color: '#4ade80', fontFamily: 'var(--font-tech)' }}>{player.rushYds}</div>
                      </div>
                    </div>
                  )}

                  {player.pos === 'RB' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>RUSH YARDS</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-tech)' }}>{player.rushYds}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>RUSH TD</div>
                        <div style={{ fontWeight: 700, color: 'var(--headline-gold)', fontFamily: 'var(--font-tech)' }}>{player.rushTd}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>YARDS/CARRY</div>
                        <div style={{ fontWeight: 700, color: '#4ade80', fontFamily: 'var(--font-tech)' }}>{player.yardsPerCarry}</div>
                      </div>
                    </div>
                  )}

                  {(player.pos === 'WR' || player.pos === 'TE') && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>RECEPTIONS</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-tech)' }}>{player.rec}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>REC YDS</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-tech)' }}>{player.recYds}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TOUCHDOWNS</div>
                        <div style={{ fontWeight: 700, color: 'var(--headline-gold)', fontFamily: 'var(--font-tech)' }}>{player.recTd}</div>
                      </div>
                    </div>
                  )}

                  {player.pos === 'DST' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SACKS</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-tech)' }}>{player.sacks}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TURNOVERS</div>
                        <div style={{ fontWeight: 700, color: 'var(--headline-gold)', fontFamily: 'var(--font-tech)' }}>{player.turnovers}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>PTS ALLOWED</div>
                        <div style={{ fontWeight: 700, color: '#4ade80', fontFamily: 'var(--font-tech)' }}>{player.pointsAllowedPerGame} PPG</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Latest Week Game Status */}
                {latestLog && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '4px 8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 4
                  }}>
                    <span>{latestLog.week}: <strong>{latestLog.opp}</strong></span>
                    <span style={{ color: latestLog.result.startsWith('W') ? '#4ade80' : '#ef4444', fontWeight: 700 }}>
                      {latestLog.result}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer with Performance Rating bounded 0.00-5.00 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--card-border)', paddingTop: '0.75rem', marginTop: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    fontFamily: 'var(--font-tech)', 
                    fontWeight: 700, 
                    backgroundColor: 'rgba(34, 197, 94, 0.15)', 
                    color: '#4ade80', 
                    padding: '1px 6px', 
                    borderRadius: 3 
                  }}>
                    {player.status || 'ACTIVE'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    PPR: <strong style={{ color: 'var(--headline-gold)' }}>★ {Number(player.player_performance_rating || 4.25).toFixed(2)}</strong><span style={{ fontSize: '0.65rem' }}>/5.00</span>
                  </span>
                </div>
                <span style={{ color: 'var(--espn-red)', display: 'flex', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                  Profile <ChevronRight size={14} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
