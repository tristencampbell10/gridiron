import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { X, Lock, Mail, ShieldAlert, CheckCircle2, UserPlus, LogIn, ArrowRight } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (!isSupabaseConfigured) {
        // Mock login for preview mode when Supabase is not configured
        const mockUser = {
          id: 'preview-user-1',
          email: email,
          created_at: new Date().toISOString(),
          user_metadata: { name: email.split('@')[0] }
        };
        setTimeout(() => {
          setLoading(false);
          setSuccessMsg('Signed in successfully (Studio Preview Mode)!');
          if (onAuthSuccess) onAuthSuccess(mockUser);
          setTimeout(() => {
            onClose();
            resetForm();
          }, 800);
        }, 500);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Signed in successfully!');
        if (onAuthSuccess) onAuthSuccess(data.user);
        setTimeout(() => {
          onClose();
          resetForm();
        }, 800);
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred during sign in.');
    } finally {
      if (isSupabaseConfigured) {
        setLoading(false);
      }
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (!isSupabaseConfigured) {
        // Mock sign up for preview mode
        const mockUser = {
          id: 'preview-user-new',
          email: email,
          created_at: new Date().toISOString(),
          user_metadata: { name: email.split('@')[0] }
        };
        setTimeout(() => {
          setLoading(false);
          setSuccessMsg('Account created! Welcome to Gridiron Hub.');
          if (onAuthSuccess) onAuthSuccess(mockUser);
          setTimeout(() => {
            onClose();
            resetForm();
          }, 900);
        }, 500);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        if (data?.session) {
          setSuccessMsg('Account created and signed in!');
          if (onAuthSuccess) onAuthSuccess(data.user);
        } else {
          setSuccessMsg('Sign up successful! Please check your email inbox to confirm your account.');
        }
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1200);
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred during registration.');
    } finally {
      if (isSupabaseConfigured) {
        setLoading(false);
      }
    }
  };

  const handleQuickDemoLogin = () => {
    const demoUser = {
      id: 'demo-gridiron-user',
      email: 'analyst@gridironhub.com',
      user_metadata: { name: 'Lead Analyst' }
    };
    setSuccessMsg('Logged in as Gridiron Analyst Demo!');
    if (onAuthSuccess) onAuthSuccess(demoUser);
    setTimeout(() => {
      onClose();
      resetForm();
    }, 600);
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-card">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Lock size={18} className="text-amber-400" />
            <h2 id="modal-title" className="modal-title">
              GRIDIRON <span className="text-red-600">AUTH</span>
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab ${activeTab === 'signin' ? 'active' : ''}`}
            onClick={() => handleTabChange('signin')}
          >
            <LogIn size={15} className="inline mr-1.5" />
            Sign In
          </button>
          <button
            type="button"
            className={`modal-tab ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => handleTabChange('signup')}
          >
            <UserPlus size={15} className="inline mr-1.5" />
            Create Account
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {errorMsg && (
            <div className="auth-alert-box auth-alert-error" role="alert">
              <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="auth-alert-box auth-alert-success" role="status">
              <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={activeTab === 'signin' ? handleSignIn : handleSignUp}>
            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="analyst@gridironhub.com"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="auth-password">
                Password {activeTab === 'signup' && <span className="text-zinc-500 font-normal">(min. 6 characters)</span>}
              </label>
              <input
                id="auth-password"
                type="password"
                required
                placeholder="••••••••"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={activeTab === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-submit"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : activeTab === 'signin' ? (
                <>
                  <span>Sign In to Hub</span>
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  <span>Create Gridiron Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Option for testing */}
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="btn-guest-mode"
          >
            ⚡ Quick Studio Demo Login (Instant Access)
          </button>

          <p className="auth-note">
            Secured by Supabase Authentication. Access personalized lineup builds, player tracking, and custom fantasy projections.
          </p>
        </div>
      </div>
    </div>
  );
}
