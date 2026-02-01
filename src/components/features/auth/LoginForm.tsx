/**
 * LoginForm.tsx - Login/Register form with proper authentication
 * 
 * Supports both login and registration with username, email, and password.
 * Data is persisted to the server database.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Auth
import { useAuth } from '@/contexts/AuthContext';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icons
import { BookOpen, Sparkles, Users, MapPin, Clock, Lightbulb, Loader2, AlertCircle } from 'lucide-react';

// =============================================================================
// FEATURE LIST (shown on login page)
// =============================================================================

const FEATURES = [
  { icon: Users, label: 'Characters', description: 'Define your cast with rich profiles' },
  { icon: MapPin, label: 'Locations', description: 'Map your fictional world' },
  { icon: Clock, label: 'Timeline', description: 'Organize events chronologically' },
  { icon: Lightbulb, label: 'Ideas', description: 'Capture every spark of inspiration' },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LoginForm() {
  const router = useRouter();
  const { login, register, isLoading: authLoading } = useAuth();
  
  // Form state
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(loginEmail, loginPassword);
      if (result.success) {
        router.push('/');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (registerPassword !== registerConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (registerPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register(registerUsername, registerEmail, registerPassword);
      if (result.success) {
        router.push('/');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        
        {/* ===== LEFT SIDE: BRANDING ===== */}
        <div className="space-y-8">
          {/* Logo and tagline */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-xl">
                <BookOpen className="w-8 h-8 text-amber-700" />
              </div>
              <h1 className="text-4xl font-bold text-stone-800">StoryBoard</h1>
            </div>
            <p className="text-xl text-stone-600 leading-relaxed">
              Your digital workspace for planning stories. Organize characters, 
              locations, timelines, and ideas in one beautiful, connected space.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.label}
                className="p-4 bg-white/60 backdrop-blur rounded-xl border border-stone-200/50"
              >
                <feature.icon className="w-5 h-5 text-amber-600 mb-2" />
                <h3 className="font-medium text-stone-800">{feature.label}</h3>
                <p className="text-sm text-stone-500">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Tagline */}
          <div className="flex items-center gap-2 text-stone-500">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Where scattered ideas become coherent worlds</span>
          </div>
        </div>

        {/* ===== RIGHT SIDE: AUTH FORM ===== */}
        <Card className="shadow-xl border-stone-200/50 bg-white/80 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-stone-800">Welcome</CardTitle>
            <CardDescription className="text-stone-500">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'login' | 'register'); setError(null); }}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Create Account</TabsTrigger>
              </TabsList>

              {/* Error display */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-stone-700">Email or Username</Label>
                    <Input
                      id="login-email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-stone-700">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username" className="text-stone-700">Username</Label>
                    <Input
                      id="register-username"
                      placeholder="yourname"
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      required
                      disabled={isSubmitting}
                      minLength={3}
                      maxLength={30}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-stone-700">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="you@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-stone-700">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm" className="text-stone-700">Confirm Password</Label>
                    <Input
                      id="register-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <p className="mt-4 text-xs text-center text-stone-400">
              Your stories are saved securely to your account
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
