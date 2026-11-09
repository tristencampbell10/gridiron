import React, { useState } from 'react';
import { ArrowLeftRight, Check, Award, Zap } from 'lucide-react';

const CANDIDATES = [
  { id: 'mahomes', name: 'Patrick Mahomes', team: 'KC', pos: 'QB', passYds: 2840, td: 22, int: 5, qbr: 84.6, completion: '68.4%', sacks: 16 },
  { id: 'jackson', name: 'Lamar Jackson', team: 'BAL', pos: 'QB', passYds: 2680, td: 24, int: 2, qbr: 88.2, completion: '69.1%', sacks: 18 },
  { id: 'allen', name: 'Josh Allen', team: 'BUF', pos: 'QB', passYds: 2540, td: 19, int: 5, qbr: 81.3, completion: '67.0%', sacks: 14 }
];

export default function ComparePage() {
  const [playerAId, setPlayerAId] = useState('mahomes');
  const [playerBId, setPlayerBId] = useState('jackson');

  const pA = CANDIDATES.find(c => c.id === playerAId) || CANDIDATES[0];
  const pB = CANDIDATES.find(c => c.id === playerBId) || CANDIDATES[1];

  const compareMetrics = [
    { label: 'Passing Yards', valA: pA.passYds, valB: pB.passYds, higherWins: true },
    { label: 'Touchdowns (Passing/Total)', valA: pA.td, valB: pB.td, higherWins: true },
    { label: 'Interceptions (Fewer is better)', valA: pA.int, valB: pB.int, higherWins: false },
    { label: 'Total QBR (ESPN)', valA: pA.qbr, valB: pB.qbr, higherWins: true },
    { label: 'Completion %', valA: pA.completion, valB: pB.completion, higherWins: true },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', textTransform: 'uppercase', lineHeight: 1 }}>
          HEAD-TO-HEAD <span style={{ color: 'var(--espn-red)' }}>PLAYER COMPARISON</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: 4 }}>
          Evaluate key performance indicators side by side with ESPN studio analytics.
        </p>
      </div>

      {/* Selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'var(--card-slate)', padding: '1.25rem', borderRadius: 8, border: '1px solid var(--card-border)' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-tech)', color: 'var(--text-secondary)', marginBottom: 6 }}>
            PLAYER A
          </label>
          <select 
            className="form-input"
            value={playerAId} 
            onChange={(e) => setPlayerAId(e.target.value)}
          >
            {CANDIDATES.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.team} - {c.pos})</option>
            ))}
          </select>
        </div>

        <div style={{ 
          width: 44, 
          height: 44, 
          borderRadius: '50%', 
          backgroundColor: 'var(--espn-red)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 0 12px var(--espn-red-glow)'
        }}>
          <ArrowLeftRight size={20} />
        </div>

        <div style={{ backgroundColor: 'var(--card-slate)', padding: '1.25rem', borderRadius: 8, border: '1px solid var(--card-border)' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-tech)', color: 'var(--text-secondary)', marginBottom: 6 }}>
            PLAYER B
          </label>
          <select 
            className="form-input"
            value={playerBId} 
            onChange={(e) => setPlayerBId(e.target.value)}
          >
            {CANDIDATES.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.team} - {c.pos})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Table */}
      <div style={{ backgroundColor: 'var(--card-slate)', border: '1px solid var(--card-border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 1fr', backgroundColor: 'var(--studio-charcoal)', borderBottom: '2px solid var(--card-border)', padding: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{pA.name} <span style={{ color: 'var(--headline-gold)', fontSize: '0.85rem' }}>({pA.team})</span></div>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-tech)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>METRIC</div>
          <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem' }}>{pB.name} <span style={{ color: 'var(--headline-gold)', fontSize: '0.85rem' }}>({pB.team})</span></div>
        </div>

        {compareMetrics.map((m, idx) => (
          <div 
            key={idx}
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 140px 1fr', 
              alignItems: 'center',
              padding: '1rem',
              borderBottom: '1px solid var(--card-border)',
              backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'
            }}
          >
            <div style={{ fontFamily: 'var(--font-tech)', fontSize: '1.2rem', fontWeight: 700 }}>
              {m.valA}
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {m.label}
            </div>

            <div style={{ textAlign: 'right', fontFamily: 'var(--font-tech)', fontSize: '1.2rem', fontWeight: 700 }}>
              {m.valB}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
