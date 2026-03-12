'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { Briefcase, Loader2, Eye, EyeOff } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    location: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const requestCode = async (isResend: boolean = false) => {
    setLoading(true);
    setCanResend(false);

    try {
      await authAPI.requestVerificationCode({
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
        mobile: formData.phone.trim(),
        resend: isResend,
      });

      toast({
        title: isResend ? 'Code Resent!' : 'Verification Code Sent!',
        description: 'Please check your email for the 4-digit verification code. Check spam folder if not in inbox.',
      });

      setShowVerification(true);
    } catch (error: any) {
      if (error.response?.data?.canResend) {
        setCanResend(true);
      }

      let errorMessage = 'Failed to send verification code. Please try again.';
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        errorMessage = error.response.data.errors.map((e: any) => e.message).join(', ');
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Step 1: Request verification code
    if (!showVerification) {
      if (!formData.name.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter your full name',
          variant: 'destructive',
        });
        return;
      }

      if (!formData.email.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter your email address',
          variant: 'destructive',
        });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: 'Error',
          description: 'Passwords do not match',
          variant: 'destructive',
        });
        return;
      }

      if (formData.password.length < 6) {
        toast({
          title: 'Error',
          description: 'Password must be at least 6 characters long',
          variant: 'destructive',
        });
        return;
      }

      await requestCode(false);
      return;
    }

    // Step 2: Verify code and complete registration
    if (!verificationCode || verificationCode.length !== 4) {
      toast({
        title: 'Error',
        description: 'Please enter the 4-digit verification code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        email: formData.email,
        verificationCode,
      });
      const { user, token } = response.data.data;

      setAuth(user, token);

      toast({
        title: 'Welcome to Job Portal!',
        description: 'Your account has been created successfully. Start exploring!',
      });

      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Invalid verification code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const response = await authAPI.googleRegister({
        email: user.email,
        name: user.displayName,
        googleId: user.uid,
        profilePhoto: user.photoURL,
        phone: formData.phone || null,
        location: formData.location || null,
      });

      const { user: dbUser, token } = response.data.data;
      setAuth(dbUser, token);

      toast({
        title: 'Welcome to Job Portal!',
        description: 'Your account has been created successfully with Google.',
      });

      router.push('/');
    } catch (error: any) {
      console.error('Google sign-up error:', error);

      if (error.response?.data?.isRegistered) {
        toast({
          title: 'Account Already Exists',
          description: error.response.data.error,
          variant: 'destructive',
        });
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'Failed to sign up with Google. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-[460px]">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/8">
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold">Job Portal</span>
        </Link>

        <Card className="rounded-lg border bg-card">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-lg font-semibold">Create an account</h1>
              <p className="text-[13px] text-muted-foreground mt-1">
                Join our community to discover opportunities
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Verification Code Step */}
              {showVerification ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border bg-primary/5">
                    <p className="text-[13px] text-center mb-1">
                      We sent a 4-digit verification code to:
                    </p>
                    <p className="text-[13px] font-semibold text-center break-all">{formData.email}</p>
                    <p className="text-[11px] text-muted-foreground text-center mt-1">
                      Check your spam folder if you don&apos;t see the email.
                    </p>
                    {canResend && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-[11px] text-center text-muted-foreground mb-2">
                          Haven&apos;t received the code?
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full text-[13px]"
                          onClick={() => requestCode(true)}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Resending...
                            </>
                          ) : (
                            'Resend Code'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="verificationCode" className="text-[13px] font-medium">Verification Code</Label>
                    <Input
                      id="verificationCode"
                      name="verificationCode"
                      type="text"
                      placeholder="Enter 4-digit code"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setVerificationCode(value);
                      }}
                      maxLength={4}
                      required
                      disabled={loading}
                      className="h-11 text-xl tracking-[0.3em] text-center"
                    />
                    <p className="text-[11px] text-muted-foreground text-center">
                      Check your spam folder if you don&apos;t see the email
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full text-[13px]"
                    onClick={() => {
                      setShowVerification(false);
                      setVerificationCode('');
                      setCanResend(false);
                    }}
                    disabled={loading}
                  >
                    Back to edit information
                  </Button>

                  <Button type="submit" size="sm" className="w-full text-[13px] h-9" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify and Create Account'
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-[13px] font-medium">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="h-9 text-[13px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-[13px] font-medium">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="h-9 text-[13px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-[13px] font-medium">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min. 6 characters"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          className="h-9 text-[13px] pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-[13px] font-medium">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Re-enter password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          className="h-9 text-[13px] pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-[13px] font-medium">
                        Phone <span className="text-muted-foreground font-normal">(Optional)</span>
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={loading}
                        className="h-9 text-[13px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="location" className="text-[13px] font-medium">
                        Location <span className="text-muted-foreground font-normal">(Optional)</span>
                      </Label>
                      <LocationAutocomplete
                        id="location"
                        value={formData.location}
                        onChange={(value) => setFormData({ ...formData, location: value })}
                        placeholder="City, State"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Terms and Privacy Agreement */}
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      disabled={loading}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="agreeTerms" className="text-[12px] text-muted-foreground cursor-pointer select-none leading-relaxed">
                      I agree to the{' '}
                      <Link href="/terms" target="_blank" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" target="_blank" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>

                  <Button type="submit" size="sm" className="w-full text-[13px] h-9" disabled={loading || googleLoading || !agreedToTerms}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Sending verification code...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </>
              )}
            </form>

            {/* Google Sign-Up - only show when not in verification step */}
            {!showVerification && (
              <>
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-2 text-[11px] text-muted-foreground uppercase tracking-wide">
                      or
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-[13px] h-9"
                  onClick={handleGoogleSignUp}
                  disabled={loading || googleLoading || !agreedToTerms}
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Signing up with Google...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-3.5 w-3.5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Sign up with Google
                    </>
                  )}
                </Button>
              </>
            )}

            <p className="text-[13px] text-center mt-5 text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
