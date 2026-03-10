'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { authAPI } from '@/lib/api';
import { Briefcase, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function ForgotPasswordPage() {
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
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
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
      toast({
        title: 'Error',
        description: 'Please enter the 4-digit reset code',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword({
        email: email.trim(),
        code,
        newPassword,
      });

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center space-x-2 mb-6 md:mb-8">
          <Briefcase className="h-7 w-7 md:h-8 md:w-8 text-primary" />
          <span className="font-bold text-xl md:text-2xl">Job Portal</span>
        </Link>

        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl md:text-2xl font-bold text-center">
              {step === 'email' ? 'Forgot Password' : 'Reset Password'}
            </CardTitle>
            <CardDescription className="text-center text-sm">
              {step === 'email'
                ? 'Enter your email and we\'ll send you a reset code'
                : 'Enter the code sent to your email and your new password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'email' ? (
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm text-center mb-1">
                    We sent a 4-digit reset code to:
                  </p>
                  <p className="text-sm font-semibold text-center">{email}</p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Check your spam folder if not in inbox.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Reset Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 4-digit code"
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCode(value);
                    }}
                    maxLength={4}
                    required
                    disabled={loading}
                    className="text-center text-2xl tracking-widest h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  disabled={loading}
                >
                  Back to enter email
                </Button>
              </form>
            )}

            <div className="mt-4 text-center text-sm">
              <Link href="/auth/login" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                Back to Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
