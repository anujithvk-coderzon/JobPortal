'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight } from 'lucide-react';

interface AuthGateProps {
  type: 'jobs' | 'posts';
}

export function AuthGate({ type }: AuthGateProps) {
  const label = type === 'jobs' ? 'job listings' : 'community posts';

  return (
    <div className="relative mt-6">
      {/* Fade overlay */}
      <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />

      <div className="border border-border/60 rounded-xl bg-card p-6 sm:p-8 text-center">
        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
          <Lock className="h-4.5 w-4.5 text-muted-foreground" />
        </div>
        <h3 className="text-[15px] font-semibold mb-1">
          Sign up to see more {label}
        </h3>
        <p className="text-[12px] text-muted-foreground mb-5 max-w-sm mx-auto">
          Create a free account to browse all {label}, save favorites, and apply instantly.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <Button size="sm" className="h-9 px-5 text-[13px] font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100" asChild>
            <Link href="/auth/register">
              Create Free Account
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="h-9 text-[13px] text-muted-foreground" asChild>
            <Link href="/auth/login">Already have an account? Log in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
