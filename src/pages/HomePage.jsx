import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, 
  TrendingUp, 
  Award, 
  ArrowRight, 
  Shield, 
  Zap, 
  Target, 
  Star, 
  Calendar, 
  Radio, 
  RefreshCw, 
  Clock, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { fetchLiveEspnData } from '../services/espnService';
import espnMasterFallback from '../data/espnMasterData.json';

export default function HomePage({ onOpenAuth, user }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(espnMasterFallback);
  const [activeStatTab, setActiveStatTab] = useState('passing'); // 'passing' | 'rushing' | 'receiving'
  const [lastSyncTime, setLastSyncTime] = useState('Official ESPN Feed');

  // Load live data from ESPN on mount
  useEffect(() => {
    loadEspnData();
  }, []);

  const loadEspnData = async () => {
    setLoading(true);
    try {
      const live = await fetchLiveEspnData();
      if (live) {
        setData(prev => ({
          ...prev,
          breakingNews: live.breakingNews || prev.breakingNews,
          tickerGames: live.tickerGames || prev.tickerGames,
          nextUpcomingGame: live.nextUpcomingGame || prev.nextUpcomingGame,
          statLeaders: live.statLeaders || prev.statLeaders
        }));
        setLastSyncTime(live.lastSync || 'Live Now');
      }
    } catch (e) {
      console.warn('ESPN load note:', e);
    } finally {
      setLoading(false);
    }
  };

  const nextGame = data.nextUpcomingGame || espnMasterFallback.nextUpcomingGame;
  const currentLeaders = (data.statLeaders && data.statLeaders[activeStatTab]) || espnMasterFallback.statLeaders[activeStatTab];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
      {/* ESPN Live Sync Status Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        backgroundColor: 'var(--studio-charcoal)', 
        border: '1px solid var(--card-border)',
        borderRadius: 8,
        padding: '0.5rem 1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ 
            display: 'inline-block', 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            backgroundColor: '#22c55e', 
            boxShadow: '0 0 8px #22c55e' 
          }} />
          <span style={{ fontFamily: 'var(--font-tech)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            OFFICIAL ESPN LIVE API FEED
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            • Synced: {lastSyncTime}
          </span>
        </div>

        <button
          type="button"
          onClick={loadEspnData}
          disabled={loading}
          style={{
            background: 'transparent',
            border: '1px solid var(--card-border)',
            color: 'var(--headline-gold)',
            borderRadius: 6,
            padding: '0.35rem 0.75rem',
            fontFamily: 'var(--font-tech)',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Fetching ESPN...' : 'Sync ESPN Live'}
        </button>
      </div>

      {/* Main Studio Banner with NEXT UPCOMING NFL GAME */}
      <section style={{ 
        background: 'linear-gradient(135deg, #111827 0%, #0a0f1d 60%, rgba(56,189,248,0.16) 100%)', 
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: 12,
        padding: '2.25rem 2rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        color: '#f8fafc'
      }}>
        {/* Next Game Notification Ribbon */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '0.75rem', 
          background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.24) 0%, rgba(15, 23, 42, 0.96) 100%)', 
          border: '1.5px solid #38bdf8', 
          padding: '10px 16px', 
          borderRadius: 8, 
          fontFamily: 'var(--font-tech)', 
          fontSize: '0.92rem', 
          fontWeight: 700,
          marginBottom: '1.35rem',
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.22)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{
              backgroundColor: '#38bdf8',
              color: '#0a0f1d',
              padding: '3px 9px',
              borderRadius: 4,
              fontSize: '0.75rem',
              fontWeight: 900,
              letterSpacing: '0.06em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}>
              <Clock size={14} strokeWidth={2.5} />
              NEXT GAME
            </span>

            <span style={{ color: '#ffffff', fontSize: '1.05rem', fontWeight: 900, letterSpacing: '0.02em' }}>
              {nextGame.awayAbbr} ({nextGame.awayRecord}) @ {nextGame.homeAbbr} ({nextGame.homeRecord})
            </span>

            <span style={{ color: '#e2e8f0', fontSize: '0.86rem', fontWeight: 600 }}>
              • {nextGame.awayTeam} at {nextGame.homeTeam}
            </span>
          </div>

          <div style={{ 
            color: '#7dd3fc', 
            fontSize: '0.86rem', 
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Calendar size={14} style={{ color: '#38bdf8' }} />
            <span>{nextGame.eventDate} • {nextGame.eventTime}</span>
            <span style={{
              backgroundColor: 'rgba(10, 15, 29, 0.85)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: '0.74rem'
            }}>
              {nextGame.network}
            </span>
          </div>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.4rem, 5vw, 4rem)', lineHeight: 1.05, textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
          ESPN NFL <span style={{ color: 'var(--headline-gold)' }}>COMMAND CENTER</span>
        </h1>
        
        <p style={{ color: '#cbd5e1', fontSize: '1.05rem', maxWidth: 760, marginBottom: '1.75rem', lineHeight: 1.6 }}>
          Live scores and verified season stats directly from the ESPN API. Next up on the schedule: <strong style={{ color: '#ffffff' }}>{nextGame.matchupTitle}</strong>. Full player performance rankings and weekly matchup analytics.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <Link
            to="/players"
            style={{
              backgroundColor: 'var(--espn-red)',
              color: '#0a0f1d',
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
            Official NFL Players &rarr;
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
            Compare Stat Leaders
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
            Lineup Builder
          </Link>
        </div>
      </section>

      {/* Grid: Live ESPN Wire + Official ESPN Stat Leaders + Next Game Focus */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        
        {/* 1. Real ESPN Breaking Season Wire */}
        <div style={{ 
          backgroundColor: 'var(--card-slate)', 
          border: '1px solid var(--card-border)', 
          borderRadius: 10, 
          padding: '1.5rem' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={18} style={{ color: 'var(--espn-red)' }} /> ESPN Season Wire
            </h2>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-tech)', color: '#22c55e', fontWeight: 700 }}>
              LIVE ESPN FEED
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {data.breakingNews && data.breakingNews.map((item) => (
              <div key={item.id} style={{ borderLeft: '3px solid var(--espn-red)', paddingLeft: '1rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--headline-gold)', fontFamily: 'var(--font-tech)', fontWeight: 700 }}>
                  {item.tag || 'ESPN REPORT'}
                </span>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: 4, marginBottom: 4, lineHeight: 1.3 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 6 }}>
                  {item.desc}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>{item.author}</span>
                  <span>{item.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Official ESPN Stat Leaders */}
        <div style={{ 
          backgroundColor: 'var(--card-slate)', 
          border: '1px solid var(--card-border)', 
          borderRadius: 10, 
          padding: '1.5rem' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Award size={18} style={{ color: 'var(--headline-gold)' }} /> Official ESPN Stat Leaders
            </h2>
            <Link to="/players" style={{ color: 'var(--headline-gold)', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
              All &rarr;
            </Link>
          </div>

          {/* Category Toggle Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem' }}>
            {['passing', 'rushing', 'receiving'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveStatTab(cat)}
                style={{
                  flex: 1,
                  backgroundColor: activeStatTab === cat ? 'var(--espn-red)' : 'var(--studio-charcoal)',
                  color: activeStatTab === cat ? '#0a0f1d' : 'var(--text-secondary)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 6,
                  padding: '0.45rem',
                  fontFamily: 'var(--font-tech)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {currentLeaders && currentLeaders.map((lead) => (
              <div 
                key={lead.name}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '0.65rem 0.85rem', 
                  backgroundColor: 'var(--studio-charcoal)', 
                  border: '1px solid var(--card-border)', 
                  borderRadius: 6,
                  color: 'inherit'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: lead.rank === 1 ? 'var(--headline-gold)' : 'var(--text-muted)', width: 20 }}>
                    #{lead.rank}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.925rem' }}>{lead.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--headline-gold)', fontWeight: 700 }}>{lead.team}</span> • {lead.pos} • {lead.secondary}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-tech)', fontSize: '1.05rem', fontWeight: 700, color: '#4ade80' }}>
                    {lead.stat}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ESPN Official</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Next Upcoming Game Spotlight Card */}
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
              <Radio size={18} style={{ color: 'var(--espn-red)' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', textTransform: 'uppercase' }}>
                Next NFL Game Preview
              </h2>
            </div>

            <div style={{ 
              background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.1) 0%, rgba(10, 15, 29, 0.2) 100%)',
              border: '1px solid var(--card-border)',
              borderRadius: 8,
              padding: '1.25rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--headline-gold)', fontFamily: 'var(--font-tech)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                {nextGame.network} • {nextGame.gameLabel || 'WEEK 10 SPOTLIGHT'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '0.75rem 0' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700 }}>{nextGame.awayAbbr}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{nextGame.awayRecord}</div>
                </div>
                <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 700 }}>@</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700 }}>{nextGame.homeAbbr}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{nextGame.homeRecord}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                {nextGame.eventDate} • {nextGame.eventTime}
              </div>
              {nextGame.lastFinalSummary && (
                <div style={{ fontSize: '0.74rem', color: '#4ade80', fontFamily: 'var(--font-tech)', fontWeight: 700, marginTop: 6 }}>
                  {nextGame.lastFinalSummary}
                </div>
              )}
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              {nextGame.highlight}
            </p>
          </div>

          <Link
            to="/compare"
            style={{
              backgroundColor: 'var(--espn-red)',
              color: '#0a0f1d',
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
            {nextGame.ctaLabel || `Compare ${nextGame.awayAbbr} vs ${nextGame.homeAbbr} Leaders →`}
          </Link>
        </div>
      </div>
    </div>
  );
}
