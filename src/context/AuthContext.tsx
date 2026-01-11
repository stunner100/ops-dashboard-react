import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'customer_service' | 'rider_manager' | 'vendor_manager' | 'business_development_manager' | 'dashboard_support' | 'marketing_brands' | 'admin';
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
  signUp: (email: string, password: string, fullName: string, role: 'customer_service' | 'rider_manager' | 'vendor_manager' | 'business_development_manager' | 'dashboard_support' | 'marketing_brands') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const buildFallbackProfile = useCallback((authUser: User): UserProfile => ({
    id: authUser.id,
    email: authUser.email || '',
    full_name: authUser.user_metadata?.full_name || null,
    role: authUser.user_metadata?.role || 'customer_service',
    is_approved: false,
    created_at: new Date().toISOString(),
  }), []);

  const fetchProfile = useCallback(async (authUser: User): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        // Profile doesn't exist - try to create it from user metadata
        if (error.code === 'PGRST116') {
          console.log('Profile not found, attempting to create from user metadata...');
          const newProfile = {
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || '',
            role: authUser.user_metadata?.role || 'customer_service',
          };
          const { data: createdProfile, error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();

          if (insertError) {
            console.error('Error creating profile:', insertError);
            return buildFallbackProfile(authUser);
          }

          return createdProfile;
        } else {
          console.error('Error fetching profile:', error);
          return buildFallbackProfile(authUser);
        }
        return buildFallbackProfile(authUser);
      }
      console.log('Profile fetched successfully:', { id: data.id, is_approved: data.is_approved, role: data.role });
      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return buildFallbackProfile(authUser);
    }
  }, [buildFallbackProfile]);

  useEffect(() => {
    let isMounted = true;
    let activeUserId: string | null = null;

    const applySession = (currentSession: Session | null) => {
      if (!isMounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
    };

    const loadProfileFor = async (authUser: User) => {
      activeUserId = authUser.id;
      const resolvedProfile = await fetchProfile(authUser);
      if (!isMounted || activeUserId !== authUser.id) return;
      setProfile(resolvedProfile);
    };

    const init = async () => {
      setLoading(true);
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        applySession(initialSession);
        if (initialSession?.user) {
          await loadProfileFor(initialSession.user);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Error getting session:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        applySession(currentSession);
        if (currentSession?.user) {
          setLoading(true);
          await loadProfileFor(currentSession.user);
          if (isMounted) {
            setLoading(false);
          }
        } else if (isMounted) {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'customer_service' | 'rider_manager' | 'vendor_manager' | 'business_development_manager' | 'dashboard_support' | 'marketing_brands') => {
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
