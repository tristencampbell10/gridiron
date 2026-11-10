import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Award, Activity, Zap, TrendingUp, Shield, BarChart3, Calendar, CheckCircle2 } from 'lucide-react';
import { NFL_PLAYERS_2026, CURRENT_SEASON_INFO } from '../data/nfl2026Data';

export default function PlayerDetailPage() {
  const { id } = useParams();
  const player = NFL_PLAYERS_2026.find(p => p.id === id) || NFL_PLAYERS_2026[0];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
      <Link 
        to="/players" 
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 6, 
          color: 'var(--headline-gold)', 
          textDecoration: 'none', 
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: '1.25rem' 
        }}
      >
        <ArrowLeft size={16} /> Back to 2026 Players Roster
      </Link>

      {/* Player Header Banner */}
      <div style={{
        backgroundColor: 'var(--card-slate)',
        border: '1px solid var(--card-border)',
        borderRadius: 12,
        padding: '2rem',
        marginBottom: '2rem',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ 
                backgroundColor: 'var(--espn-red)', 
                color: '#fff', 
                fontFamily: 'var(--font-display)', 
                fontSize: '1.1rem', 
                padding: '2px 8px', 
                borderRadius: 4 
              }}>
                {player.number}
              </span>
              <span style={{ color: 'var(--headline-gold)', fontFamily: 'var(--font-tech)', fontWeight: 700 }}>
                {player.team} • {player.pos}
              </span>
              <span style={{ 
                backgroundColor: 'rgba(34, 197, 94, 0.15)', 
                color: '#4ade80', 
                fontSize: '0.75rem', 
                fontFamily: 'var(--font-tech)', 
                fontWeight: 700, 
                padding: '2px 8px', 
                borderRadius: 4 
              }}>
                {player.status}
              </span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3.25rem)', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 8 }}>
              {player.name}
            </h1>

            <p style={{ color: 'var(--text-secondary)', maxWidth: 680, fontSize: '0.95rem', lineHeight: 1.5 }}>
              {player.bio}
            </p>
          </div>

          <div style={{ background: 'var(--studio-charcoal)', border: '1px solid var(--card-border)', padding: '1.25rem 1.5rem', borderRadius: 8, textAlign: 'center', minWidth: 190 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-tech)' }}>
              Official Performance Rating
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--headline-gold)', lineHeight: 1, margin: '4px 0' }}>
              ★ {Number(player.player_performance_rating || 4.50).toFixed(2)}<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/5.00</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: 700 }}>
              {player.fantasyPts} FPTS ({player.status || 'ACTIVE'})
            </div>
          </div>
        </div>

        {/* 2026 Key Metric Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
          {player.pos === 'QB' && (
            <>
              <div style={{ background: 'var(--studio-charcoal)', padding: '0.75rem', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>PASS YARDS</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-tech)' }}>{player.passYds}</div>
              </div>
              <div style={{ background: 'var(--studio-charcoal)', padding: '0.75rem', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>PASS TD / INT</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--headline-gold)', fontFamily: 'var(--font-tech)' }}>{player.passTd} / {player.int}</div>
              </div>
              <div style={{ background: 'var(--studio-charcoal)', padding: '0.75rem', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>COMPLETION %</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ade80', fontFamily: 'var(--font-tech)' }}>{player.completionPct}%</div>
              </div>
              <div style={{ background: 'var(--studio-charcoal)', padding: '0.75rem', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>RUSH YDS / TD</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-tech)' }}>{player.rushYds} / {player.rushTd}</div>
              </div>
            </>
          )}

          {player.pos === 'RB' && (
            <>
              <div style={{ background: 'var(--studio-charcoal)', padding: '0.75rem', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>RUSH YARDS</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-tech)' }}>{player.rushYds}</div>
              </div>
              <div style={{ background: 'var(--studio-charcoal)', padding: '0.75rem', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>RUSH TD</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--headline-gold)', fontFamily: 'var(--font-tech)' }}>{player.rushTd}</div>
              </div>
              <div style={{ background: 'var(--studio-charcoal)', padding: '0.75rem', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>YARDS/CARRY</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ade80', fontFamily: 'var(--font-tech)' }}>{player.yardsPerCarry}</div>
              </div>
              <div style={{ background: 'var(--studio-charcoal)', padding: '0.75rem', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>SCRIMMAGE TD</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-tech)' }}>{player.rushTd + (player.recTd || 0)}</div>
              </div>
            </>
          )}

          {(player.pos === 'WR' || player.pos === 'TE') && (
            <>
              <div style={{ background: 'var(--studio-charcoal)', padding: '0.75rem', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>RECEPTIONS</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-tech)' }}>{player.rec}</div>
              </div>
              <div style={{ background: 'var(--studio-charcoal)', padding: '0.75rem', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>RECEIVING YDS</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-tech)' }}>{player.recYds}</div>
              </div>
              <div style={{ background: 'var(--studio-charcoal)', padding: '0.75rem', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>RECEIVING TD</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--headline-gold)', fontFamily: 'var(--font-tech)' }}>{player.recTd}</div>
              </div>
              <div style={{ background: 'var(--studio-charcoal)', padding: '0.75rem', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>AVG PER CATCH</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ade80', fontFamily: 'var(--font-tech)' }}>{player.yardsPerCatch}</div>
              </div>
            </>
          )}
        </div>

        <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(255, 204, 0, 0.08)', border: '1px solid rgba(255, 204, 0, 0.25)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} style={{ color: 'var(--headline-gold)' }} />
            <span style={{ fontSize: '0.85rem' }}>Upcoming Matchup: <strong>{player.nextGame}</strong></span>
          </div>
          <Link to="/compare" style={{ color: 'var(--headline-gold)', fontSize: '0.825rem', fontWeight: 700, textDecoration: 'none' }}>
            Compare {player.name} &rarr;
          </Link>
        </div>
      </div>

      {/* 2026 Game-by-Game Log */}
      <div style={{ backgroundColor: 'var(--card-slate)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={20} style={{ color: 'var(--espn-red)' }} /> {CURRENT_SEASON_INFO.year} Season Game-by-Game Performance Log
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--card-border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-tech)', fontSize: '0.8rem' }}>
                <th style={{ padding: '0.75rem' }}>WEEK / DATE</th>
                <th style={{ padding: '0.75rem' }}>OPPONENT</th>
                <th style={{ padding: '0.75rem' }}>RESULT</th>
                <th style={{ padding: '0.75rem' }}>KEY STAT LINE</th>
                <th style={{ padding: '0.75rem' }}>2026 FANTASY PTS</th>
              </tr>
            </thead>
            <tbody>
              {player.log2026 && player.log2026.map((g, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '0.75rem', fontFamily: 'var(--font-tech)', fontSize: '0.8rem', color: 'var(--headline-gold)' }}>
                    {g.week}
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{g.opp}</td>
                  <td style={{ padding: '0.75rem', color: g.result.startsWith('W') ? '#4ade80' : '#ef4444' }}>
                    {g.result}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {player.pos === 'QB' && `${g.yds} Pass YDS, ${g.td} TD, ${g.int} INT`}
                    {player.pos === 'RB' && `${g.rushYds} Rush YDS, ${g.td} TD`}
                    {(player.pos === 'WR' || player.pos === 'TE') && `${g.rec || 0} Rec, ${g.recYds} YDS, ${g.td} TD`}
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--headline-gold)', fontFamily: 'var(--font-tech)' }}>
                    {g.fpts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
