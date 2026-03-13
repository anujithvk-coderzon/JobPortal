'use client';

import Link from 'next/link';
import { Scale, Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-auto">
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground/60 order-2 sm:order-1">
            &copy; {new Date().getFullYear()} jobaye
          </p>
          <div className="flex items-center gap-4 order-1 sm:order-2">
            <Link
              href="/privacy"
              className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors flex items-center gap-1"
            >
              <Shield className="h-3 w-3" />
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors flex items-center gap-1"
            >
              <Scale className="h-3 w-3" />
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
