/**
 * auth.tsx - Authentication Context
 * 
 * Provides user authentication state throughout the app.
 * Currently uses a simple local auth (no backend).
 * 
 * Usage:
 *   const { user, login, logout } = useAuth();
 */

'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useStoryBoardStore } from './store';
import { User } from './types';
import { v4 as uuidv4 } from 'uuid';

// Define what the auth context provides
interface AuthContextType {
  user: User | null;        // Current logged-in user (null if not logged in)
  isLoading: boolean;       // True while checking auth state
  login: (name: string, email: string) => void;
  logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider - Wrap your app with this to enable authentication
 * 
 * Example:
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Get user state from the store
  const { user, setUser } = useStoryBoardStore();
  
  // No async loading needed since we use localStorage
  const isLoading = useMemo(() => false, []);

  // Create a new user and save to store
  const login = (name: string, email: string) => {
    const newUser: User = {
      id: uuidv4(),
      name,
      email,
      createdAt: new Date(),
    };
    setUser(newUser);
  };

  // Clear user from store
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth - Hook to access auth state and functions
 * 
 * Example:
 *   const { user, login, logout } = useAuth();
 *   if (user) { ... }
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
