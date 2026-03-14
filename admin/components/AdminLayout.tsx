'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  FileText,
  Menu,
  X,
  LogOut,
  Shield,
  Flag,
  Trash2,
  UserCog,
  KeyRound,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { api } from '@/lib/api';
import ToastContainer from './Toast';
import { useAdminAuth } from '@/context/AdminAuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const pathname = usePathname();
  const { admin, loading, logout } = useAdminAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && admin) {
      fetchPendingCount();
      fetchFlaggedCount();
      fetchDeletedCount();

      const interval = setInterval(() => {
        fetchPendingCount();
        fetchFlaggedCount();
        fetchDeletedCount();
      }, 30000);

      const handlePostModeration = () => {
        fetchPendingCount();
        fetchFlaggedCount();
        fetchDeletedCount();
      };
      window.addEventListener('post-moderated', handlePostModeration);

      return () => {
        clearInterval(interval);
        window.removeEventListener('post-moderated', handlePostModeration);
      };
    }
  }, [loading, admin]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const fetchPendingCount = async () => {
    const response = await api.getPosts({ status: 'PENDING', limit: 1 }) as { success: boolean; data?: { pagination: { total: number } } };
    if (response.success && response.data?.pagination) {
      setPendingCount(response.data.pagination.total);
    }
  };

  const fetchFlaggedCount = async () => {
    const response = await api.getFlaggedPostsCount() as { success: boolean; data?: { count: number } };
    if (response.success && response.data) {
      setFlaggedCount(response.data.count);
    }
  };

  const fetchDeletedCount = async () => {
    const response = await api.getSoftDeletedPostsCount() as { success: boolean; data?: { count: number } };
    if (response.success && response.data) {
      setDeletedCount(response.data.count);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-[13px] text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null as number | null,
      badgeColor: '',
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      badge: null as number | null,
      badgeColor: '',
    },
    {
      name: 'Posts',
      href: '/posts',
      icon: FileText,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeColor: 'bg-amber-500',
    },
    {
      name: 'Flagged Posts',
      href: '/flagged',
      icon: Flag,
      badge: flaggedCount > 0 ? flaggedCount : null,
      badgeColor: 'bg-destructive',
    },
    {
      name: 'Deleted Posts',
      href: '/deleted',
      icon: Trash2,
      badge: deletedCount > 0 ? deletedCount : null,
      badgeColor: 'bg-muted-foreground',
    },
    ...(admin?.role === 'SUPER_ADMIN'
      ? [
          {
            name: 'Admins',
            href: '/admins',
            icon: UserCog,
            badge: null as number | null,
            badgeColor: '',
          },
        ]
      : []),
    {
      name: 'Change Password',
      href: '/settings',
      icon: KeyRound,
      badge: null as number | null,
      badgeColor: '',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Header */}
      <div
        className={`flex items-center h-14 border-b border-border/60 flex-shrink-0 ${
          collapsed ? 'justify-center px-2' : 'px-4 justify-between'
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          {!collapsed && (
            <>
              <span className="text-sm font-semibold tracking-tight truncate">
                job<span className="text-primary">aye</span>
              </span>
              <span className="text-[11px] text-muted-foreground">Admin</span>
            </>
          )}
          {collapsed && (
            <span className="text-sm font-semibold tracking-tight">
              j<span className="text-primary">a</span>
            </span>
          )}
        </Link>

        {/* Close button - mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Collapse toggle - desktop only */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="h-7 w-7 rounded-md items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors hidden lg:flex"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="flex justify-center py-2 border-b border-border/60 flex-shrink-0">
          <button
            onClick={() => setCollapsed(false)}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Expand sidebar"
            data-tooltip="Expand"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2">
        <div className="space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (collapsed) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  data-tooltip={item.name}
                  className={`relative w-full h-9 rounded-md flex items-center justify-center transition-all duration-150 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.badge !== null && item.badge > 0 && (
                    <span
                      className={`absolute top-0.5 right-1 h-[14px] min-w-[14px] flex items-center justify-center rounded-full ${item.badgeColor} text-[8px] font-bold text-white px-0.5`}
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{item.name}</span>
                {item.badge !== null && item.badge > 0 && (
                  <span
                    className={`min-w-[20px] h-5 flex items-center justify-center rounded-full ${item.badgeColor} text-[10px] font-bold text-white px-1.5`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer - Admin Info */}
      <div className="border-t border-border/60 flex-shrink-0">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1 py-2">
            <div
              className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-semibold text-[13px]"
              data-tooltip={admin?.name || 'Admin'}
            >
              {admin?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <button
              onClick={logout}
              className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Sign out"
              data-tooltip="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="p-2">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-semibold text-[13px] flex-shrink-0">
                {admin?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate leading-tight">
                  {admin?.name || 'Administrator'}
                </p>
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <p className="text-[11px] text-muted-foreground truncate leading-tight">
                    {admin?.role || 'Admin'}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-border/60 bg-card fixed top-0 left-0 h-screen z-40 transition-all duration-200 ease-in-out ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed top-0 left-0 h-screen w-72 bg-card border-r border-border/60 z-50 lg:hidden shadow-2xl">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-200 ease-in-out ${
          collapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        {/* Mobile TopBar */}
        <header className="sticky top-0 z-30 h-12 border-b border-border/60 bg-card/95 backdrop-blur-md flex items-center px-4 sm:px-6 lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};

export default AdminLayout;
