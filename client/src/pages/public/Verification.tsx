/**
 * Verification Page (OTP)
 * Users enter the 6-digit code sent to their email to verify their account.
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Mail, ArrowRight, RefreshCcw, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api/auth.api';
import { AxiosError } from 'axios';

export default function Verification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [activeOtpIndex, setActiveOtpIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Email from location state (passed from login/signup/ProtectedRoute)
  const email = location.state?.email || user?.email || '';

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // If already verified, redirect immediately
  useEffect(() => {
    if (user?.isVerified) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [user?.isVerified]);

  const getDashboardPath = (role: string) => {
    if (role === 'admin') return '/admin';
    if (role === 'team') return '/team';
    return '/user-dashboard';
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      const next = index + 1;
      setActiveOtpIndex(next);
      inputRefs.current[next]?.focus();
    }
  };

  const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        const prev = index - 1;
        setActiveOtpIndex(prev);
        inputRefs.current[prev]?.focus();
      }
    }
  };

  const handleOnPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    if (!digits.length) return;
    const newOtp = [...otp];
    digits.forEach((d, i) => { newOtp[i] = d; });
    setOtp(newOtp);
    const focusIdx = Math.min(digits.length, 5);
    setActiveOtpIndex(focusIdx);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const code = otp.join('');

    try {
      await authApi.verifyEmail(email, code);

      // Mark user as verified in context + localStorage
      updateUser({ isVerified: true });
      setIsSuccess(true);

      // Navigate to correct dashboard after short delay
      setTimeout(() => {
        navigate(getDashboardPath(user?.role ?? 'user'), { replace: true });
      }, 1200);
    } catch (err) {
      const msg = (err as AxiosError<{ message: string }>).response?.data?.message
        ?? 'Verification failed. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendMsg(null);
    setError(null);
    try {
      await authApi.resendVerification(email);
      setResendMsg('A new code has been sent to your email.');
      setOtp(['', '', '', '', '', '']);
      setActiveOtpIndex(0);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err) {
      const msg = (err as AxiosError<{ message: string }>).response?.data?.message
        ?? 'Failed to resend code.';
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 md:p-10 shadow-2xl text-center">

          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <div className="relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 border border-primary/10">
                {isSuccess ? (
                  <CheckCircle className="w-10 h-10 text-primary animate-in zoom-in duration-300" />
                ) : (
                  <Mail className="w-10 h-10 text-primary" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Check your email</h2>
            <p className="text-muted-foreground">
              We've sent a 6-digit verification code to <br />
              <span className="font-semibold text-foreground">{email || 'your email'}</span>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm mb-6 text-left">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Resend success */}
          {resendMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm mb-6 text-left">
              <CheckCircle className="h-4 w-4 shrink-0" />
              {resendMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 md:gap-3 mb-8">
              {otp.map((_, index) => (
                <div key={index} className="relative">
                  <Input
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={`w-10 h-12 md:w-12 md:h-14 text-center text-xl font-bold p-0 rounded-xl transition-all duration-200 ${
                      activeOtpIndex === index ? 'ring-2 ring-primary border-primary' : ''
                    }`}
                    value={otp[index]}
                    onChange={(e) => handleOnChange(e, index)}
                    onKeyDown={(e) => handleOnKeyDown(e, index)}
                    onPaste={handleOnPaste}
                    onFocus={() => setActiveOtpIndex(index)}
                    maxLength={1}
                    disabled={isSubmitting || isSuccess}
                  />
                  {index === activeOtpIndex && !otp[index] && !isSubmitting && !isSuccess && (
                    <motion.div
                      layoutId="caret"
                      className="absolute inset-0 pointer-events-none flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="w-0.5 h-6 bg-primary animate-pulse" />
                    </motion.div>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg rounded-xl mb-6"
              disabled={otp.some(d => !d) || isSubmitting || isSuccess}
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Verifying...</>
              ) : isSuccess ? (
                <><CheckCircle className="mr-2 h-5 w-5" />Verified!</>
              ) : (
                <>Verify Account<ArrowRight className="ml-2 h-5 w-5" /></>
              )}
            </Button>
          </form>

          <div className="text-sm text-muted-foreground">
            Didn't receive the code?{' '}
            <button
              onClick={handleResend}
              disabled={resending || isSuccess}
              className="text-primary hover:underline font-medium inline-flex items-center disabled:opacity-50"
            >
              {resending ? (
                <><Loader2 className="mr-1 w-3 h-3 animate-spin" />Sending...</>
              ) : (
                <>Resend Code<RefreshCcw className="ml-1 w-3 h-3" /></>
              )}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-border/50">
            <Link to="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Sign up
            </Link>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
