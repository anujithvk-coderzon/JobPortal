'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { signInWithPopup } from 'firebase/auth';
import { Briefcase, Loader2, Eye, EyeOff, ArrowRight, Shield, Target, Users, Sparkles } from 'lucide-react';

import { LogoWhite, Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { authAPI } from '@/lib/api';
import { auth, googleProvider } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';

const LoginPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    const authError = localStorage.getItem('auth_error');
    if (authError) {
      toast({
        title: 'Account Issue',
        description: authError,
        variant: 'destructive',
        duration: 6000,
      });
      localStorage.removeItem('auth_error');
    }
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      const { user, token } = response.data.data;

      setAuth(user, token);

      toast({
        title: 'Welcome back!',
        description: 'You have been logged in successfully.',
      });

      router.push('/');
    } catch (error: any) {
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.error || 'Failed to login. Please try again.';

      toast({
        title: errorCode === 'USER_BLOCKED' || errorCode === 'USER_DELETED' ? 'Account Issue' : 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const response = await authAPI.googleLogin({
        email: user.email,
        name: user.displayName,
        googleId: user.uid,
        profilePhoto: user.photoURL,
      });

      const { user: dbUser, token } = response.data.data;
      setAuth(dbUser, token);

      toast({
        title: 'Welcome back!',
        description: 'You have been logged in successfully with Google.',
      });

      router.push('/');
    } catch (error: any) {
      console.error('Google sign-in error:', error);

      const errorCode = error.response?.data?.code;
      if (errorCode === 'USER_BLOCKED' || errorCode === 'USER_DELETED') {
        toast({
          title: 'Account Issue',
          description: error.response?.data?.error || 'Your account has been blocked or deleted.',
          variant: 'destructive',
          duration: 5000,
        });
        return;
      }

      if (error.response?.data?.isRegistered === false) {
        toast({
          title: 'Account Not Found',
          description: error.response.data.error,
          variant: 'destructive',
          duration: 5000,
        });
        setTimeout(() => {
          router.push('/auth/register');
        }, 2000);
      } else {
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'Failed to sign in with Google. Please try again.',
          variant: 'destructive',
          duration: 5000,
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
        {/* Grid pattern */}
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
                Welcome back to<br />
                <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
                  jobaye
                </span>
              </h2>
              <p className="text-[14px] text-slate-400 leading-relaxed max-w-sm">
                Sign in to access your dashboard, track applications, and discover new opportunities.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: Target, label: 'AI-powered job matching', desc: 'Smart recommendations based on your profile' },
                { icon: Shield, label: 'Application tracking', desc: 'Monitor status and interview updates' },
                { icon: Users, label: 'Professional community', desc: 'Connect with industry professionals' },
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
            <span>Your data is secure and private</span>
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

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Sign in to your account</h1>
            <p className="text-[14px] text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-slate-900 dark:text-white font-semibold hover:underline underline-offset-4">
                Create one
              </Link>
            </p>
          </div>

          {/* Google button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-9 sm:h-11 text-[13px] font-medium border-border"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
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
          <div className="relative my-6">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[13px] font-medium">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
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

            <Button
              type="submit"
              className="w-full h-9 sm:h-11 text-[13px] sm:text-[14px] font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 mt-2"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-[11px] text-center text-muted-foreground/60 mt-8">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
