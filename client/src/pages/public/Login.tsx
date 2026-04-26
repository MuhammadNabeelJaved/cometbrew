/**
 * Login Page
 * Split screen layout with abstract graphics
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Zap, ArrowLeft, Github, Mail, Shield } from 'lucide-react';
import { useAuth, TwoFAPending } from '../../contexts/AuthContext';
import { authApi } from '../../api/auth.api';
import { twoFactorApi } from '../../api/twoFactor.api';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithToken, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 2FA state
  const [twoFAPending, setTwoFAPending] = useState<TwoFAPending | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [validating2FA, setValidating2FA] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? null;

  useEffect(() => {
    if (error) {
      toast.error('Login Failed', { description: error });
    }
  }, [error]);

  // Show error toast if redirected back from OAuth failure
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    if (!error) return;
    if (error === 'account_not_found') {
      toast.error('Account not found', {
        description: "No account exists for that email. Please sign up first.",
      });
    } else if (error === 'github_no_email') {
      toast.error('OAuth sign-in failed', {
        description: 'GitHub email is private. Please make your primary email public in GitHub settings.',
      });
    } else if (error === 'account_deactivated') {
      toast.error('Account deactivated', { description: 'This account has been deactivated.' });
    } else {
      toast.error('OAuth sign-in failed', {
        description: 'Could not sign in. Please try again.',
      });
    }
  }, [location.search]);

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
      const result = await login(email, password);
      if ('requiresTwoFactor' in result && result.requiresTwoFactor) {
        setTwoFAPending(result as TwoFAPending);
      } else {
        const loggedInUser = result as any;
        navigate(from ?? getDashboardPath(loggedInUser.role), { replace: true });
      }
    } catch {
      // error shown from context
    } finally {
      setSubmitting(false);
    }
  };

  const handle2FAValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFAPending || !totpCode) return;
    setValidating2FA(true);
    try {
      const { user } = await twoFactorApi.validate(totpCode, twoFAPending.userId);
      loginWithToken(user);
      navigate(from ?? getDashboardPath(user.role), { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Invalid 2FA code');
    } finally {
      setValidating2FA(false);
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

          {/* 2FA Step */}
          {twoFAPending && (
            <form onSubmit={handle2FAValidate} className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-violet-500/20 rounded-xl"><Shield className="h-5 w-5 text-violet-400" /></div>
                <div>
                  <div className="font-semibold">Two-Factor Verification</div>
                  <div className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Authentication Code</label>
                <Input
                  value={totpCode}
                  onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="000000"
                  className="text-center font-mono text-xl tracking-widest"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">You can also enter a backup code.</p>
              </div>
              <Button type="submit" className="w-full" disabled={validating2FA || totpCode.length < 6}>
                {validating2FA ? 'Verifying...' : 'Verify & Sign In'}
              </Button>
              <button type="button" onClick={() => { setTwoFAPending(null); setTotpCode(''); }}
                className="text-sm text-muted-foreground hover:text-foreground w-full text-center transition-colors">
                ← Back to sign in
              </button>
            </form>
          )}

          {!twoFAPending && <form onSubmit={handleLogin} className="space-y-6">
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
          </form>}

          {!twoFAPending && (
            <>
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
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => authApi.initiateGitHubLogin()}
                >
                  <Github className="mr-2 h-4 w-4" />
                  Github
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => authApi.initiateGoogleLogin()}
                >
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}