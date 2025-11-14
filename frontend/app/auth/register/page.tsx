'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { Briefcase, Loader2, User, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [canResend, setCanResend] = useState(false);
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
        title: isResend ? 'Code Resent! 📧' : 'Verification Code Sent! 📧',
        description: 'Please check your email for the 4-digit verification code. Check spam folder if not in inbox.',
      });

      setShowVerification(true);
    } catch (error: any) {
      // Check if we can resend
      if (error.response?.data?.canResend) {
        setCanResend(true);
      }

      // Show detailed validation errors if available
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
      // Validate name
      if (!formData.name.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter your full name',
          variant: 'destructive',
        });
        return;
      }

      // Validate email
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
        title: 'Welcome to Job Portal! 🎉',
        description: 'Your account has been created successfully. Start exploring!',
      });

      // Redirect to home page - less overwhelming for new users
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
      // Sign in with Google
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Send to backend
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
        title: 'Welcome to Job Portal! 🎉',
        description: 'Your account has been created successfully with Google.',
      });

      router.push('/');
    } catch (error: any) {
      console.error('Google sign-up error:', error);

      // Check if user already exists
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4 py-8 md:py-12">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center space-x-2 mb-6 md:mb-8">
          <Briefcase className="h-7 w-7 md:h-8 md:w-8 text-primary" />
          <span className="font-bold text-xl md:text-2xl">Job Portal</span>
        </Link>

        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl md:text-2xl font-bold text-center">Create an account</CardTitle>
            <CardDescription className="text-center text-sm">
              Join our community to discover opportunities and connect with professionals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Verification Code Step */}
              {showVerification ? (
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm text-center mb-2">
                      We sent a 4-digit verification code to:
                    </p>
                    <p className="text-sm font-semibold text-center mb-2">{formData.email}</p>
                    <p className="text-xs text-muted-foreground text-center">
                      Please enter the code below to complete your registration.
                    </p>
                    {canResend && (
                      <div className="mt-3 pt-3 border-t border-primary/20">
                        <p className="text-xs text-center text-muted-foreground mb-2">
                          Haven't received the code?
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
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

                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">Verification Code</Label>
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
                      className="text-center text-2xl tracking-widest"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Check your spam folder if you don't see the email
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-sm"
                    onClick={() => {
                      setShowVerification(false);
                      setVerificationCode('');
                      setCanResend(false);
                    }}
                    disabled={loading}
                  >
                    Back to edit information
                  </Button>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify and Create Account'
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Two Column Layout for larger screens */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <LocationAutocomplete
                    id="location"
                    value={formData.location}
                    onChange={(value) => setFormData({ ...formData, location: value })}
                    placeholder="City, State"
                    disabled={loading}
                  />
                </div>
              </div>

                  <Button type="submit" className="w-full" disabled={loading || googleLoading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignUp}
                  disabled={loading || googleLoading}
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing up with Google...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs md:text-sm text-muted-foreground mt-4 md:mt-6">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="hover:text-foreground underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="hover:text-foreground underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
