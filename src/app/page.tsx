/**
 * page.tsx - Main entry point of the app
 * 
 * Shows LoginForm if not logged in, Dashboard if logged in.
 */

'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/features/auth';
import { Dashboard } from '@/components/features/dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, isLoading } = useAuth();

  // Show loading skeleton while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="pt-4">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Not logged in → show login form
  if (!user) {
    return <LoginForm />;
  }

  // Logged in → show dashboard
  return <Dashboard />;
}
