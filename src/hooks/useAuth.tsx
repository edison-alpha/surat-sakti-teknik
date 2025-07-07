
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user role
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          setUserRole(userData?.role || null);
        } else {
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data: userData }) => {
            setUserRole(userData?.role || null);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      // First, get user data from our custom users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (userError || !userData) {
        return { error: { message: 'Username atau password salah' } };
      }

      // For simplicity in this demo, we'll use a basic password check
      // In production, you should use proper password hashing
      if (password !== '12345') {
        return { error: { message: 'Username atau password salah' } };
      }

      // Create a session by signing in with email (using username as email for demo)
      const { error } = await supabase.auth.signInWithPassword({
        email: `${username}@demo.com`,
        password: 'demo123456' // Demo password for auth
      });

      if (error) {
        // If user doesn't exist in auth, create them
        const { error: signUpError } = await supabase.auth.signUp({
          email: `${username}@demo.com`,
          password: 'demo123456',
          options: {
            data: {
              username: userData.username,
              role: userData.role,
              full_name: userData.full_name
            }
          }
        });

        if (signUpError) {
          return { error: signUpError };
        }

        // Try signing in again
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: `${username}@demo.com`,
          password: 'demo123456'
        });

        if (signInError) {
          return { error: signInError };
        }
      }

      toast({
        title: "Login berhasil",
        description: `Selamat datang, ${userData.full_name}!`,
      });

      return { error: null };
    } catch (error) {
      return { error: { message: 'Terjadi kesalahan sistem' } };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Gagal logout",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logout berhasil",
        description: "Anda telah keluar dari sistem",
      });
    }
  };

  const value = {
    user,
    session,
    userRole,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
