/**
 * OAuthCallback
 * Landing page after Google / GitHub OAuth redirect.
 *
 * Popup mode  (window.opener exists): sends postMessage to parent, then closes.
 * Direct mode (no opener):            navigates as before (fallback / deep-link).
 *
 * Three backend outcomes:
 *  1. Success (verified user)  → userId, email, role, name, photo, isVerified=true
 *  2. New signup (unverified)  → email, requiresVerification=true
 *  3. Error                    → error=<code>
 */
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { AuthUser } from '../../api/auth.api';
import type { OAuthPopupMessage } from '../../hooks/useOAuthPopup';

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  account_not_found:   { title: 'Account not found',      description: 'No account exists for that email. Please sign up first.' },
  account_exists:      { title: 'Account already exists', description: 'An account with that email already exists. Please log in instead.' },
  account_deactivated: { title: 'Account deactivated',    description: 'This account has been deactivated. Please contact support.' },
  github_no_email:     { title: 'Email not accessible',   description: 'GitHub email is private. Please make your primary email public in GitHub settings.' },
  no_email:            { title: 'Email not accessible',   description: 'Could not retrieve your email from the OAuth provider.' },
};

const getDashboardPath = (role: string) => {
  if (role === 'admin') return '/admin';
  if (role === 'team')  return '/team';
  return '/user-dashboard';
};

function sendToParent(msg: OAuthPopupMessage): boolean {
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(msg, window.location.origin);
      window.close();
      return true;
    }
  } catch {
    // opener from different origin — treat as direct tab
  }
  return false;
}

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginFromOAuth } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const error = searchParams.get('error');

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error) {
      const sent = sendToParent({ type: 'oauth-result', status: 'error', code: error });
      if (!sent) {
        const msg = ERROR_MESSAGES[error] ?? { title: 'Sign-in failed', description: 'Authentication failed. Please try again.' };
        toast.error(msg.title, { description: msg.description });
        navigate('/login', { replace: true });
      }
      return;
    }

    // ── New signup — requires email verification ───────────────────────────────
    const requiresVerification = searchParams.get('requiresVerification') === 'true';
    if (requiresVerification) {
      const email = searchParams.get('email') || '';
      const sent = sendToParent({ type: 'oauth-result', status: 'verification', email });
      if (!sent) {
        toast.info('Verify your email', { description: `A verification code has been sent to ${email}.` });
        navigate('/verification', { state: { email }, replace: true });
      }
      return;
    }

    // ── Verified user ──────────────────────────────────────────────────────────
    const userId     = searchParams.get('userId');
    const email      = searchParams.get('email');
    const role       = (searchParams.get('role') || 'user') as AuthUser['role'];
    const name       = searchParams.get('name') || email?.split('@')[0] || 'User';
    const photo      = searchParams.get('photo') ?? undefined;
    const isVerified = searchParams.get('isVerified') === 'true';

    if (!userId || !email) {
      const sent = sendToParent({ type: 'oauth-result', status: 'error', code: 'oauth_failed' });
      if (!sent) {
        toast.error('Sign-in failed', { description: 'Incomplete user data returned. Please try again.' });
        navigate('/login', { replace: true });
      }
      return;
    }

    const userData: AuthUser = { _id: userId, name, email, role, photo, isVerified };
    const sent = sendToParent({ type: 'oauth-result', status: 'success', user: userData });
    if (!sent) {
      // Direct tab fallback
      loginFromOAuth(userData);
      navigate(getDashboardPath(role), { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">Signing you in…</p>
      </div>
    </div>
  );
}
