/**
 * use-auth.tsx - Re-export from AuthContext for backwards compatibility
 * 
 * This file exists for backwards compatibility.
 * The actual auth implementation is in @/contexts/AuthContext.tsx
 */

export { AuthProvider, useAuth } from '@/contexts/AuthContext';
