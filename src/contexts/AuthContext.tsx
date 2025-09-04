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
  userRole: AppRole | null;
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
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user profile, role, and parent profile
  const fetchUserData = async (userId: string) => {
    try {
      console.log('🔍 AuthContext: Fetching user data for:', userId);

      // Fetch basic profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      console.log('👤 AuthContext: Profile data:', profileData);

      // Fetch primary role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .maybeSingle();

      if (roleError) throw roleError;
      console.log('🎭 AuthContext: Role data:', roleData);

      // Fetch parent profile if user is a parent or learning hub user
      const { data: parentData, error: parentError } = await supabase
        .from('parents')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('👨‍👩‍👧‍👦 AuthContext: Parent data:', parentData);

      if (profileData) {
        setProfile(profileData);
        console.log('✅ AuthContext: Profile set');
      }

      if (roleData) {
        setUserRole(roleData.role as AppRole);
        console.log('✅ AuthContext: Role set to:', roleData.role);
      } else if (user) {
        // If no role found, create default based on whether they have parent profile
        const defaultRole = parentData ? 'learning_hub_only' : 'student';
        console.log('⚠️ AuthContext: No role found, creating default:', defaultRole);
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
            console.log('✅ AuthContext: Default role created and set');
          }
        } catch (err) {
          console.error("Failed to create default role:", err);
        }
      }

      if (parentData) {
        setParentProfile(parentData);
        console.log('✅ AuthContext: Parent profile set');
      }
    } catch (error) {
      console.error('❌ AuthContext: Error fetching user data:', error);
    }
  };

  useEffect(() => {
    console.log('🚀 AuthContext: Setting up auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("🔄 AuthContext: Auth state change event:", event);
        console.log("📧 AuthContext: User email:", newSession?.user?.email || 'None');
        
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
          console.log('🔄 AuthContext: Clearing user data on sign out');
          setProfile(null);
          setParentProfile(null);
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

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      console.log("🔍 AuthContext: Checking for existing session:", existingSession?.user?.email || "None");
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
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log("Error during pre-signin signout:", err);
      }
      
      console.log("Attempting to sign in:", email);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      console.log("Sign-in successful, navigating to home");
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

  console.log('🎭 AuthContext: Current role state:');
  console.log('- User Role:', userRole);
  console.log('- Is Admin:', isAdmin);
  console.log('- Is Owner:', isOwner);
  console.log('- Is Tutor:', isTutor);
  console.log('- Is Learning Hub Only:', isLearningHubOnly);

  const value = {
    user,
    session,
    profile,
    parentProfile,
    userRole,
    isAdmin,
    isOwner,
    isTutor,
    isStudent,
    isParent,
    isLearningHubOnly,
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
