import React, { useState } from 'react';
import { Layers, Shield, DollarSign, Plus, Trash2, CheckCircle2, Zap, Calendar, RefreshCw } from 'lucide-react';
import { NFL_PLAYERS_2026, CURRENT_SEASON_INFO } from '../data/nfl2026Data';

const INITIAL_ROSTER_SLOTS = [
  { slot: 'QB', player: NFL_PLAYERS_2026.find(p => p.id === 'jackson') },
  { slot: 'RB1', player: NFL_PLAYERS_2026.find(p => p.id === 'barkley') },
  { slot: 'RB2', player: NFL_PLAYERS_2026.find(p => p.id === 'henry') },
  { slot: 'WR1', player: NFL_PLAYERS_2026.find(p => p.id === 'chase') },
  { slot: 'WR2', player: NFL_PLAYERS_2026.find(p => p.id === 'jefferson') },
  { slot: 'TE', player: NFL_PLAYERS_2026.find(p => p.id === 'bowers') },
  { slot: 'FLEX', player: NFL_PLAYERS_2026.find(p => p.id === 'kelce') },
  { slot: 'DST', player: { name: 'Pittsburgh Steelers', team: 'PIT', pos: 'DST', salary: 3200, fantasyPts: 9.2, rating: 91.2 } }
];

export default function LineupsPage({ user, onOpenAuth }) {
  const [lineup, setLineup] = useState(INITIAL_ROSTER_SLOTS);
  const salaryCap = 60000;

  const currentTotalSalary = lineup.reduce((acc, slot) => acc + (slot.player?.salary || 0), 0);
  const projectedTotal = lineup.reduce((acc, slot) => acc + (slot.player ? (slot.player.fantasyPts / (slot.player.gamesPlayed || 10)) * 1.05 : 0), 0);
  const salaryRemaining = salaryCap - currentTotalSalary;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--headline-gold)', fontFamily: 'var(--font-tech)', fontWeight: 700, marginBottom: 4 }}>
            <Calendar size={14} /> {CURRENT_SEASON_INFO.year} NFL SEASON • WEEK 11 SLATE
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', textTransform: 'uppercase', lineHeight: 1 }}>
            2026 OPTIMAL <span style={{ color: 'var(--headline-gold)' }}>LINEUP BUILDER</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            Construct salary-cap DFS and weekly championship lineups based on current 2026 performance trends.
          </p>
        </div>

        {/* Cap Summary */}
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--card-slate)', border: '1px solid var(--card-border)', padding: '0.75rem 1.25rem', borderRadius: 8 }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>REMAINING 2026 CAP</div>
            <div style={{ fontFamily: 'var(--font-tech)', fontSize: '1.3rem', fontWeight: 700, color: salaryRemaining >= 0 ? '#4ade80' : '#ef4444' }}>
              ${salaryRemaining.toLocaleString()}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--card-border)', paddingLeft: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-tech)' }}>WEEK 11 PROJ FPTS</div>
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
            <strong style={{ color: 'var(--headline-gold)' }}>Save and track your 2026 NFL fantasy lineups!</strong>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Sync custom rosters across all weeks of the 2026 season with Supabase Authentication.
            </p>
          </div>
          <button 
            type="button" 
            onClick={onOpenAuth} 
            className="btn-auth-trigger"
            style={{ padding: '0.45rem 1rem' }}
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Roster table */}
      <div style={{ backgroundColor: 'var(--card-slate)', border: '1px solid var(--card-border)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--studio-charcoal)', borderBottom: '2px solid var(--card-border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-tech)', fontSize: '0.8rem' }}>
              <th style={{ padding: '0.85rem' }}>SLOT</th>
              <th style={{ padding: '0.85rem' }}>PLAYER (2026)</th>
              <th style={{ padding: '0.85rem' }}>TEAM</th>
              <th style={{ padding: '0.85rem' }}>2026 STAT TOTALS</th>
              <th style={{ padding: '0.85rem' }}>WEEK 11 SALARY</th>
              <th style={{ padding: '0.85rem' }}>PROJ FPTS</th>
            </tr>
          </thead>
          <tbody>
            {lineup.map((slot, index) => {
              const p = slot.player;
              const slotProj = p ? ((p.fantasyPts / (p.gamesPlayed || 10)) * 1.05).toFixed(1) : '0.0';

              return (
                <tr key={index} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '0.85rem', fontFamily: 'var(--font-tech)', fontWeight: 700, color: 'var(--espn-red)' }}>
                    {slot.slot}
                  </td>
                  <td style={{ padding: '0.85rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{p?.name}</span>
                      {p?.number && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.number}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem', color: 'var(--text-secondary)' }}>
                    {p?.teamAbbr || p?.team}
                  </td>
                  <td style={{ padding: '0.85rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {p?.pos === 'QB' && `${p.passYds} YDS • ${p.passTd} TD`}
                    {p?.pos === 'RB' && `${p.rushYds} YDS • ${p.rushTd} TD`}
                    {(p?.pos === 'WR' || p?.pos === 'TE') && `${p.recYds} YDS • ${p.recTd} TD`}
                    {p?.pos === 'DST' && 'Top Ranked 2026 Defense'}
                  </td>
                  <td style={{ padding: '0.85rem', fontFamily: 'var(--font-tech)' }}>
                    ${p?.salary ? p.salary.toLocaleString() : '0'}
                  </td>
                  <td style={{ padding: '0.85rem', fontFamily: 'var(--font-tech)', fontWeight: 700, color: 'var(--headline-gold)' }}>
                    {slotProj}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
