'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { Footer } from '@/components/Footer';
import { useAuthStore } from '@/store/authStore';

const NO_SHELL_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot-password'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // No shell for auth pages and landing page when not authenticated
  if (NO_SHELL_ROUTES.some(route => pathname.startsWith(route))) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  if (pathname === '/' && !isAuthenticated) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      <div
        className={`flex flex-col min-h-screen transition-all duration-200 ease-in-out ${
          collapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}
