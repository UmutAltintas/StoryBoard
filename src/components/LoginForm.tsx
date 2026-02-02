/**
 * LoginForm.tsx - Login/signup form for new users
 * 
 * Simple form to create a local user account.
 * Data is stored in localStorage (no backend required).
 */

'use client';

import { useState } from 'react';

// Auth
import { useAuth } from '@/lib/auth';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Icons
import { BookOpen, Sparkles, Users, MapPin, Clock, Lightbulb } from 'lucide-react';

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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      login(name.trim(), email.trim());
    }
  };

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

        {/* ===== RIGHT SIDE: LOGIN FORM ===== */}
        <Card className="shadow-xl border-stone-200/50 bg-white/80 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-stone-800">Welcome</CardTitle>
            <CardDescription className="text-stone-500">
              Enter your details to start building your story world
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name input */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-stone-700">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              {/* Email input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-stone-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              {/* Submit button */}
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                Start Creating
              </Button>
            </form>
            
            <p className="mt-4 text-xs text-center text-stone-400">
              Your stories are saved locally in your browser
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
