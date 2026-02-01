/**
 * AuthContext.tsx
 * 
 * Provides authentication state and methods throughout the app.
 * Handles login, register, logout, and session management.
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

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const skipNextSyncRef = useRef(false);
  const lastLoadTimeRef = useRef<number>(0);

  // Get store methods for data sync - use selectors to avoid re-renders
  const loadFromServer = useStoryBoardStore((state) => state.loadFromServer);
  const exportData = useStoryBoardStore((state) => state.exportData);
  const clearAll = useStoryBoardStore((state) => state.clearAll);
  
  // Track store data for change detection
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

  // Load user data from server into local store
  const loadUserData = useCallback(async () => {
    try {
      skipNextSyncRef.current = true; // Prevent sync during load
      lastLoadTimeRef.current = Date.now(); // Track when we loaded
      
      console.log('[Auth] Loading user data from server...');
      const response = await fetch('/api/data/sync');
      console.log('[Auth] Response status:', response.status);
      
      if (response.ok) {
        const serverData = await response.json();
        console.log('[Auth] Server data:', { 
          stories: serverData.stories?.length || 0,
          characters: serverData.characters?.length || 0,
          chapters: serverData.chapters?.length || 0,
          tags: serverData.tags?.length || 0,
        });
        
        // Get current local data from the store
        const localData = exportData();
        console.log('[Auth] Local data:', {
          stories: localData.stories?.length || 0,
          chapters: localData.chapters?.length || 0,
        });
        
        // If server has data OR local has no data, use server data
        const serverHasData = (serverData.stories?.length > 0) || (serverData.chapters?.length > 0);
        const localHasData = (localData.stories?.length > 0) || (localData.chapters?.length > 0);
        
        if (serverHasData || !localHasData) {
          console.log('[Auth] Using server data');
          // Clear localStorage before loading to prevent stale data issues
          if (typeof window !== 'undefined') {
            localStorage.removeItem('storyboard-storage');
          }
          loadFromServer(serverData);
          console.log('[Auth] Data loaded into store');
        } else if (localHasData && !serverHasData) {
          // Local has data but server doesn't - sync local data to server first!
          console.log('[Auth] Server is empty but local has data - syncing to server first');
          skipNextSyncRef.current = false; // Allow this sync
          await syncDataToServer(localData);
          console.log('[Auth] Local data synced to server');
        }
      } else {
        console.error('[Auth] Failed to load:', await response.text());
      }
      
      // Keep skip flag for a bit to avoid immediate re-sync
      setTimeout(() => {
        skipNextSyncRef.current = false;
        console.log('[Auth] Sync protection disabled, auto-sync enabled');
      }, 3000);
    } catch (error) {
      console.error('Failed to load user data:', error);
      skipNextSyncRef.current = false;
    }
  }, [loadFromServer, exportData]);

  // Direct sync function (not debounced) for immediate use
  const syncDataToServer = useCallback(async (data: ReturnType<typeof exportData>) => {
    try {
      console.log('[Auth] Syncing data to server...', {
        stories: data.stories?.length || 0,
        chapters: data.chapters?.length || 0,
      });
      const response = await fetch('/api/data/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        console.error('[Auth] Sync failed:', await response.text());
      } else {
        console.log('[Auth] Sync successful');
      }
    } catch (error) {
      console.error('[Auth] Sync error:', error);
    }
  }, []);

  // Save local store data to server
  const syncData = useCallback(async () => {
    // Don't sync if we just loaded data (within 5 seconds)
    const timeSinceLoad = Date.now() - lastLoadTimeRef.current;
    if (timeSinceLoad < 5000) {
      console.log('[Auth] Skipping sync - just loaded data', timeSinceLoad, 'ms ago');
      return;
    }
    
    if (!user || skipNextSyncRef.current || isSyncing) return;
    
    // Don't sync empty data
    const data = exportData();
    if (data.stories.length === 0) return;
    
    try {
      setIsSyncing(true);
      console.log('[Auth] Syncing data to server...', {
        stories: data.stories.length,
        chapters: data.chapters?.length || 0,
        loreEntries: data.loreEntries?.length || 0,
        ideaCards: data.ideaCards?.length || 0,
        tags: data.tags?.length || 0,
      });
      const response = await fetch('/api/data/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Sync failed:', errorText);
      } else {
        console.log('[Auth] Sync successful');
      }
    } catch (error) {
      console.error('Failed to sync data:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [user, exportData, isSyncing]);

  // Debounced sync when data changes
  useEffect(() => {
    // Don't sync during initial loading or when sync protection is active
    if (!user || isLoading || skipNextSyncRef.current) return;
    
    // Clear any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // Schedule sync after 2 seconds of no changes
    syncTimeoutRef.current = setTimeout(() => {
      syncData();
    }, 2000);
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [user, isLoading, stories, characters, locations, events, chapters, tags, loreEntries, ideaCards, ideaGroups, relationships, syncData]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          // Load user's data from server
          await loadUserData();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [loadUserData]);

  // Auto-sync data when store changes (debounced) and periodically
  useEffect(() => {
    if (!user) return;

    // Sync every 10 seconds for more reliable persistence
    const interval = setInterval(syncData, 10000);

    // Sync on beforeunload
    const handleBeforeUnload = () => {
      // Don't sync if we just loaded (prevent syncing stale data)
      const timeSinceLoad = Date.now() - lastLoadTimeRef.current;
      if (timeSinceLoad < 5000) {
        console.log('[Auth] Skipping beforeunload sync - just loaded data');
        return;
      }
      // Use sendBeacon for reliable sync on page close
      const data = exportData();
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon('/api/data/sync', blob);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Sync on visibility change (when user switches tabs/minimizes)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Don't sync if we just loaded
        const timeSinceLoad = Date.now() - lastLoadTimeRef.current;
        if (timeSinceLoad < 5000) {
          console.log('[Auth] Skipping visibility sync - just loaded data');
          return;
        }
        syncData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, exportData, syncData]);

  // Login handler
  const login = async (emailOrUsername: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const data = await response.json();

      if (response.ok) {
        skipNextSyncRef.current = true; // Prevent sync during login transition
        setUser(data.user);
        // Clear localStorage to prevent stale data from being rehydrated
        if (typeof window !== 'undefined') {
          localStorage.removeItem('storyboard-storage');
        }
        // Clear local data and load user's data from server
        clearAll();
        await loadUserData();
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Failed to connect to server' };
    }
  };

  // Register handler
  const register = async (username: string, email: string, password: string) => {
    try {
      // Sync current local data first if there's any
      const currentData = exportData();
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        
        // If user had local data before registering, save it to their new account
        if (currentData.stories.length > 0) {
          await fetch('/api/data/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentData),
          });
        }
        
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Failed to connect to server' };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      // Sync data before logging out
      await syncData();
      
      await fetch('/api/auth/logout', { method: 'POST' });
      
      setUser(null);
      // Clear local store
      clearAll();
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state
      setUser(null);
      clearAll();
    }
  };

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
