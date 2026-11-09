import React, { useState } from 'react';
import { Layers, Shield, DollarSign, Plus, Trash2, CheckCircle2, Zap } from 'lucide-react';

const ROSTER_SLOTS = [
  { slot: 'QB', name: 'Patrick Mahomes', team: 'KC', salary: 8200, proj: 22.4 },
  { slot: 'RB1', name: 'Saquon Barkley', team: 'PHI', salary: 7800, proj: 19.8 },
  { slot: 'RB2', name: 'Derrick Henry', team: 'BAL', salary: 7600, proj: 18.2 },
  { slot: 'WR1', name: 'Justin Jefferson', team: 'MIN', salary: 8400, proj: 20.6 },
  { slot: 'WR2', name: 'Ja\'Marr Chase', team: 'CIN', salary: 8000, proj: 19.4 },
  { slot: 'TE', name: 'Travis Kelce', team: 'KC', salary: 5800, proj: 14.1 },
  { slot: 'FLEX', name: 'Zay Flowers', team: 'BAL', salary: 5400, proj: 13.5 },
  { slot: 'DST', name: 'Pittsburgh Steelers', team: 'PIT', salary: 3200, proj: 8.5 }
];

export default function LineupsPage({ user, onOpenAuth }) {
  const [lineup, setLineup] = useState(ROSTER_SLOTS);
  const salaryCap = 50000;
  const currentTotalSalary = lineup.reduce((acc, p) => acc + (p?.salary || 0), 0);
  const projectedTotal = lineup.reduce((acc, p) => acc + (p?.proj || 0), 0);
  const salaryRemaining = salaryCap - currentTotalSalary;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', textTransform: 'uppercase', lineHeight: 1 }}>
            OPTIMAL <span style={{ color: 'var(--headline-gold)' }}>LINEUP BUILDER</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            Construct salary-cap rosters for DFS and season-long fantasy championships.
          </p>
        </div>

        {/* Cap Summary */}
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--card-slate)', border: '1px solid var(--card-border)', padding: '0.75rem 1.25rem', borderRadius: 8 }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>REMAINING CAP</div>
            <div style={{ fontFamily: 'var(--font-tech)', fontSize: '1.3rem', fontWeight: 700, color: salaryRemaining >= 0 ? '#4ade80' : '#ef4444' }}>
              ${salaryRemaining.toLocaleString()}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--card-border)', paddingLeft: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>PROJECTED FPTS</div>
            <div style={{ fontFamily: 'var(--font-tech)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--headline-gold)' }}>
              {projectedTotal.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {!user && (
        <div style={{ 
          background: 'rgba(255, 204, 0, 0.08)', 
          border: '1px solid rgba(255, 204, 0, 0.25)', 
          borderRadius: 8, 
          padding: '1rem 1.25rem', 
          marginBottom: '1.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <strong style={{ color: 'var(--headline-gold)' }}>Sign in to save multiple custom lineups!</strong>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Synchronize your player pool and simulated rosters across all devices.</p>
          </div>
          <button 
            type="button" 
            onClick={onOpenAuth} 
            className="btn-auth-trigger"
            style={{ padding: '0.45rem 1rem' }}
          >
            Sign In / Sign Up
          </button>
        </div>
      )}

      {/* Roster table */}
      <div style={{ backgroundColor: 'var(--card-slate)', border: '1px solid var(--card-border)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--studio-charcoal)', borderBottom: '2px solid var(--card-border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-tech)', fontSize: '0.8rem' }}>
              <th style={{ padding: '0.85rem' }}>POS</th>
              <th style={{ padding: '0.85rem' }}>PLAYER</th>
              <th style={{ padding: '0.85rem' }}>TEAM</th>
              <th style={{ padding: '0.85rem' }}>SALARY</th>
              <th style={{ padding: '0.85rem' }}>PROJ FPTS</th>
            </tr>
          </thead>
          <tbody>
            {lineup.map((slot, index) => (
              <tr key={index} style={{ borderBottom: '1px solid var(--card-border)' }}>
                <td style={{ padding: '0.85rem', fontFamily: 'var(--font-tech)', fontWeight: 700, color: 'var(--espn-red)' }}>
                  {slot.slot}
                </td>
                <td style={{ padding: '0.85rem', fontWeight: 600 }}>
                  {slot.name}
                </td>
                <td style={{ padding: '0.85rem', color: 'var(--text-secondary)' }}>
                  {slot.team}
                </td>
                <td style={{ padding: '0.85rem', fontFamily: 'var(--font-tech)' }}>
                  ${slot.salary.toLocaleString()}
                </td>
                <td style={{ padding: '0.85rem', fontFamily: 'var(--font-tech)', fontWeight: 700, color: 'var(--headline-gold)' }}>
                  {slot.proj}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
