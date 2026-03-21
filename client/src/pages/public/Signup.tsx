/**
 * Signup Page
 * Registration page with split screen layout
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Zap, ArrowLeft, Github, Mail, User, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Notification } from '../../components/Notification';

export default function Signup() {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const getDashboardPath = (role: string) => {
    if (role === 'admin') return '/admin';
    if (role === 'team') return '/team';
    return '/user-dashboard';
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const result = await register(name, email, password);
      if (result.requiresVerification) {
        navigate('/verification', { state: { email } });
      } else {
        navigate(getDashboardPath(result.user.role), { replace: true });
      }
    } catch {
      // error shown from context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Side - Visuals */}
      <div className="hidden lg:flex relative bg-black items-center justify-center overflow-hidden p-12">
        <div className="absolute inset-0 bg-gradient-to-bl from-purple-900/20 via-background to-blue-900/20 z-0" />
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-[20%] right-[20%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] left-[10%] w-[70%] h-[70%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse delay-700" />
        </div>
        
        <div className="relative z-10 space-y-8 max-w-lg">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">Nova<span className="text-primary">Agency</span></span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Join the innovation revolution.</h2>
            <p className="text-white/60 leading-relaxed">
              Create your account to start managing projects, tracking performance, and scaling your digital presence.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
               <div className="text-2xl font-bold text-white mb-1">Fast</div>
               <div className="text-sm text-white/50">Onboarding</div>
             </div>
             <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
               <div className="text-2xl font-bold text-white mb-1">Secure</div>
               <div className="text-sm text-white/50">Data Protection</div>
             </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div>
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
            <p className="mt-2 text-muted-foreground">
              Enter your details below to get started
            </p>
          </div>

          <Notification
            type="error"
            title="Registration Failed"
            message={localError ?? error ?? undefined}
            isVisible={!!(error || localError)}
            onClose={() => { clearError(); setLocalError(null); }}
          />

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="confirm-password">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={submitting}>
              Create Account
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or sign up with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="w-full">
              <Github className="mr-2 h-4 w-4" />
              Github
            </Button>
            <Button variant="outline" className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}