'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { signInWithPopup } from 'firebase/auth';
import { Briefcase, Loader2, Eye, EyeOff, ArrowRight, ArrowLeft, Shield, Target, Users, Star, Sparkles, BarChart3, Mail } from 'lucide-react';

import { LocationAutocomplete } from '@/components/common/LocationAutocomplete';
import { LogoWhite, Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { authAPI } from '@/lib/api';
import { auth, googleProvider } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';

const RegisterPage = () => {
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

    if (!showVerification) {
      if (!formData.name.trim()) {
        toast({ title: 'Error', description: 'Please enter your full name', variant: 'destructive' });
        return;
      }

      if (!formData.email.trim()) {
        toast({ title: 'Error', description: 'Please enter your email address', variant: 'destructive' });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
        return;
      }

      if (formData.password.length < 6) {
        toast({ title: 'Error', description: 'Password must be at least 6 characters long', variant: 'destructive' });
        return;
      }

      await requestCode(false);
      return;
    }

    if (!verificationCode || verificationCode.length !== 4) {
      toast({ title: 'Error', description: 'Please enter the 4-digit verification code', variant: 'destructive' });
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
        title: 'Welcome to jobaye!',
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
        title: 'Welcome to jobaye!',
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
    <div className="min-h-screen flex bg-background">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/8 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative flex flex-col justify-between p-10 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <LogoWhite size={36} />
            <span className="font-bold text-[17px] tracking-tight text-white">job<span className="text-indigo-300">aye</span></span>
          </Link>

          {/* Hero content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight leading-tight mb-3">
                Start your journey<br />
                <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
                  with jobaye
                </span>
              </h2>
              <p className="text-[14px] text-slate-400 leading-relaxed max-w-sm">
                Create your free account and get access to thousands of verified job listings, AI-powered matching, and a thriving professional community.
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              {[
                { step: '01', icon: Star, label: 'Build your profile', desc: 'Showcase your skills and experience' },
                { step: '02', icon: Sparkles, label: 'Get matched instantly', desc: 'AI finds roles that fit your profile' },
                { step: '03', icon: BarChart3, label: 'Track everything', desc: 'Applications, interviews, and offers' },
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

            {/* What you get */}
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">What you get</p>
              {[
                'AI match scores for every job based on your profile',
                'One-click apply with saved resume and details',
                'Real-time application status and interview updates',
                'Community posts with salary insights and career tips',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="h-4 w-4 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  </span>
                  <p className="text-[12px] text-slate-400 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-slate-500">
            <Shield className="h-3.5 w-3.5" />
            <span>Your data is secure and private</span>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-[440px]">
          {/* Mobile logo */}
          <Link href="/" className="flex lg:hidden items-center justify-center gap-2.5 mb-10">
            <Logo size={36} />
            <span className="font-bold text-[17px] tracking-tight">job<span className="text-indigo-500">aye</span></span>
          </Link>

          {/* Verification Step */}
          {showVerification ? (
            <div className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setShowVerification(false);
                    setVerificationCode('');
                    setCanResend(false);
                  }}
                  className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-6"
                  disabled={loading}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to registration
                </button>

                <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
                  <Mail className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-2">Check your email</h1>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  We sent a 4-digit verification code to{' '}
                  <span className="font-semibold text-foreground">{formData.email}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="verificationCode" className="text-[13px] font-medium">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    placeholder="0000"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setVerificationCode(value);
                    }}
                    maxLength={4}
                    required
                    disabled={loading}
                    className="h-14 text-2xl tracking-[0.4em] text-center font-semibold"
                  />
                  <p className="text-[12px] text-muted-foreground text-center mt-2">
                    Check your spam folder if you don&apos;t see the email
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-9 sm:h-11 text-[13px] sm:text-[14px] font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify and Create Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                {canResend && (
                  <div className="text-center pt-2">
                    <p className="text-[12px] text-muted-foreground mb-2">Didn&apos;t receive the code?</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-[13px] h-9"
                      onClick={() => requestCode(true)}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Resending...
                        </>
                      ) : (
                        'Resend Code'
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </div>
          ) : (
            /* Registration Form */
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-2xl font-bold tracking-tight mb-2">Create your account</h1>
                <p className="text-[14px] text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-slate-900 dark:text-white font-semibold hover:underline underline-offset-4">
                    Sign in
                  </Link>
                </p>
              </div>

              {/* Terms — shown first so both signup methods require it */}
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="agreeTermsTop"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-slate-900 cursor-pointer"
                />
                <label htmlFor="agreeTermsTop" className="text-[12px] text-muted-foreground cursor-pointer select-none leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" className="text-foreground hover:underline underline-offset-2">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" target="_blank" className="text-foreground hover:underline underline-offset-2">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Google button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-9 sm:h-11 text-[13px] font-medium border-border"
                onClick={handleGoogleSignUp}
                disabled={loading || googleLoading || !agreedToTerms}
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <svg className="mr-2.5 h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 text-[11px] text-muted-foreground/60 uppercase tracking-widest font-medium">
                    or continue with email
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1">
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
                      className="h-9 sm:h-11 text-[13px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-[13px] font-medium">Email address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="h-9 sm:h-11 text-[13px]"
                    />
                  </div>

                  <div className="space-y-1">
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

                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-[13px] font-medium">
                      Phone <span className="text-muted-foreground/60 font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={loading}
                      className="h-9 sm:h-11 text-[13px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="location" className="text-[13px] font-medium">
                      Location <span className="text-muted-foreground/60 font-normal">(Optional)</span>
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

                <Button
                  type="submit"
                  className="w-full h-9 sm:h-11 text-[13px] sm:text-[14px] font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 mt-1"
                  disabled={loading || googleLoading || !agreedToTerms}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending verification code...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
