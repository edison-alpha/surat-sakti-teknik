
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
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Get user role from user metadata
          const userMetadata = session.user.user_metadata;
          console.log('User metadata:', userMetadata);
          setUserRole(userMetadata?.role || null);
        } else {
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const userMetadata = session.user.user_metadata;
        setUserRole(userMetadata?.role || null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      console.log('Attempting to sign in with username:', username);
      
      // Simple password check for demo
      if (password !== '12345') {
        return { error: { message: 'Username atau password salah' } };
      }

      // Define demo users with their roles
      const demoUsers = {
        '20533324': { role: 'mahasiswa', name: 'Mahasiswa Test', email: 'mahasiswa@test.com' },
        '205098767': { role: 'tu', name: 'TU Fakultas Teknik', email: 'tu@teknik.ac.id' },
        '20568965': { role: 'dekan', name: 'Dekan Fakultas Teknik', email: 'dekan@teknik.ac.id' }
      };

      const userData = demoUsers[username as keyof typeof demoUsers];
      if (!userData) {
        return { error: { message: 'Username atau password salah' } };
      }

      console.log('User data found:', userData);

      // Create a demo session by signing in with a demo email
      const demoEmail = `${username}@demo.local`;
      const demoPassword = 'demo123456';

      // Try to sign in first
      let { error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword
      });

      if (signInError) {
        console.log('Sign in failed, trying to sign up:', signInError);
        // If sign in fails, try to sign up
        const { error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
          options: {
            data: {
              username: username,
              role: userData.role,
              full_name: userData.name
            }
          }
        });

        if (signUpError) {
          console.error('Sign up error:', signUpError);
          return { error: signUpError };
        }

        // Try signing in again after signup
        const { error: retrySignInError } = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword
        });

        if (retrySignInError) {
          console.error('Retry sign in error:', retrySignInError);
          return { error: retrySignInError };
        }
      }

      console.log('Successfully signed in');
      
      toast({
        title: "Login berhasil",
        description: `Selamat datang, ${userData.name}!`,
      });

      return { error: null };
    } catch (error) {
      console.error('Login error:', error);
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
