'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase, Loader2, ArrowLeft, ArrowRight, Eye, EyeOff, Mail, KeyRound, Shield, Lock, CheckCircle2 } from 'lucide-react';
import { LogoWhite, Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { authAPI } from '@/lib/api';

const ForgotPasswordPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({ title: 'Error', description: 'Please enter your email address', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      await authAPI.forgotPassword({ email: email.trim() });
      toast({
        title: 'Reset Code Sent!',
        description: 'If an account exists with this email, you will receive a reset code. Check your spam folder.',
      });
      setStep('reset');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to send reset code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 4) {
      toast({ title: 'Error', description: 'Please enter the 4-digit reset code', variant: 'destructive' });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters long', variant: 'destructive' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword({ email: email.trim(), code, newPassword });
      toast({
        title: 'Password Reset Successful!',
        description: 'Your password has been updated. Please sign in with your new password.',
      });
      router.push('/auth/login');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/8 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative flex flex-col justify-between p-10 w-full">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoWhite size={36} />
            <span className="font-bold text-[17px] tracking-tight text-white">job<span className="text-indigo-300">aye</span></span>
          </Link>

          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight leading-tight mb-3">
                Reset your<br />
                <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
                  password
                </span>
              </h2>
              <p className="text-[14px] text-slate-400 leading-relaxed max-w-sm">
                Don&apos;t worry, it happens to the best of us. We&apos;ll send you a code to reset your password securely.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {[
                { icon: Mail, label: 'Email verification', desc: 'We send a secure code to your email' },
                { icon: KeyRound, label: 'Create new password', desc: 'Set a strong password (min. 6 characters)' },
                { icon: CheckCircle2, label: 'Back to action', desc: 'Sign in with your new credentials' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="h-4 w-4 text-indigo-300" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white">{item.label}</p>
                    <p className="text-[12px] text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-slate-500">
            <Shield className="h-3.5 w-3.5" />
            <span>Your account security is our priority</span>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <Link href="/" className="flex lg:hidden items-center justify-center gap-2.5 mb-10">
            <Logo size={36} />
            <span className="font-bold text-[17px] tracking-tight">job<span className="text-indigo-500">aye</span></span>
          </Link>

          {step === 'email' ? (
            <div className="space-y-6">
              <div>
                <Link
                  href="/auth/login"
                  className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </Link>

                <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
                  <KeyRound className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-2">Forgot your password?</h1>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  Enter the email address associated with your account and we&apos;ll send you a reset code.
                </p>
              </div>

              <form onSubmit={handleSendCode} className="space-y-3 sm:space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-[13px] font-medium">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-9 sm:h-11 text-[13px]"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-9 sm:h-11 text-[13px] sm:text-[14px] font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      Send Reset Code
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-6"
                  disabled={loading}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to enter email
                </button>

                <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
                  <Lock className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-2">Reset your password</h1>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  Enter the code sent to <span className="font-semibold text-foreground">{email}</span> and your new password.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-3 sm:space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="code" className="text-[13px] font-medium">Reset Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="0000"
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCode(value);
                    }}
                    maxLength={4}
                    required
                    disabled={loading}
                    className="h-14 text-2xl tracking-[0.4em] text-center font-semibold"
                  />
                  <p className="text-[12px] text-muted-foreground text-center">
                    Check your spam folder if you don&apos;t see the email
                  </p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="newPassword" className="text-[13px] font-medium">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-9 sm:h-11 text-[13px] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-md"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-[13px] font-medium">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-9 sm:h-11 text-[13px] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-md"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-9 sm:h-11 text-[13px] sm:text-[14px] font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          <p className="text-[11px] text-center text-muted-foreground/60 mt-8">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
