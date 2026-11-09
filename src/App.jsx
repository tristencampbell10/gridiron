import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// Pages
import HomePage from './pages/HomePage';
import PlayersPage from './pages/PlayersPage';
import PlayerDetailPage from './pages/PlayerDetailPage';
import ComparePage from './pages/ComparePage';
import LineupsPage from './pages/LineupsPage';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gridiron-theme') || 'dark';
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Sync theme attribute with document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gridiron-theme', theme);
  }, [theme]);

  // Auth state listener with Supabase
  useEffect(() => {
    if (isSupabaseConfigured) {
      // Fetch initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
        }
      }).catch(err => {
        console.warn('Initial session check note:', err);
      });

      // Listen for changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => {
        subscription?.unsubscribe();
      };
    } else {
      // Check stored preview mock user if available
      const stored = localStorage.getItem('gridiron-preview-user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleOpenAuth = () => {
    setAuthModalOpen(true);
  };

  const handleCloseAuth = () => {
    setAuthModalOpen(false);
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    if (!isSupabaseConfigured && authenticatedUser) {
      localStorage.setItem('gridiron-preview-user', JSON.stringify(authenticatedUser));
    }
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out warning:', err);
      }
    }
    localStorage.removeItem('gridiron-preview-user');
    setUser(null);
  };

  return (
    <div className="app-container">
      {/* ESPN Shell Navbar */}
      <Navbar
        user={user}
        onOpenAuth={handleOpenAuth}
        onSignOut={handleSignOut}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content View */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage onOpenAuth={handleOpenAuth} user={user} />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/:id" element={<PlayerDetailPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/lineups" element={<LineupsPage user={user} onOpenAuth={handleOpenAuth} />} />
          {/* Fallback to Home */}
          <Route path="*" element={<HomePage onOpenAuth={handleOpenAuth} user={user} />} />
        </Routes>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={handleCloseAuth}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
