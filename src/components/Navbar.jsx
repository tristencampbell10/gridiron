import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  BarChart3, 
  Layers, 
  User, 
  Sun, 
  Moon, 
  LogOut, 
  Radio, 
  Clock, 
  CheckCircle2, 
  Activity,
  Calendar,
  Trophy
} from 'lucide-react';
import espnData from '../data/espnMasterData.json';
import { fetchLiveEspnData } from '../services/espnService';

export default function Navbar({ user, onOpenAuth, onSignOut, theme, onToggleTheme }) {
  const location = useLocation();
  const [selectedTickerGame, setSelectedTickerGame] = useState(null);
  const [tickerGames, setTickerGames] = useState(espnData.tickerGames || []);

  useEffect(() => {
    let mounted = true;
    fetchLiveEspnData().then((live) => {
      if (mounted && live?.tickerGames?.length > 0) {
        setTickerGames(live.tickerGames);
      }
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const isPlayerDetailActive = location.pathname.startsWith('/players/') && location.pathname !== '/players';

  return (
    <header className="w-full">
      {/* 1. Official ESPN Live Scoreboard Ribbon */}
      <div className="score-ticker-container" role="region" aria-label="Live NFL Score Ticker">
        <div className="ticker-label-badge">
          <Activity size={15} className="animate-spin text-white" />
          <span>ESPN LIVE • WEEK 10</span>
        </div>

        <div className="ticker-scroll-wrapper">
          {tickerGames.map((game) => (
            <button
              key={game.id}
              type="button"
              className="ticker-item"
              onClick={() => setSelectedTickerGame(selectedTickerGame?.id === game.id ? null : game)}
              aria-label={`${game.away} vs ${game.home}, Status: ${game.status}`}
            >
              {game.statusType === 'live' && (
                <span className="badge-live">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse" />
                  LIVE
                </span>
              )}
              {game.statusType === 'final' && (
                <span className="badge-final">FINAL</span>
              )}
              {game.statusType === 'scheduled' && (
                <span className="badge-scheduled">NEXT GAME</span>
              )}

              <span className="ticker-matchup font-bold" style={{ color: 'var(--text-primary)' }}>
                <span>
                  {game.away} {game.awayScore !== '-' ? game.awayScore : ''}
                </span>
                <span className="mx-1" style={{ color: 'var(--text-secondary)' }}>@</span>
                <span>
                  {game.home} {game.homeScore !== '-' ? game.homeScore : ''}
                </span>
              </span>

              <span className="text-xs pl-2" style={{ color: 'var(--text-muted)', borderLeft: '1px solid var(--card-border)' }}>
                {game.clock || game.detail}
              </span>

              <span className="text-xs hidden sm:inline font-semibold" style={{ color: '#38bdf8' }}>
                [{game.network}]
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Ticker detail strip if clicked */}
      {selectedTickerGame && (
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 text-xs flex items-center justify-between text-zinc-300">
          <div className="flex items-center gap-3">
            <span style={{ color: '#38bdf8' }} className="font-bold uppercase tracking-wider">
              {selectedTickerGame.awayName || selectedTickerGame.away} @ {selectedTickerGame.homeName || selectedTickerGame.home}
            </span>
            <span className="text-zinc-400">
              {selectedTickerGame.passLeader || selectedTickerGame.rushLeader || selectedTickerGame.detail}
            </span>
          </div>
          <button 
            onClick={() => setSelectedTickerGame(null)}
            className="text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Top Header Navigation */}
      <nav className="top-navbar" aria-label="Main Navigation">
        <div className="top-navbar-inner">
          {/* Brand */}
          <Link to="/" className="navbar-brand">
            <div className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 48 48" role="presentation">
                <defs>
                  <linearGradient id="brand-shield-gradient" x1="7" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7dd3fc" />
                    <stop offset="1" stopColor="#0284c7" />
                  </linearGradient>
                </defs>
                <path
                  className="brand-shield"
                  d="M24 2.5 43 9.2v13.5c0 11.2-7.3 18.8-19 22.8C12.3 41.5 5 33.9 5 22.7V9.2L24 2.5Z"
                />
                <path className="brand-field-line" d="M12 14h8M11 19h6M10.5 24h4.5M11 29h6M12 34h8" />
                <g className="brand-football" transform="rotate(38 27 24)">
                  <path d="M27 12c5.3 0 9.5 5.4 9.5 12S32.3 36 27 36s-9.5-5.4-9.5-12S21.7 12 27 12Z" />
                  <path className="brand-football-seam" d="M27 14v20M23.5 20h7M23.5 24h7M23.5 28h7" />
                </g>
                <path className="brand-shield-highlight" d="m24 5.5 15.5 5.4v2.8L24 8.4 8.5 13.7v-2.8L24 5.5Z" />
              </svg>
            </div>
            <div className="brand-lockup">
              <div className="brand-name">
                <span>GRIDIRON</span><span className="hub">HUB</span>
              </div>
              <span className="brand-tagline">FIELD INTELLIGENCE</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="nav-links-desktop">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
            >
              <BarChart3 size={16} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/players"
              end
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
            >
              <Users size={16} />
              <span>Players</span>
            </NavLink>

            <NavLink
              to="/players/love"
              className={`nav-link-item ${isPlayerDetailActive ? 'active' : ''}`}
              title="Official ESPN Passing Leader: Jordan Love"
            >
              <UserCheck size={16} />
              <span>#1 Leader Profile</span>
            </NavLink>

            <NavLink
              to="/compare"
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
            >
              <Radio size={16} />
              <span>Compare</span>
            </NavLink>

            <NavLink
              to="/lineups"
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
            >
              <Layers size={16} />
              <span>Lineup Builder</span>
            </NavLink>

            <NavLink
              to="/draft"
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
            >
              <Trophy size={16} />
              <span>Draft Room</span>
            </NavLink>
          </div>

          {/* Right Action Buttons */}
          <div className="nav-actions">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="theme-toggle-btn"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Auth Trigger / User Badge */}
            {user ? (
              <div className="flex items-center gap-2">
                <div 
                  className="user-profile-badge" 
                  title={`Signed in as ${user.email}`}
                >
                  <div className="user-avatar">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="user-email-text">{user.email || 'Member'}</span>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="theme-toggle-btn"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="btn-auth-trigger"
                id="auth-modal-trigger"
              >
                <User size={16} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 3. Fixed Bottom Mobile Navbar (<768px) */}
      <nav className="mobile-bottom-navbar" aria-label="Mobile Navigation">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
        >
          <BarChart3 size={20} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/players"
          end
          className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
        >
          <Users size={20} />
          <span>Players</span>
        </NavLink>

        <NavLink
          to="/players/love"
          className={`mobile-nav-link ${isPlayerDetailActive ? 'active' : ''}`}
        >
          <UserCheck size={20} />
          <span>Leader</span>
        </NavLink>

        <NavLink
          to="/compare"
          className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
        >
          <Radio size={20} />
          <span>Compare</span>
        </NavLink>

        <NavLink
          to="/lineups"
          className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
        >
          <Layers size={20} />
          <span>Lineups</span>
        </NavLink>

        <NavLink
          to="/draft"
          className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
        >
          <Trophy size={20} />
          <span>Draft</span>
        </NavLink>

        {user ? (
          <button
            type="button"
            onClick={onSignOut}
            className="mobile-nav-link border-none bg-transparent"
            aria-label="Sign out"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="mobile-nav-link border-none bg-transparent"
            aria-label="Sign in"
          >
            <User size={20} />
            <span>Sign In</span>
          </button>
        )}
      </nav>
    </header>
  );
}
