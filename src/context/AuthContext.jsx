import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { migrateGuestData } from '../utils/guestMigration';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Trigger migration upon successful user authentication
  const handleUserSignIn = useCallback(async (authenticatedUser, userSession) => {
    setUser(authenticatedUser);
    setSession(userSession || null);

    if (authenticatedUser?.id) {
      try {
        await migrateGuestData(authenticatedUser.id);
      } catch (migErr) {
        console.warn('Guest migration trigger notice:', migErr);
      }
    }
  }, []);

  // Initialize and listen to Supabase auth state
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        if (isSupabaseConfigured) {
          // 1. Fetch current active session
          const { data: { session: initialSession }, error } = await supabase.auth.getSession();
          if (!error && initialSession?.user && mounted) {
            setUser(initialSession.user);
            setSession(initialSession);
            // Run migration for initial logged in session
            migrateGuestData(initialSession.user.id);
          }

          // 2. Set up real-time auth listener
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (!mounted) return;

            if (currentSession?.user) {
              setUser(currentSession.user);
              setSession(currentSession);
              if (event === 'SIGNED_IN') {
                await migrateGuestData(currentSession.user.id);
              }
            } else {
              setUser(null);
              setSession(null);
            }
          });

          return () => {
            subscription?.unsubscribe();
          };
        } else {
          // Preview mode fallback: check stored preview user
          const stored = localStorage.getItem('gridiron-preview-user');
          if (stored && mounted) {
            try {
              const previewUser = JSON.parse(stored);
              setUser(previewUser);
              setSession({ user: previewUser });
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        console.warn('AuthContext initialization notice:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    const cleanupPromise = initAuth();

    return () => {
      mounted = false;
      if (typeof cleanupPromise === 'function') {
        cleanupPromise();
      }
    };
  }, []);

  const openAuthModal = useCallback(() => {
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    } finally {
      localStorage.removeItem('gridiron-preview-user');
      setUser(null);
      setSession(null);
    }
  }, []);

  const onAuthSuccess = useCallback((authenticatedUser) => {
    if (!isSupabaseConfigured && authenticatedUser) {
      localStorage.setItem('gridiron-preview-user', JSON.stringify(authenticatedUser));
    }
    handleUserSignIn(authenticatedUser, { user: authenticatedUser });
    closeAuthModal();
  }, [handleUserSignIn, closeAuthModal]);

  const value = {
    user,
    session,
    isGuest: !user,
    loading,
    signOut,
    authModalOpen,
    openAuthModal,
    closeAuthModal,
    onAuthSuccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to consume authentication context state throughout the app
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
