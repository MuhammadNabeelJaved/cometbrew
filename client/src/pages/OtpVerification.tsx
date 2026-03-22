import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';

export default function OtpVerification() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0 && !isVerified) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, isVerified]);

  useEffect(() => {
    if (otpError) toast.error('Verification Failed', { description: otpError });
  }, [otpError]);

  useEffect(() => {
    if (isVerified) toast.success('Successfully Verified!', { description: 'Your email has been confirmed. Redirecting you to the dashboard...' });
  }, [isVerified]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.value && element.nextSibling) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current is empty and backspace pressed, focus previous
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        const prevInput = e.currentTarget.previousSibling as HTMLInputElement;
        if (prevInput) prevInput.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleVerify = () => {
    setOtpError(null);
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Simulate random error for demo; replace with real API response
      const success = true;
      if (success) {
        setIsVerified(true);
      } else {
        setOtpError('Invalid code. Please check and try again.');
      }
    }, 1500);
  };

  const handleResend = () => {
    setTimer(30);
    setOtp(['', '', '', '', '', '']);
    // Simulate resend
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 py-12 px-4 flex items-center justify-center font-sans">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md w-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden relative"
      >
        {/* Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        <div className="p-8 md:p-10">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/10 rounded-2xl flex items-center justify-center transform rotate-3">
              <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              Verification Code
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              We sent a 6-digit code to <span className="font-semibold text-neutral-900 dark:text-neutral-200">alex@nabeel.agency</span>.
              <br />Enter the code below to confirm your identity.
            </p>
          </div>

          {!isVerified ? (
            <div className="space-y-6">
              <div className="flex justify-between gap-2">
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={data}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onFocus={(e) => e.target.select()}
                    className="w-12 h-14 border border-neutral-200 dark:border-neutral-800 rounded-lg text-center text-xl font-bold bg-neutral-50 dark:bg-neutral-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all dark:text-white"
                  />
                ))}
              </div>

              <Button
                onClick={handleVerify}
                disabled={otp.some(d => !d)}
                isLoading={isLoading}
                className="w-full"
                size="lg"
              >
                Verify Account <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="text-center text-sm">
                <p className="text-neutral-500 dark:text-neutral-400 mb-2">
                  Didn't receive the code?
                </p>
                {timer > 0 ? (
                  <span className="text-neutral-400 font-mono">
                    Resend code in 00:{timer.toString().padStart(2, '0')}
                  </span>
                ) : (
                  <button 
                    onClick={handleResend}
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-6 space-y-6"
            >
              <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2 }}
                  className="h-full bg-green-500"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer of Card */}
        <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 border-t border-neutral-100 dark:border-neutral-800 text-center text-xs text-neutral-400">
          <Link to="/" className="hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
            &larr; Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
