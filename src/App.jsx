import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useInRouterContext } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';

// Domain Pages
import Dashboard from './pages/Dashboard';
import Directory from './pages/Directory';
import Profile from './pages/Profile';
import Compare from './pages/Compare';
import Lineups from './pages/Lineups';

/**
 * AppContent Component
 * Renders the main shell, ESPN Navbar, Route Views, and AuthModal
 * consumes session state directly from useAuth()
 */
function AppContent() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gridiron-theme') || 'dark';
  });

  const { 
    user, 
    signOut, 
    authModalOpen, 
    openAuthModal, 
    closeAuthModal, 
    onAuthSuccess 
  } = useAuth();

  // Sync data-theme attribute with document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gridiron-theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app-container">
      {/* ESPN Theme Navbar Shell */}
      <Navbar
        user={user}
        onOpenAuth={openAuthModal}
        onSignOut={signOut}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Router View */}
      <main className="main-content" role="main">
        <Routes>
          {/* View 1: Home / Dashboard */}
          <Route path="/" element={<Dashboard onOpenAuth={openAuthModal} user={user} />} />
          
          {/* View 2: Player Directory & Search */}
          <Route path="/players" element={<Directory user={user} onOpenAuth={openAuthModal} />} />
          
          {/* View 3: Player Profile Detail View */}
          <Route path="/players/:id" element={<Profile user={user} onOpenAuth={openAuthModal} />} />
          
          {/* View 4: Head-to-Head Comparison View */}
          <Route path="/compare" element={<Compare user={user} onOpenAuth={openAuthModal} />} />
          
          {/* View 5: Roster / Lineup Builder & Exporter */}
          <Route path="/lineups" element={<Lineups user={user} onOpenAuth={openAuthModal} />} />
          
          {/* Universal Fallback to Dashboard */}
          <Route path="*" element={<Dashboard onOpenAuth={openAuthModal} user={user} />} />
        </Routes>
      </main>

      {/* Supabase Authentication Modal with Guest Migration hook */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        onAuthSuccess={onAuthSuccess}
      />
    </div>
  );
}

/**
 * RouterSafeContainer
 * Ensures BrowserRouter is present without throwing duplicate Router errors
 */
function RouterSafeContainer({ children }) {
  try {
    const isInsideRouter = useInRouterContext();
    if (isInsideRouter) {
      return <>{children}</>;
    }
  } catch {
    // If hook called outside router context, proceed to render BrowserRouter
  }
  return <BrowserRouter>{children}</BrowserRouter>;
}

/**
 * Main App Entry Point
 * Configures BrowserRouter, AuthProvider context, and application routing
 */
export default function App() {
  return (
    <RouterSafeContainer>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </RouterSafeContainer>
  );
}
