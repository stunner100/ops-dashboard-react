import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'customer_service' | 'rider_manager' | 'vendor_manager' | 'business_development_manager' | 'dashboard_support' | 'admin';
  is_approved: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: 'customer_service' | 'rider_manager' | 'vendor_manager' | 'business_development_manager' | 'dashboard_support') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session with timeout for faster initial load
    const initTimeout = setTimeout(() => {
      // If auth check takes too long, show the app anyway
      if (loading) {
        console.warn('Auth initialization timed out, proceeding without session');
        setLoading(false);
      }
    }, 2000); // 2 second timeout - faster UX, will redirect to login if no session

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(initTimeout);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Fetch profile with timeout
        fetchProfileWithTimeout(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      clearTimeout(initTimeout);
      console.error('Error getting session:', err);
      setLoading(false);
    });

    // Listen for auth changes - DO NOT await fetchProfile here as it can block signUp
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Fire and forget - don't block the auth change handler
          fetchProfileWithTimeout(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Wrapper that adds timeout to fetchProfile
  const fetchProfileWithTimeout = (userId: string) => {
    const timeout = setTimeout(() => {
      console.warn('Profile fetch timed out, using fallback');
      // Create fallback profile from cached user data
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setProfile({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || null,
            role: user.user_metadata?.role || 'customer_service',
            is_approved: false,
            created_at: new Date().toISOString(),
          });
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    }, 3000); // 3 second timeout for profile fetch

    fetchProfile(userId).finally(() => {
      clearTimeout(timeout);
    });
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Profile doesn't exist - try to create it from user metadata
        if (error.code === 'PGRST116') {
          console.log('Profile not found, attempting to create from user metadata...');
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const newProfile = {
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || '',
              role: user.user_metadata?.role || 'customer_service',
            };
            const { data: createdProfile, error: insertError } = await supabase
              .from('profiles')
              .insert(newProfile)
              .select()
              .single();

            if (insertError) {
              console.error('Error creating profile:', insertError);
              // Still set a temporary profile from user metadata so app doesn't hang
              setProfile({
                id: user.id,
                email: user.email || '',
                full_name: user.user_metadata?.full_name || null,
                role: user.user_metadata?.role || 'customer_service',
                is_approved: false,
                created_at: new Date().toISOString(),
              });
            } else {
              setProfile(createdProfile);
            }
            return;
          }
        } else {
          console.error('Error fetching profile:', error);
          // If profiles table doesn't exist or other error, use user metadata as fallback
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setProfile({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || null,
              role: user.user_metadata?.role || 'customer_service',
              is_approved: false,
              created_at: new Date().toISOString(),
            });
          }
        }
        return;
      }
      console.log('Profile fetched successfully:', { id: data.id, is_approved: data.is_approved, role: data.role });
      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      // Fallback to user metadata on any error
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setProfile({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || null,
            role: user.user_metadata?.role || 'customer_service',
            is_approved: false,
            created_at: new Date().toISOString(),
          });
        }
      } catch {
        // Ignore fallback errors
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'customer_service' | 'rider_manager' | 'vendor_manager' | 'business_development_manager' | 'dashboard_support') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      });

      if (!error && data.user) {
        // Create profile in background - don't block signup completion
        const newProfile = {
          id: data.user.id,
          email: email,
          full_name: fullName,
          role: role,
        };

        // Fire and forget - profile creation is secondary
        supabase
          .from('profiles')
          .upsert(newProfile, { onConflict: 'id' })
          .then(({ error: profileError }) => {
            if (profileError) {
              console.error('Error creating profile (non-blocking):', profileError);
            }
          });
      }

      return { error: error as Error | null };
    } catch (err) {
      console.error('Unexpected error during signup:', err);
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  const value = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    isApproved: (profile?.is_approved ?? false) || profile?.role === 'admin',
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
