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

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'JOB_SEEKER', // Default role for all users
    phone: '',
    location: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await authAPI.register(registerData);
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
        description: error.response?.data?.error || 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

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
