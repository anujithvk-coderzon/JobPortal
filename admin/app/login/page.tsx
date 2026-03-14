'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Target, Users, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const response = await api.checkSetupStatus();
      if (response.success && response.data?.setupRequired) {
        setIsSetupMode(true);
      }
    } catch (err) {
      // If check fails, default to login mode
    } finally {
      setCheckingSetup(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSetupMode) {
        if (!name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        const response = await api.register(email, password, name.trim());

        if (response.success) {
          router.push('/dashboard');
        } else {
          setError(response.error || 'Registration failed');
        }
      } else {
        const response = await api.login(email, password);

        if (response.success) {
          router.push('/dashboard');
        } else {
          setError(response.error || 'Login failed');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_60%)]" />

        <div className="relative flex flex-col justify-between p-10 w-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-[17px] tracking-tight text-white">job<span className="text-indigo-300">aye</span> <span className="text-slate-400 font-normal text-[14px]">Admin</span></span>
          </div>

          {/* Hero content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight leading-tight mb-3">
                Welcome back to<br />
                <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
                  jobaye Admin
                </span>
              </h2>
              <p className="text-[14px] text-slate-400 leading-relaxed max-w-sm">
                Sign in to manage users, moderate content, and monitor platform activity.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: Target, label: 'Real-time monitoring', desc: 'Track platform metrics and user activity' },
                { icon: Shield, label: 'Content moderation', desc: 'Review and approve community posts' },
                { icon: Users, label: 'User management', desc: 'Comprehensive tools for managing accounts' },
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
            <span>Secure admin access</span>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-6">
            <span className="font-bold text-[17px] tracking-tight">job<span className="text-indigo-500">aye</span> <span className="text-muted-foreground font-normal text-[14px]">Admin</span></span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1.5">
              {isSetupMode ? 'Create admin account' : 'Sign in to your account'}
            </h1>
            <p className="text-[14px] text-muted-foreground">
              {isSetupMode
                ? 'Set up your first admin account to get started'
                : 'Access the admin dashboard'}
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-lg border bg-card p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Error Alert */}
              {error && (
                <div className="rounded-lg border-red-200 bg-red-50 border p-3 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[13px] text-red-700">{error}</p>
                </div>
              )}

              {/* Setup Mode Info */}
              {isSetupMode && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                  <p className="text-[13px] text-indigo-800">
                    No admin accounts found. The first account will have <strong>Super Admin</strong> privileges.
                  </p>
                </div>
              )}

              {/* Name Field - Only in setup mode */}
              {isSetupMode && (
                <div className="space-y-1">
                  <label htmlFor="name" className="text-[13px] font-medium">
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Your name"
                  />
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1">
                <label htmlFor="email" className="text-[13px] font-medium">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="admin@example.com"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label htmlFor="password" className="text-[13px] font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] pr-10 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={isSetupMode ? 'Min 6 characters' : 'Enter your password'}
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-9 sm:h-10 inline-flex items-center justify-center rounded-md bg-slate-900 text-[13px] sm:text-[14px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSetupMode ? 'Creating account...' : 'Signing in...'}
                  </>
                ) : (
                  isSetupMode ? 'Create Super Admin Account' : 'Sign in'
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-[11px] text-center text-muted-foreground mt-8">
            This is a secure area. All access attempts are logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
