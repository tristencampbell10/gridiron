import React, { useState } from 'react';
import { ArrowLeftRight, Check, Award, Zap, Calendar } from 'lucide-react';
import { NFL_PLAYERS_2026, CURRENT_SEASON_INFO } from '../data/nfl2026Data';

export default function ComparePage() {
  const [playerAId, setPlayerAId] = useState('jackson');
  const [playerBId, setPlayerBId] = useState('allen');

  const pA = NFL_PLAYERS_2026.find(c => c.id === playerAId) || NFL_PLAYERS_2026[1];
  const pB = NFL_PLAYERS_2026.find(c => c.id === playerBId) || NFL_PLAYERS_2026[2];

  // Dynamic metrics depending on player positions
  const compareMetrics = [
    { label: '2026 Games Played', valA: pA.gamesPlayed, valB: pB.gamesPlayed },
    { label: '2026 Total Fantasy Points', valA: `${pA.fantasyPts} FPTS`, valB: `${pB.fantasyPts} FPTS`, numA: pA.fantasyPts, numB: pB.fantasyPts },
    { label: 'ESPN Rating / Grade', valA: pA.rating, valB: pB.rating, numA: pA.rating, numB: pB.rating },
  ];

  if (pA.pos === 'QB' && pB.pos === 'QB') {
    compareMetrics.push(
      { label: 'Passing Yards (2026)', valA: pA.passYds, valB: pB.passYds, numA: pA.passYds, numB: pB.passYds },
      { label: 'Passing Touchdowns', valA: pA.passTd, valB: pB.passTd, numA: pA.passTd, numB: pB.passTd },
      { label: 'Interceptions (Fewer is better)', valA: pA.int, valB: pB.int, numA: -pA.int, numB: -pB.int },
      { label: 'Completion %', valA: `${pA.completionPct}%`, valB: `${pB.completionPct}%`, numA: pA.completionPct, numB: pB.completionPct },
      { label: 'Rushing Yards (QB)', valA: pA.rushYds, valB: pB.rushYds, numA: pA.rushYds, numB: pB.rushYds },
      { label: 'Total Touchdowns (Pass + Rush)', valA: pA.passTd + pA.rushTd, valB: pB.passTd + pB.rushTd, numA: pA.passTd + pA.rushTd, numB: pB.passTd + pB.rushTd },
      { label: 'Total QBR', valA: pA.qbr, valB: pB.qbr, numA: pA.qbr, numB: pB.qbr }
    );
  } else if (pA.pos === 'RB' && pB.pos === 'RB') {
    compareMetrics.push(
      { label: 'Rushing Yards (2026)', valA: pA.rushYds, valB: pB.rushYds, numA: pA.rushYds, numB: pB.rushYds },
      { label: 'Rushing Touchdowns', valA: pA.rushTd, valB: pB.rushTd, numA: pA.rushTd, numB: pB.rushTd },
      { label: 'Yards Per Carry', valA: pA.yardsPerCarry, valB: pB.yardsPerCarry, numA: pA.yardsPerCarry, numB: pB.yardsPerCarry },
      { label: 'Receptions', valA: pA.rec, valB: pB.rec, numA: pA.rec, numB: pB.rec },
      { label: 'Scrimmage Touchdowns', valA: pA.rushTd + (pA.recTd || 0), valB: pB.rushTd + (pB.recTd || 0), numA: pA.rushTd + (pA.recTd || 0), numB: pB.rushTd + (pB.recTd || 0) }
    );
  } else if ((pA.pos === 'WR' || pA.pos === 'TE') && (pB.pos === 'WR' || pB.pos === 'TE')) {
    compareMetrics.push(
      { label: 'Receptions (2026)', valA: pA.rec, valB: pB.rec, numA: pA.rec, numB: pB.rec },
      { label: 'Receiving Yards', valA: pA.recYds, valB: pB.recYds, numA: pA.recYds, numB: pB.recYds },
      { label: 'Receiving Touchdowns', valA: pA.recTd, valB: pB.recTd, numA: pA.recTd, numB: pB.recTd },
      { label: 'Target Count', valA: pA.targets, valB: pB.targets, numA: pA.targets, numB: pB.targets },
      { label: 'Yards Per Reception', valA: pA.yardsPerCatch, valB: pB.yardsPerCatch, numA: pA.yardsPerCatch, numB: pB.yardsPerCatch }
    );
  } else {
    // Cross-position comparison
    compareMetrics.push(
      { label: 'Total Touchdowns', valA: (pA.passTd || 0) + (pA.rushTd || 0) + (pA.recTd || 0), valB: (pB.passTd || 0) + (pB.rushTd || 0) + (pB.recTd || 0) },
      { label: 'DFS Salary (Week 11)', valA: `$${pA.salary.toLocaleString()}`, valB: `$${pB.salary.toLocaleString()}` }
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255, 204, 0, 0.1)', color: 'var(--headline-gold)', border: '1px solid rgba(255, 204, 0, 0.3)', padding: '2px 10px', borderRadius: 4, fontFamily: 'var(--font-tech)', fontSize: '0.8rem', fontWeight: 700, marginBottom: 8 }}>
          <Calendar size={13} /> {CURRENT_SEASON_INFO.year} NFL SEASON • {CURRENT_SEASON_INFO.currentWeek} ANALYSIS
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', textTransform: 'uppercase', lineHeight: 1 }}>
          HEAD-TO-HEAD <span style={{ color: 'var(--espn-red)' }}>2026 METRIC COMPARISON</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: 4 }}>
          Evaluate current NFL season production, efficiency metrics, and fantasy outputs.
        </p>
      </div>

      {/* Selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'var(--card-slate)', padding: '1.25rem', borderRadius: 8, border: '1px solid var(--card-border)' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-tech)', color: 'var(--text-secondary)', marginBottom: 6 }}>
            PLAYER A (2026)
          </label>
          <select 
            className="form-input"
            value={playerAId} 
            onChange={(e) => setPlayerAId(e.target.value)}
          >
            {NFL_PLAYERS_2026.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.teamAbbr} - {c.pos})</option>
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
            PLAYER B (2026)
          </label>
          <select 
            className="form-input"
            value={playerBId} 
            onChange={(e) => setPlayerBId(e.target.value)}
          >
            {NFL_PLAYERS_2026.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.teamAbbr} - {c.pos})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Table */}
      <div style={{ backgroundColor: 'var(--card-slate)', border: '1px solid var(--card-border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 1fr', backgroundColor: 'var(--studio-charcoal)', borderBottom: '2px solid var(--card-border)', padding: '1.25rem 1rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{pA.name}</div>
            <div style={{ color: 'var(--headline-gold)', fontSize: '0.85rem' }}>{pA.team} ({pA.pos})</div>
          </div>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-tech)', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            2026 METRICS
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{pB.name}</div>
            <div style={{ color: 'var(--headline-gold)', fontSize: '0.85rem' }}>{pB.team} ({pB.pos})</div>
          </div>
        </div>

        {compareMetrics.map((m, idx) => {
          const aIsWinner = typeof m.numA === 'number' && typeof m.numB === 'number' && m.numA > m.numB;
          const bIsWinner = typeof m.numA === 'number' && typeof m.numB === 'number' && m.numB > m.numA;

          return (
            <div 
              key={idx}
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 180px 1fr', 
                alignItems: 'center',
                padding: '1rem',
                borderBottom: '1px solid var(--card-border)',
                backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div style={{ 
                fontFamily: 'var(--font-tech)', 
                fontSize: '1.2rem', 
                fontWeight: 700,
                color: aIsWinner ? '#4ade80' : 'var(--text-primary)'
              }}>
                {m.valA} {aIsWinner && <span style={{ fontSize: '0.75rem', color: '#4ade80', marginLeft: 4 }}>★</span>}
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                {m.label}
              </div>

              <div style={{ 
                textAlign: 'right', 
                fontFamily: 'var(--font-tech)', 
                fontSize: '1.2rem', 
                fontWeight: 700,
                color: bIsWinner ? '#4ade80' : 'var(--text-primary)'
              }}>
                {bIsWinner && <span style={{ fontSize: '0.75rem', color: '#4ade80', marginRight: 4 }}>★</span>} {m.valB}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
