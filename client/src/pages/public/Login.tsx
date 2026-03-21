/**
 * Login Page
 * Split screen layout with abstract graphics
 */
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Zap, ArrowLeft, Github, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Notification } from '../../components/Notification';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? null;

  const getDashboardPath = (role: string) => {
    if (role === 'admin') return '/admin';
    if (role === 'team') return '/team';
    return '/user-dashboard';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      navigate(from ?? getDashboardPath(loggedInUser.role), { replace: true });
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 z-0" />
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-primary/10 blur-[150px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-secondary/10 blur-[150px] animate-pulse" />
        </div>
        
        <div className="relative z-10 space-y-8 max-w-lg">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">Nova<span className="text-primary">Agency</span></span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Welcome back to the future of development.</h2>
            <p className="text-white/60 leading-relaxed">
              Access your dashboard to manage projects, view analytics, and collaborate with your team.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
               <div className="text-2xl font-bold text-white mb-1">2.4k+</div>
               <div className="text-sm text-white/50">Active Users</div>
             </div>
             <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
               <div className="text-2xl font-bold text-white mb-1">99.9%</div>
               <div className="text-sm text-white/50">Uptime</div>
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
            <h2 className="text-3xl font-bold tracking-tight">Sign in to your account</h2>
            <p className="mt-2 text-muted-foreground">
              Enter your email below to access your admin panel
            </p>
          </div>

          <Notification
            type="error"
            title="Login Failed"
            message={error ?? undefined}
            isVisible={!!error}
            onClose={clearError}
          />

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none" htmlFor="password">
                  Password
                </label>
                <a href="#" className="text-sm font-medium text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" isLoading={submitting}>
              Sign In
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
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
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}