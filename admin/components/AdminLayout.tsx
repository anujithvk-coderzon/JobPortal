'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import ToastContainer from './Toast';
import {
  LayoutDashboard,
  Users,
  FileText,
  Menu,
  X,
  LogOut,
  Shield,
  Bell,
  ChevronRight,
  Flag,
  Trash2,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchPendingCount();
    fetchFlaggedCount();
    fetchDeletedCount();

    // Refresh counts every 30 seconds
    const interval = setInterval(() => {
      fetchPendingCount();
      fetchFlaggedCount();
      fetchDeletedCount();
    }, 30000);

    // Listen for post moderation events to refresh count immediately
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
  }, []);

  const checkAuth = async () => {
    const response = await api.getMe();
    if (response.success && response.data) {
      setAdmin(response.data);
    } else {
      router.push('/login');
    }
    setLoading(false);
  };

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

  const handleLogout = async () => {
    await api.logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
      badgeColor: null,
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      badge: null,
      badgeColor: null,
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
      badgeColor: 'bg-red-500',
    },
    {
      name: 'Deleted Posts',
      href: '/deleted',
      icon: Trash2,
      badge: deletedCount > 0 ? deletedCount : null,
      badgeColor: 'bg-gray-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Admin Portal</h1>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {sidebarOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="hidden lg:flex items-center gap-3 h-16 px-6 border-b border-gray-200">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Portal</h1>
              <p className="text-xs text-gray-500">Job Posting Platform</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-5 w-5 ${
                        isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <div className={`flex items-center justify-center min-w-[28px] h-[28px] ${item.badgeColor || 'bg-red-500'} rounded-full shadow-lg animate-pulse`}>
                      <span className="text-xs font-bold text-white px-2">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    </div>
                  )}
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-blue-600" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Admin Info & Logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {admin?.name?.[0]?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {admin?.name || 'Administrator'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {admin?.email || 'admin@admin.com'}
                  </p>
                </div>
              </div>
              {admin?.role && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                  <Shield className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-700">
                    {admin.role}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen">
        {/* Top Bar for Desktop */}
        <div className="hidden lg:flex items-center justify-between h-16 px-8 bg-white border-b border-gray-200 sticky top-0 z-30">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {navigation.find((item) => item.href === pathname)?.name || 'Admin Panel'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <Link
                href="/posts"
                className="flex items-center gap-2 px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg border border-yellow-200 transition-colors"
              >
                <Bell className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {pendingCount} pending post{pendingCount !== 1 ? 's' : ''}
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          {children}
        </main>
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
