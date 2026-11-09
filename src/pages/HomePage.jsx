import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, TrendingUp, Award, ArrowRight, Shield, Zap, Target, Star } from 'lucide-react';

export default function HomePage({ onOpenAuth, user }) {
  const highlights = [
    {
      id: 'h1',
      tag: 'PRIME TIME SHOWDOWN',
      title: 'Lamar Jackson vs Josh Allen: Week 11 MVP Stakes',
      desc: 'Breaking down defensive schemes, air yards per attempt, and red-zone rushing efficiency.',
      author: 'ESPN Analytics Desk',
      badge: 'FEATURED'
    },
    {
      id: 'h2',
      tag: 'FANTASY WAIVER WIRE',
      title: 'Top Breakout WRs Available in 40%+ of Leagues',
      desc: 'Target shares spiked for rookies emerging into slot dominance and endzone looks.',
      author: 'Gridiron Lab',
      badge: 'TRENDING'
    }
  ];

  const topPerformers = [
    { name: 'Patrick Mahomes', team: 'KC', pos: 'QB', stat: '342 YDS • 3 TD', rating: '98.4', id: 'mahomes' },
    { name: 'Saquon Barkley', team: 'PHI', pos: 'RB', stat: '146 YDS • 2 TD', rating: '96.2', id: 'barkley' },
    { name: 'Justin Jefferson', team: 'MIN', pos: 'WR', stat: '138 YDS • 1 TD', rating: '95.8', id: 'jefferson' },
    { name: 'Derrick Henry', team: 'BAL', pos: 'RB', stat: '112 YDS • 2 TD', rating: '94.5', id: 'henry' }
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
      {/* Studio Banner */}
      <section style={{ 
        background: 'linear-gradient(135deg, #1e1e1e 0%, #141414 60%, rgba(226,6,19,0.18) 100%)', 
        border: '1px solid var(--card-border)',
        borderRadius: 12,
        padding: '2.5rem 2rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--espn-red)', color: '#fff', padding: '3px 10px', borderRadius: 4, fontFamily: 'var(--font-tech)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '1rem' }}>
          <Flame size={14} /> LIVE GRIDIRON DESK
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1.05, textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem' }}>
          THE ULTIMATE NFL & FANTASY <span style={{ color: 'var(--headline-gold)' }}>COMMAND CENTER</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 720, marginBottom: '1.75rem', lineHeight: 1.6 }}>
          Live scores, in-depth player statistics, head-to-head metric comparisons, and advanced fantasy lineup builders with authentic ESPN studio aesthetics.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <Link
            to="/players"
            style={{
              backgroundColor: 'var(--espn-red)',
              color: '#ffffff',
              textDecoration: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: 6,
              fontFamily: 'var(--font-tech)',
              fontWeight: 700,
              fontSize: '0.95rem',
              letterSpacing: '0.05em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px var(--espn-red-glow)'
            }}
          >
            Explore Players <ArrowRight size={16} />
          </Link>

          <Link
            to="/compare"
            style={{
              backgroundColor: 'var(--card-slate)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              border: '1px solid var(--card-border)',
              padding: '0.75rem 1.5rem',
              borderRadius: 6,
              fontFamily: 'var(--font-tech)',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            Head-to-Head Comparison
          </Link>

          <Link
            to="/lineups"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--headline-gold)',
              textDecoration: 'none',
              border: '1px solid var(--headline-gold)',
              padding: '0.75rem 1.5rem',
              borderRadius: 6,
              fontFamily: 'var(--font-tech)',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            Build Lineup
          </Link>
        </div>
      </section>

      {/* Grid Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Headlines */}
        <div style={{ 
          backgroundColor: 'var(--card-slate)', 
          border: '1px solid var(--card-border)', 
          borderRadius: 10, 
          padding: '1.5rem' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={18} style={{ color: 'var(--headline-gold)' }} /> Studio Headlines
            </h2>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-tech)', color: 'var(--espn-red)', fontWeight: 700 }}>UPDATED LIVE</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {highlights.map((item) => (
              <div key={item.id} style={{ borderLeft: '3px solid var(--espn-red)', paddingLeft: '1rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--headline-gold)', fontFamily: 'var(--font-tech)', fontWeight: 700 }}>
                  {item.tag}
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: 4, marginBottom: 4 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 6 }}>
                  {item.desc}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  By {item.author}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers of the Week */}
        <div style={{ 
          backgroundColor: 'var(--card-slate)', 
          border: '1px solid var(--card-border)', 
          borderRadius: 10, 
          padding: '1.5rem' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Award size={18} style={{ color: 'var(--headline-gold)' }} /> Top Performers
            </h2>
            <Link to="/players" style={{ color: 'var(--headline-gold)', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
              View All &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {topPerformers.map((p, idx) => (
              <Link 
                key={p.id}
                to={`/players/${p.id}`}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '0.65rem 0.85rem', 
                  backgroundColor: 'var(--studio-charcoal)', 
                  border: '1px solid var(--card-border)', 
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-muted)', width: 18 }}>
                    #{idx + 1}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--headline-gold)', fontWeight: 700 }}>{p.team}</span> • {p.pos} • {p.stat}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-tech)', fontSize: '0.95rem', fontWeight: 700, color: '#4ade80' }}>
                    {p.rating}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ESPN QBR</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Fantasy & Lineup Callout */}
        <div style={{ 
          backgroundColor: 'var(--card-slate)', 
          border: '1px solid var(--card-border)', 
          borderRadius: 10, 
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--card-border)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              <Target size={18} style={{ color: 'var(--espn-red)' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', textTransform: 'uppercase' }}>
                Lineup Optimizer
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              Build salary-cap compliant rosters, simulate fantasy matchups against league opponents, and lock in your winning starters for Week 11.
            </p>
            <div style={{ background: 'var(--studio-charcoal)', padding: '0.85rem', borderRadius: 6, border: '1px solid var(--card-border)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Projected Optimal Score:</span>
                <span style={{ color: 'var(--headline-gold)', fontWeight: 700, fontFamily: 'var(--font-tech)' }}>148.6 FPTS</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Salary Cap Remaining:</span>
                <span style={{ color: '#4ade80', fontWeight: 700, fontFamily: 'var(--font-tech)' }}>$4,200</span>
              </div>
            </div>
          </div>

          <Link
            to="/lineups"
            style={{
              backgroundColor: 'var(--espn-red)',
              color: '#ffffff',
              textAlign: 'center',
              textDecoration: 'none',
              padding: '0.75rem',
              borderRadius: 6,
              fontFamily: 'var(--font-tech)',
              fontWeight: 700,
              fontSize: '0.9rem',
              letterSpacing: '0.04em',
              display: 'block'
            }}
          >
            Launch Lineup Builder &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
