import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  masterPassword: string | null;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  register: (name: string, email: string, password: string) => Promise<{ error: Error | null; masterPassword?: string }>;
  logout: () => Promise<void>;
  getMasterPassword: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch master password after login
          setTimeout(() => {
            fetchMasterPassword(session.user.id);
          }, 0);
        } else {
          setMasterPassword(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMasterPassword(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMasterPassword = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_master_passwords')
      .select('master_password')
      .eq('user_id', userId)
      .single();
    
    if (data && !error) {
      setMasterPassword(data.master_password);
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const register = async (name: string, email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
        },
      },
    });

    if (error) {
      return { error: error as Error };
    }

    // Fetch the generated master password
    if (data.user) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger to complete
      const { data: passwordData } = await supabase
        .from('user_master_passwords')
        .select('master_password')
        .eq('user_id', data.user.id)
        .single();
      
      return { 
        error: null, 
        masterPassword: passwordData?.master_password 
      };
    }

    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setMasterPassword(null);
  };

  const getMasterPassword = async () => {
    if (!user) return null;
    
    const { data } = await supabase
      .from('user_master_passwords')
      .select('master_password')
      .eq('user_id', user.id)
      .single();
    
    return data?.master_password || null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        masterPassword,
        login,
        register,
        logout,
        getMasterPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
