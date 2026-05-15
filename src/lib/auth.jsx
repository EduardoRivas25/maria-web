// ═══════════════════════════════════════════════════════════════
// M.A.R.I.A. — Auth Context & Provider
// Centralized auth state, OAuth, session persistence, route guards
// Adapted for Insforge SDK API
// ═══════════════════════════════════════════════════════════════

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, Navigate, useLocation, Outlet } from 'react-router-dom';
import { insforge } from './insforge';

// ── Context ──────────────────────────────────────────────────

const AuthContext = createContext(null);

// ── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch extended profile from profiles table, create if missing
  const fetchProfile = useCallback(async (user) => {
    try {
      const { data, error } = await insforge.database
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn('[Auth] Profile missing, creating fallback profile...');
        const { data: newProfile, error: insertError } = await insforge.database
          .from('profiles')
          .insert({ 
            id: user.id, 
            email: user.email,
            full_name: user.email?.split('@')[0] || 'Usuario' 
          })
          .select()
          .single();
          
        if (insertError) {
          console.error('[Auth] Failed to create fallback profile:', insertError);
          return null;
        }
        return newProfile;
      }
      return data;
    } catch (err) {
      console.warn('[Auth] Profile fetch failed:', err);
      return null;
    }
  }, []);

  // Initialize: check existing session via getCurrentUser
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data, error } = await insforge.auth.getCurrentUser();

        if (!error && data?.user) {
          setUser(data.user);
          const profileData = await fetchProfile(data.user);
          setProfile(profileData);
        }
      } catch (err) {
        console.error('[Auth] Init failed:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [fetchProfile]);

  // ── Auth Methods ─────────────────────────────────────────

  /**
   * Sign up with email and password.
   * Insforge signUp expects { email, password, ...metadata }
   */
  const signUp = async ({ email, password, fullName }) => {
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      fullName, // Insforge accepts metadata fields directly
    });

    if (error) throw error;

    // If signUp auto-signs-in (returns user), update state
    if (data?.user) {
      setUser(data.user);
      // Profile created automatically by DB trigger or fallback
      const profileData = await fetchProfile(data.user);
      setProfile(profileData);
    }

    return data;
  };

  /**
   * Sign in with email and password.
   */
  const signIn = async ({ email, password }) => {
    const { data, error } = await insforge.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data?.user) {
      setUser(data.user);
      const profileData = await fetchProfile(data.user);
      setProfile(profileData);
    }

    return data;
  };

  /**
   * Sign in with Google OAuth.
   * Insforge uses { provider, redirectTo } format.
   */
  const signInWithGoogle = async () => {
    const { data, error } = await insforge.auth.signInWithOAuth({
      provider: 'google',
      redirectTo: `${window.location.origin}${window.location.pathname}#/auth/callback`,
    });

    if (error) throw error;
    return data;
  };

  /**
   * Sign in with GitHub OAuth.
   */
  const signInWithGitHub = async () => {
    const { data, error } = await insforge.auth.signInWithOAuth({
      provider: 'github',
      redirectTo: `${window.location.origin}${window.location.pathname}#/auth/callback`,
    });

    if (error) throw error;
    return data;
  };

  /**
   * Sign out the current user.
   */
  const signOut = async () => {
    const { error } = await insforge.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  };

  /**
   * Refresh profile data from the database.
   */
  const refreshProfile = async () => {
    if (user?.id) {
      const profileData = await fetchProfile(user);
      setProfile(profileData);
    }
  };

  const value = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithGitHub,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ── Route Guard ──────────────────────────────────────────────

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#f99e02] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Cargando M.A.R.I.A...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}

// ── OAuth Callback Component ─────────────────────────────────
// Insforge SDK handles callback detection automatically via
// detectAuthCallback() which processes the `insforge_code` param.
// This component just waits for that to complete and redirects.

export function AuthCallback() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Give Insforge SDK time to process the OAuth callback
        // The SDK's detectAuthCallback() runs automatically on init
        // and processes the insforge_code URL parameter
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Re-check user after callback processing
        const { data } = await insforge.auth.getCurrentUser();
        if (data?.user) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch {
        navigate('/', { replace: true });
      } finally {
        setChecking(false);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#f99e02] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Autenticando...</p>
      </div>
    </div>
  );
}

export default AuthContext;
