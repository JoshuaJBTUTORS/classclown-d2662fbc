import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export type AppRole = 'owner' | 'admin' | 'tutor' | 'student' | 'parent' | 'learning_hub_only';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone?: string;
  organization_id?: string;
  region?: string;
  curriculum?: string;
  year_group_id?: string;
  preferred_subjects?: string[];
  onboarding_completed?: boolean;
  onboarding_completed_at?: string;
  has_cleo_hub_access?: boolean;
}

interface ParentProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  parentProfile: ParentProfile | null;
  primaryStudentName?: string;
  userRole: AppRole | null;
  hasCleoHubAccess: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isTutor: boolean;
  isStudent: boolean;
  isParent: boolean;
  isLearningHubOnly: boolean;
  signUp: (email: string, password: string, metadata?: { 
    first_name?: string, 
    last_name?: string, 
    role?: AppRole,
    organization_name?: string,
    subdomain?: string
  }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clean up auth state helper
const cleanupAuthState = () => {
  localStorage.removeItem('supabase.auth.token');
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [primaryStudentName, setPrimaryStudentName] = useState<string | undefined>(undefined);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [hasCleoHubAccess, setHasCleoHubAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user profile, role, and parent profile
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch basic profile with Cleo hub access flag
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, has_cleo_hub_access')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Auto-provision profile if missing
      if (!profileData) {
        const defaultProfile = {
          id: userId,
          first_name: user?.user_metadata?.first_name || null,
          last_name: user?.user_metadata?.last_name || null,
          avatar_url: null,
          onboarding_completed: false,
        };

        try {
          const { data: insertedProfile, error: insertError } = await supabase
            .from('profiles')
            .insert(defaultProfile)
            .select('*')
            .single();

          if (!insertError && insertedProfile) {
            setProfile(insertedProfile);
          } else {
            if (insertError?.code === '42501') {
              console.error('RLS policy prevented profile creation:', insertError);
              toast({
                title: 'Profile Creation Failed',
                description: 'Unable to create your profile. Please try signing in again.',
                variant: 'destructive',
              });
            }
            // Fallback: set local state to avoid indefinite spinner
            setProfile(defaultProfile as any);
          }
        } catch (err) {
          console.error('Failed to auto-provision profile:', err);
          setProfile(defaultProfile as any);
        }
      }

      // Fetch primary role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .maybeSingle();

      if (roleError) throw roleError;

      // Fetch parent profile if user is a parent or learning hub user
      const { data: parentData, error: parentError } = await supabase
        .from('parents')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as unknown as UserProfile);
        setHasCleoHubAccess((profileData as any).has_cleo_hub_access ?? false);
      }

      if (roleData) {
        setUserRole(roleData.role as AppRole);
      } else if (user) {
        // If no role found, create default based on whether they have parent profile
        const defaultRole = parentData ? 'learning_hub_only' : 'student';
        try {
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role: defaultRole,
              is_primary: true
            });
            
          if (!insertError) {
            setUserRole(defaultRole);
          }
        } catch (err) {
          console.error("Failed to create default role:", err);
        }
      }

      if (parentData) {
        setParentProfile(parentData);
        
        // If user is a parent, fetch primary student's name
        if (roleData?.role === 'parent') {
          const { data: studentData } = await supabase
            .from('students')
            .select('first_name')
            .eq('parent_id', parentData.id)
            .eq('status', 'active')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
          
          if (studentData?.first_name) {
            setPrimaryStudentName(studentData.first_name);
          }
        }
      }
    } catch (error) {
      console.error('❌ AuthContext: Error fetching user data:', error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
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
          setParentProfile(null);
          setUserRole(null);
          setHasCleoHubAccess(false);
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

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
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
      role?: AppRole,
      organization_name?: string,
      subdomain?: string
    }
  ) => {
    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log("Error during pre-signup signout:", err);
      }
      
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });
      
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
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log("Error during pre-signin signout:", err);
      }
      
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
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
      cleanupAuthState();
      await supabase.auth.signOut({ scope: 'global' });
      setProfile(null);
      setParentProfile(null);
      setUserRole(null);
      setHasCleoHubAccess(false);
      navigate('/');
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
  const isLearningHubOnly = userRole === 'learning_hub_only';

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserData(user.id);
    }
  };

  const value = {
    user,
    session,
    profile,
    parentProfile,
    primaryStudentName,
    userRole,
    hasCleoHubAccess,
    isAdmin,
    isOwner,
    isTutor,
    isStudent,
    isParent,
    isLearningHubOnly,
    signUp,
    signIn,
    signOut,
    loading,
    refreshProfile
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
