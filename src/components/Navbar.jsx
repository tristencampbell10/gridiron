import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  Flame, 
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
  Calendar
} from 'lucide-react';
import espnData from '../data/espnMasterData.json';

export default function Navbar({ user, onOpenAuth, onSignOut, theme, onToggleTheme }) {
  const location = useLocation();
  const [selectedTickerGame, setSelectedTickerGame] = useState(null);
  const [tickerGames, setTickerGames] = useState(espnData.tickerGames || []);

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

              <span className="ticker-matchup font-bold">
                <span>
                  {game.away} {game.awayScore !== '-' ? game.awayScore : ''}
                </span>
                <span className="mx-1 text-zinc-500">@</span>
                <span>
                  {game.home} {game.homeScore !== '-' ? game.homeScore : ''}
                </span>
              </span>

              <span className="text-zinc-400 text-xs pl-1 border-l border-zinc-700">
                {game.clock || game.detail}
              </span>

              <span className="text-zinc-500 text-xs hidden sm:inline">
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
            <div className="brand-icon-wrap" aria-hidden="true">
              <Flame size={22} className="text-white fill-white" />
            </div>
            <div className="brand-name">
              GRIDIRON<span className="hub">HUB</span>
              <span className="live-indicator">ESPN LIVE</span>
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
