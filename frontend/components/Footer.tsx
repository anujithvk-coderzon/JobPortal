'use client';

import Link from 'next/link';
import { Scale, Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Job Posting Platform. All rights reserved.
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <Shield className="h-3.5 w-3.5" />
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <Scale className="h-3.5 w-3.5" />
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
