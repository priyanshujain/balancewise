import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initDatabase, getAuth, saveAuth, deleteAuth, User } from '@/services/database';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (token: string, userData: User) => Promise<void>;
  signOut: () => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Initialize database
      await initDatabase();

      // Load stored auth data
      await loadStoredAuth();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setIsLoading(false);
    }
  };

  const loadStoredAuth = async () => {
    try {
      const authData = await getAuth();

      if (authData) {
        setToken(authData.token);
        setUser(authData.user);
        console.log('Loaded stored auth for user:', authData.user.email);
      } else {
        console.log('No stored auth found');
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (authToken: string, userData: User) => {
    try {
      // Save to database
      await saveAuth(authToken, userData);

      // Update state
      setToken(authToken);
      setUser(userData);

      console.log('Signed in successfully:', userData.email);
    } catch (error) {
      console.error('Failed to save auth:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Delete from database
      await deleteAuth();

      // Clear state
      setToken(null);
      setUser(null);

      console.log('Signed out successfully');
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
