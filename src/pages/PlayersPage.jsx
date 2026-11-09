import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, ChevronRight, Star } from 'lucide-react';

const PLAYERS_DATA = [
  { id: 'mahomes', name: 'Patrick Mahomes', team: 'KC', pos: 'QB', passYds: 2840, passTd: 22, int: 5, rating: 104.2, fpts: 242.8 },
  { id: 'jackson', name: 'Lamar Jackson', team: 'BAL', pos: 'QB', passYds: 2680, passTd: 24, int: 2, rating: 118.5, fpts: 278.4 },
  { id: 'allen', name: 'Josh Allen', team: 'BUF', pos: 'QB', passYds: 2540, passTd: 19, int: 5, rating: 101.4, fpts: 255.6 },
  { id: 'barkley', name: 'Saquon Barkley', team: 'PHI', pos: 'RB', rushYds: 1137, rushTd: 10, rec: 26, rating: 96.8, fpts: 220.5 },
  { id: 'henry', name: 'Derrick Henry', team: 'BAL', pos: 'RB', rushYds: 1185, rushTd: 13, rec: 10, rating: 98.1, fpts: 235.2 },
  { id: 'jefferson', name: 'Justin Jefferson', team: 'MIN', pos: 'WR', recYds: 1012, recTd: 7, rec: 65, rating: 97.4, fpts: 215.8 },
  { id: 'chase', name: 'Ja\'Marr Chase', team: 'CIN', pos: 'WR', recYds: 1058, recTd: 10, rec: 71, rating: 99.2, fpts: 245.8 },
  { id: 'kelce', name: 'Travis Kelce', team: 'KC', pos: 'TE', recYds: 620, recTd: 4, rec: 60, rating: 89.4, fpts: 148.0 }
];

export default function PlayersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPos, setSelectedPos] = useState('ALL');

  const filteredPlayers = PLAYERS_DATA.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.team.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPos = selectedPos === 'ALL' || p.pos === selectedPos;
    return matchesSearch && matchesPos;
  });

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', textTransform: 'uppercase', lineHeight: 1 }}>
            NFL <span style={{ color: 'var(--espn-red)' }}>PLAYERS ROSTER</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            Explore verified player metrics, fantasy production, and team statistics.
          </p>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['ALL', 'QB', 'RB', 'WR', 'TE'].map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setSelectedPos(pos)}
              style={{
                backgroundColor: selectedPos === pos ? 'var(--espn-red)' : 'var(--card-slate)',
                color: selectedPos === pos ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--card-border)',
                borderRadius: 6,
                padding: '0.45rem 0.9rem',
                fontFamily: 'var(--font-tech)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search by player name or team (e.g. Mahomes, KC, Barkley)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          style={{ paddingLeft: 42 }}
        />
      </div>

      {/* Players Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {filteredPlayers.map((player) => (
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
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ 
                  backgroundColor: 'var(--studio-charcoal)', 
                  border: '1px solid var(--card-border)', 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  fontFamily: 'var(--font-tech)', 
                  fontWeight: 700, 
                  fontSize: '0.8rem',
                  color: 'var(--headline-gold)'
                }}>
                  {player.team} • {player.pos}
                </span>

                <span style={{ fontFamily: 'var(--font-tech)', fontSize: '0.85rem', color: '#4ade80', fontWeight: 700 }}>
                  {player.fpts} FPTS
                </span>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {player.name}
              </h3>

              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', margin: '0.75rem 0' }}>
                {player.pos === 'QB' && (
                  <>
                    <div>Pass YDS: <strong style={{ color: 'var(--text-primary)' }}>{player.passYds}</strong></div>
                    <div>TD: <strong style={{ color: 'var(--text-primary)' }}>{player.passTd}</strong></div>
                  </>
                )}
                {player.pos === 'RB' && (
                  <>
                    <div>Rush YDS: <strong style={{ color: 'var(--text-primary)' }}>{player.rushYds}</strong></div>
                    <div>TD: <strong style={{ color: 'var(--text-primary)' }}>{player.rushTd}</strong></div>
                  </>
                )}
                {(player.pos === 'WR' || player.pos === 'TE') && (
                  <>
                    <div>Rec YDS: <strong style={{ color: 'var(--text-primary)' }}>{player.recYds}</strong></div>
                    <div>TD: <strong style={{ color: 'var(--text-primary)' }}>{player.recTd}</strong></div>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--card-border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ESPN Grade: {player.rating}</span>
              <span style={{ color: 'var(--espn-red)', display: 'flex', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                Profile <ChevronRight size={14} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
