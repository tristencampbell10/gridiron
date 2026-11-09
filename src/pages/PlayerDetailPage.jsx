import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Award, Activity, Zap, TrendingUp, Shield, BarChart3 } from 'lucide-react';

const PLAYERS_DATABASE = {
  mahomes: {
    name: 'Patrick Mahomes',
    number: '#15',
    team: 'Kansas City Chiefs',
    pos: 'Quarterback',
    height: '6-2',
    weight: '225 lbs',
    experience: '8th Season',
    college: 'Texas Tech',
    qbr: '84.6',
    passYds: 2840,
    passTd: 22,
    rating: 104.2,
    int: 5,
    cmpPct: '68.4%',
    ypa: '7.8',
    nextGame: 'vs BUF (Sun 4:25 PM ET)',
    bio: 'Two-time NFL MVP and three-time Super Bowl Champion renowned for elite arm talent, pre-snap processing, and improvisational playmaking outside the pocket.',
    recentGames: [
      { opp: '@ DEN', result: 'W 16-14', passYds: 266, td: 1, int: 0, fpts: 18.6 },
      { opp: 'vs TB', result: 'W 30-24 (OT)', passYds: 291, td: 3, int: 0, fpts: 27.6 },
      { opp: '@ LV', result: 'W 27-20', passYds: 262, td: 2, int: 1, fpts: 21.4 }
    ]
  },
  barkley: {
    name: 'Saquon Barkley',
    number: '#26',
    team: 'Philadelphia Eagles',
    pos: 'Running Back',
    height: '6-0',
    weight: '232 lbs',
    experience: '7th Season',
    college: 'Penn State',
    qbr: '96.2',
    rushYds: 1137,
    rushTd: 10,
    rec: 26,
    rating: 96.8,
    ypc: '5.8',
    nextGame: 'vs WAS (Thu 8:15 PM ET)',
    bio: 'Dynamic lead bellcow back revitalizing the Eagles offensive ground attack with explosive jump-cuts and tackle-breaking balance.',
    recentGames: [
      { opp: '@ DAL', result: 'W 34-6', rushYds: 66, td: 2, recYds: 12, fpts: 21.8 },
      { opp: 'vs JAX', result: 'W 28-23', rushYds: 159, td: 1, recYds: 40, fpts: 31.9 },
      { opp: '@ CIN', result: 'W 37-17', rushYds: 108, td: 1, recYds: 3, fpts: 18.1 }
    ]
  }
};

export default function PlayerDetailPage() {
  const { id } = useParams();
  const player = PLAYERS_DATABASE[id] || PLAYERS_DATABASE['mahomes'];

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
        <ArrowLeft size={16} /> Back to Players Roster
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
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3.25rem)', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 8 }}>
              {player.name}
            </h1>

            <p style={{ color: 'var(--text-secondary)', maxWidth: 640, fontSize: '0.95rem', lineHeight: 1.5 }}>
              {player.bio}
            </p>
          </div>

          <div style={{ background: 'var(--studio-charcoal)', border: '1px solid var(--card-border)', padding: '1.25rem 1.5rem', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-tech)' }}>
              Total Season Rating
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: '#4ade80', lineHeight: 1, margin: '4px 0' }}>
              {player.rating}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--headline-gold)', fontWeight: 700 }}>
              Next: {player.nextGame}
            </div>
          </div>
        </div>

        {/* Bio spec pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <div>Height: <strong style={{ color: 'var(--text-primary)' }}>{player.height}</strong></div>
          <div>Weight: <strong style={{ color: 'var(--text-primary)' }}>{player.weight}</strong></div>
          <div>Exp: <strong style={{ color: 'var(--text-primary)' }}>{player.experience}</strong></div>
          <div>College: <strong style={{ color: 'var(--text-primary)' }}>{player.college}</strong></div>
        </div>
      </div>

      {/* Recent Game Log */}
      <div style={{ backgroundColor: 'var(--card-slate)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={20} style={{ color: 'var(--espn-red)' }} /> Recent Performance Log
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--card-border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-tech)', fontSize: '0.8rem' }}>
                <th style={{ padding: '0.75rem' }}>MATCHUP</th>
                <th style={{ padding: '0.75rem' }}>RESULT</th>
                <th style={{ padding: '0.75rem' }}>YARDS</th>
                <th style={{ padding: '0.75rem' }}>TOUCHDOWNS</th>
                <th style={{ padding: '0.75rem' }}>FAN PTS</th>
              </tr>
            </thead>
            <tbody>
              {player.recentGames.map((g, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{g.opp}</td>
                  <td style={{ padding: '0.75rem', color: '#4ade80' }}>{g.result}</td>
                  <td style={{ padding: '0.75rem' }}>{g.passYds || g.rushYds} YDS</td>
                  <td style={{ padding: '0.75rem' }}>{g.td} TD</td>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--headline-gold)' }}>{g.fpts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
