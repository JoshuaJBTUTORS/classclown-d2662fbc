
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export type AppRole = 'owner' | 'admin' | 'tutor' | 'student' | 'parent';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface UserRole {
  role: AppRole;
  user_id: string;
  is_primary?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  userRole: AppRole | null;
  isAdmin: boolean;
  isOwner: boolean;
  isTutor: boolean;
  isStudent: boolean;
  isParent: boolean;
  signUp: (email: string, password: string, metadata?: { 
    first_name?: string, 
    last_name?: string, 
    role?: AppRole
  }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clean up auth state helper
const cleanupAuthState = () => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user profile and role
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Fetch primary role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .maybeSingle();

      if (roleError) throw roleError;

      if (profileData) {
        setProfile(profileData);
      }

      if (roleData) {
        setUserRole(roleData.role as AppRole);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state change event:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Defer data fetching to prevent deadlocks
        if (event === 'SIGNED_IN' && newSession?.user) {
          setTimeout(() => {
            fetchUserData(newSession.user.id);
            toast({
              title: "Signed in successfully",
              description: `Welcome ${newSession.user.email || 'back'}!`,
            });
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setUserRole(null);
          setTimeout(() => {
            toast({
              title: "Signed out",
              description: "You have been signed out.",
            });
          }, 0);
        } else if (event === 'USER_UPDATED' && newSession?.user) {
          setTimeout(() => {
            fetchUserData(newSession.user.id);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      console.log("Checking for existing session:", existingSession?.user?.email || "None");
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        fetchUserData(existingSession.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string, 
    password: string, 
    metadata?: { 
      first_name?: string, 
      last_name?: string, 
      role?: AppRole
    }
  ) => {
    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Try to sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log("Error during pre-signup signout:", err);
        // Continue even if this fails
      }
      
      console.log("Starting signup with metadata:", metadata);
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });
      
      console.log("Signup response:", { error, data });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Account created",
        description: "Please check your email for the confirmation link.",
      });
      
    } catch (error: any) {
      console.error("Registration error details:", error);
      toast({
        title: "Error creating account",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Try to sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
        console.log("Error during pre-signin signout:", err);
      }
      
      console.log("Attempting to sign in:", email);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      console.log("Sign-in successful, navigating to home");
      // Force page reload for a clean state
      navigate('/');
      
    } catch (error: any) {
      console.error("Sign-in error:", error);
      toast({
        title: "Error signing in",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clean up auth state
      cleanupAuthState();
      
      // Attempt global sign out
      await supabase.auth.signOut({ scope: 'global' });
      
      // Reset local state
      setProfile(null);
      setUserRole(null);
      
      // Force page reload for a clean state
      navigate('/auth');
      
    } catch (error: any) {
      console.error("Sign-out error:", error);
      toast({
        title: "Error signing out",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  // Role-based helper functions
  const isAdmin = userRole === 'admin' || userRole === 'owner';
  const isOwner = userRole === 'owner';
  const isTutor = userRole === 'tutor';
  const isStudent = userRole === 'student';
  const isParent = userRole === 'parent';

  const value = {
    user,
    session,
    profile,
    userRole,
    isAdmin,
    isOwner,
    isTutor,
    isStudent,
    isParent,
    signUp,
    signIn,
    signOut,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
