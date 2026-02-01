/**
 * AuthContext.tsx
 * 
 * Simple authentication and data sync.
 * 
 * Approach:
 * - Server is the source of truth for logged-in users
 * - On page load: fetch from server, load into store
 * - On any data change: save to server (debounced 2s)
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useStoryBoardStore } from '@/lib/store';

// ============================================================================
// TYPES
// ============================================================================

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  syncData: () => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);
  const isLoggingOutRef = useRef(false);

  // Store methods
  const loadFromServer = useStoryBoardStore((state) => state.loadFromServer);
  const exportData = useStoryBoardStore((state) => state.exportData);
  const clearAll = useStoryBoardStore((state) => state.clearAll);

  // =========================================================================
  // SYNC: Save data to server
  // =========================================================================
  const syncData = useCallback(async () => {
    if (!user || isSyncingRef.current || isLoggingOutRef.current) return;
    
    const data = exportData();
    if (data.stories.length === 0) return;
    
    isSyncingRef.current = true;
    
    try {
      console.log('[Sync] Saving to server...', {
        stories: data.stories.length,
        chapters: data.chapters?.length || 0,
        characters: data.characters?.length || 0,
        events: data.events?.length || 0,
        loreEntries: data.loreEntries?.length || 0,
        ideaCards: data.ideaCards?.length || 0,
      });
      
      const response = await fetch('/api/data/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        console.log('[Sync] ✓ Saved successfully');
      } else {
        console.error('[Sync] ✗ Failed:', await response.text());
      }
    } catch (error) {
      console.error('[Sync] ✗ Error:', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [user, exportData]);

  // =========================================================================
  // LOAD: Fetch data from server
  // =========================================================================
  const loadData = useCallback(async () => {
    try {
      console.log('[Load] Fetching from server...');
      
      const response = await fetch('/api/data/sync');
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Load] ✓ Got data:', {
          stories: data.stories?.length || 0,
          chapters: data.chapters?.length || 0,
          characters: data.characters?.length || 0,
          events: data.events?.length || 0,
          loreEntries: data.loreEntries?.length || 0,
          ideaCards: data.ideaCards?.length || 0,
        });
        
        loadFromServer(data);
        return true;
      } else {
        console.error('[Load] ✗ Failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('[Load] ✗ Error:', error);
      return false;
    }
  }, [loadFromServer]);

  // =========================================================================
  // AUTH CHECK: On mount, check if user is logged in
  // =========================================================================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Clear localStorage to ensure we start fresh from server
        if (typeof window !== 'undefined') {
          localStorage.removeItem('storyboard-storage');
        }
        
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          
          // Load data from server
          await loadData();
        }
      } catch (error) {
        console.error('[Auth] Check failed:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    checkAuth();
  }, [loadData]);

  // =========================================================================
  // AUTO-SYNC: When store data changes, sync to server
  // =========================================================================
  const stories = useStoryBoardStore((state) => state.stories);
  const characters = useStoryBoardStore((state) => state.characters);
  const locations = useStoryBoardStore((state) => state.locations);
  const events = useStoryBoardStore((state) => state.events);
  const chapters = useStoryBoardStore((state) => state.chapters);
  const tags = useStoryBoardStore((state) => state.tags);
  const loreEntries = useStoryBoardStore((state) => state.loreEntries);
  const ideaCards = useStoryBoardStore((state) => state.ideaCards);
  const ideaGroups = useStoryBoardStore((state) => state.ideaGroups);
  const relationships = useStoryBoardStore((state) => state.relationships);

  useEffect(() => {
    // Don't sync until we've initialized and have a user
    if (!isInitialized || !user || isLoading) return;
    
    // Debounce: wait 2 seconds after last change
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      syncData();
    }, 2000);
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [
    isInitialized, user, isLoading, syncData,
    stories, characters, locations, events, chapters, 
    tags, loreEntries, ideaCards, ideaGroups, relationships
  ]);

  // =========================================================================
  // PERIODIC SYNC: Every 30 seconds as a safety net
  // =========================================================================
  useEffect(() => {
    if (!user || !isInitialized) return;
    
    const interval = setInterval(syncData, 30000);
    
    // Sync when page is about to close
    const handleBeforeUnload = () => {
      const data = exportData();
      if (data.stories.length > 0) {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        navigator.sendBeacon('/api/data/sync', blob);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, isInitialized, syncData, exportData]);

  // =========================================================================
  // LOGIN
  // =========================================================================
  const login = async (emailOrUsername: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        
        // Clear local and load from server
        if (typeof window !== 'undefined') {
          localStorage.removeItem('storyboard-storage');
        }
        clearAll();
        await loadData();
        
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Failed to connect to server' };
    }
  };

  // =========================================================================
  // REGISTER
  // =========================================================================
  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Failed to connect to server' };
    }
  };

  // =========================================================================
  // LOGOUT
  // =========================================================================
  const logout = async () => {
    // Set flag to prevent any sync from happening
    isLoggingOutRef.current = true;
    
    // Cancel any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    
    try {
      // Sync current data first (before clearing)
      await syncData();
      
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear user first so auto-sync won't trigger
    setUser(null);
    
    // Then clear local data
    clearAll();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('storyboard-storage');
    }
    
    // Reset logout flag
    isLoggingOutRef.current = false;
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        syncData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
