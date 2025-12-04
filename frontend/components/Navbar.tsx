'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import { Briefcase, Menu, X, User, LogOut, ChevronDown, Building2, Plus, MessageSquarePlus, Bell } from 'lucide-react';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { api, notificationAPI } from '@/lib/api';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';

interface Company {
  id: string;
  name: string;
  logo: string | null;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  postId?: string;
  createdAt: string;
  isRead: boolean;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const fetchCompanies = async () => {
    if (!isAuthenticated) return;

    try {
      setCompaniesLoading(true);
      const response = await api.get('/companies');
      if (response.success) {
        setCompanies(response.data.companies);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setCompaniesLoading(false);
    }
  };

  const fetchPendingApplications = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await api.get('/applications/dashboard');
      if (response.success) {
        setPendingApplicationsCount(response.data.pendingApplicationsCount || 0);
      }
    } catch (error) {
      console.error('Error fetching pending applications:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await notificationAPI.getNotifications();
      if (response.data?.success) {
        setNotifications(response.data.data || []);
        setUnreadCount((response.data.data || []).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      await notificationAPI.markAsRead(notification.id);

      // Remove from list
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Don't navigate for rejected or deleted posts (they no longer exist)
      // Only navigate to post if it exists and is NOT a rejection/deletion notification
      const noNavigationTypes = ['POST_REJECTED', 'POST_DELETED'];
      if (notification.postId && !noNavigationTypes.includes(notification.type)) {
        router.push(`/community/${notification.postId}`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCompanies();
      fetchPendingApplications();
      fetchNotifications();

      // Refresh counts every 30 seconds
      const interval = setInterval(() => {
        fetchPendingApplications();
        fetchNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const NavLink = ({ href, children, badge, className = '' }: { href: string; children: React.ReactNode; badge?: number; className?: string }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-foreground hover:bg-accent hover:text-accent-foreground'
        } ${className}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        {children}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 animate-pulse shadow-lg">
            <span className="text-[8px] font-bold text-white leading-none">
              {badge > 9 ? '9+' : badge}
            </span>
          </span>
        )}
      </Link>
    );
  };

  return (
    <nav className="border-b bg-background sticky top-0 z-50 shadow-sm">
      <div className="w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Left: Logo + Desktop Navigation */}
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {/* Hamburger - Show only on mobile/tablet when nav is hidden */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className="h-9 w-9 flex-shrink-0 lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Link href="/" className="flex items-center gap-2 mr-4">
              <Briefcase className="h-6 w-6 sm:h-7 sm:w-7 text-primary flex-shrink-0" />
              <span className="font-bold text-base sm:text-lg truncate">Job Portal</span>
            </Link>

            {/* Desktop Navigation - Visible on large screens */}
            {isAuthenticated && (
              <div className="hidden lg:flex items-center gap-1">
                <NavLink href="/jobs">Find Jobs</NavLink>
                <NavLink href="/community">Community</NavLink>
                <NavLink href="/dashboard" badge={pendingApplicationsCount}>Dashboard</NavLink>
                <NavLink href="/applications">My Applications</NavLink>
                <NavLink href="/my-page">My Page</NavLink>
              </div>
            )}
          </div>

          {/* Right: Action Buttons + Profile */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isAuthenticated ? (
              <>
                <Button variant="ghost" asChild className="hidden sm:flex">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </>
            ) : (
              <>
                {/* Share to Community Button - Progressive Display */}
                {/* XL: Full text */}
                <Button
                  onClick={() => router.push('/community/create')}
                  size="sm"
                  className="hidden xl:flex bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <MessageSquarePlus className="mr-2 h-4 w-4" />
                  Share to Community
                </Button>
                {/* SM-LG: Icon only */}
                <Button
                  onClick={() => router.push('/community/create')}
                  size="sm"
                  className="hidden sm:flex xl:hidden bg-blue-600 hover:bg-blue-700 text-white"
                  title="Share to Community"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                </Button>

                {/* Companies & Jobs Dropdown - Progressive Display */}
                {/* XL: Full text */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden xl:flex border-orange-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300">
                      <Building2 className="mr-2 h-4 w-4 text-orange-600" />
                      Companies & Jobs
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    {companiesLoading ? (
                      <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                        Loading companies...
                      </div>
                    ) : companies.length === 0 ? (
                      <>
                        <div className="px-3 py-3 bg-orange-50/50">
                          <p className="text-xs font-semibold text-orange-900 uppercase tracking-wider mb-2">
                            Get Started
                          </p>
                          <p className="text-sm text-orange-700 mb-3">
                            Create a company profile to start posting official job openings
                          </p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/company/create')} className="py-3">
                          <Plus className="mr-2 h-4 w-4 text-orange-600" />
                          <span className="font-medium">Create Your First Company</span>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <div className="px-3 py-2 bg-orange-50/50">
                          <p className="text-xs font-semibold text-orange-900 uppercase tracking-wider">
                            My Companies
                          </p>
                        </div>
                        {companies.map((company) => (
                          <DropdownMenuItem
                            key={company.id}
                            onClick={() => router.push(`/company/${company.id}`)}
                            className="flex items-center gap-3 py-3 px-3"
                          >
                            {company.logo ? (
                              <div className="relative w-9 h-9 rounded overflow-hidden flex-shrink-0 border border-orange-100">
                                <Image
                                  src={company.logo}
                                  alt={company.name}
                                  fill
                                  className="object-cover"
                                  referrerPolicy="no-referrer"
                                  crossOrigin="anonymous"
                                />
                              </div>
                            ) : (
                              <div className="w-9 h-9 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                                <Building2 className="h-5 w-5 text-orange-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="truncate font-medium block text-sm">{company.name}</span>
                              <span className="text-xs text-muted-foreground">Manage & Post Jobs</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/company/create')} className="py-3">
                          <Plus className="mr-2 h-4 w-4 text-orange-600" />
                          <span>Create New Company</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* MD-LG: Short text */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden md:flex xl:hidden border-orange-200 hover:bg-orange-50" title="Companies & Jobs">
                      <Building2 className="mr-2 h-4 w-4 text-orange-600" />
                      Companies
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    {companiesLoading ? (
                      <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                        Loading companies...
                      </div>
                    ) : companies.length === 0 ? (
                      <>
                        <div className="px-3 py-3 bg-orange-50/50">
                          <p className="text-xs font-semibold text-orange-900 uppercase tracking-wider mb-2">
                            Get Started
                          </p>
                          <p className="text-sm text-orange-700 mb-3">
                            Create a company profile to start posting official job openings
                          </p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/company/create')} className="py-3">
                          <Plus className="mr-2 h-4 w-4 text-orange-600" />
                          <span className="font-medium">Create Your First Company</span>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <div className="px-3 py-2 bg-orange-50/50">
                          <p className="text-xs font-semibold text-orange-900 uppercase tracking-wider">
                            My Companies
                          </p>
                        </div>
                        {companies.map((company) => (
                          <DropdownMenuItem
                            key={company.id}
                            onClick={() => router.push(`/company/${company.id}`)}
                            className="flex items-center gap-3 py-3 px-3"
                          >
                            {company.logo ? (
                              <div className="relative w-9 h-9 rounded overflow-hidden flex-shrink-0 border border-orange-100">
                                <Image
                                  src={company.logo}
                                  alt={company.name}
                                  fill
                                  className="object-cover"
                                  referrerPolicy="no-referrer"
                                  crossOrigin="anonymous"
                                />
                              </div>
                            ) : (
                              <div className="w-9 h-9 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                                <Building2 className="h-5 w-5 text-orange-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="truncate font-medium block text-sm">{company.name}</span>
                              <span className="text-xs text-muted-foreground">Manage & Post Jobs</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/company/create')} className="py-3">
                          <Plus className="mr-2 h-4 w-4 text-orange-600" />
                          <span>Create New Company</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* SM: Icon only */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden sm:flex md:hidden border-orange-200 hover:bg-orange-50" title="Companies & Jobs">
                      <Building2 className="h-4 w-4 text-orange-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    {companiesLoading ? (
                      <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                        Loading companies...
                      </div>
                    ) : companies.length === 0 ? (
                      <>
                        <div className="px-3 py-3 bg-orange-50/50">
                          <p className="text-xs font-semibold text-orange-900 uppercase tracking-wider mb-2">
                            Get Started
                          </p>
                          <p className="text-sm text-orange-700 mb-3">
                            Create a company profile to start posting official job openings
                          </p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/company/create')} className="py-3">
                          <Plus className="mr-2 h-4 w-4 text-orange-600" />
                          <span className="font-medium">Create Your First Company</span>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <div className="px-3 py-2 bg-orange-50/50">
                          <p className="text-xs font-semibold text-orange-900 uppercase tracking-wider">
                            My Companies
                          </p>
                        </div>
                        {companies.map((company) => (
                          <DropdownMenuItem
                            key={company.id}
                            onClick={() => router.push(`/company/${company.id}`)}
                            className="flex items-center gap-3 py-3 px-3"
                          >
                            {company.logo ? (
                              <div className="relative w-9 h-9 rounded overflow-hidden flex-shrink-0 border border-orange-100">
                                <Image
                                  src={company.logo}
                                  alt={company.name}
                                  fill
                                  className="object-cover"
                                  referrerPolicy="no-referrer"
                                  crossOrigin="anonymous"
                                />
                              </div>
                            ) : (
                              <div className="w-9 h-9 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                                <Building2 className="h-5 w-5 text-orange-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="truncate font-medium block text-sm">{company.name}</span>
                              <span className="text-xs text-muted-foreground">Manage & Post Jobs</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/company/create')} className="py-3">
                          <Plus className="mr-2 h-4 w-4 text-orange-600" />
                          <span>Create New Company</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Notifications Bell - Always Visible when authenticated */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex-shrink-0 hover:bg-accent transition-colors flex items-center justify-center">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 animate-pulse shadow-lg">
                          <span className="text-[10px] font-bold text-white leading-none">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80" align="end">
                    <DropdownMenuLabel>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length === 0 ? (
                      <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                        No notifications
                      </div>
                    ) : (
                      <>
                        <div className="max-h-[400px] overflow-y-auto">
                          {notifications.map((notification) => (
                            <DropdownMenuItem
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className="flex flex-col items-start gap-1 py-3 px-3 cursor-pointer hover:bg-accent focus:bg-accent"
                            >
                              <div className="flex items-start justify-between w-full gap-2">
                                <p className="text-sm font-medium leading-tight">{notification.title}</p>
                                {notification.type === 'POST_REJECTED' && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-semibold rounded flex-shrink-0">
                                    REJECTED
                                  </span>
                                )}
                                {notification.type === 'POST_DELETED' && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-semibold rounded flex-shrink-0">
                                    REMOVED
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{notification.message}</p>
                              <div className="flex items-center justify-between w-full mt-1">
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                                <p className="text-[9px] text-primary/70 italic">
                                  Click to dismiss
                                </p>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </div>
                        <DropdownMenuSeparator />
                        <div className="px-3 py-2 text-center">
                          <p className="text-[10px] text-muted-foreground">
                            Click any notification to mark as read
                          </p>
                        </div>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu - Always Visible */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex-shrink-0">
                      <ProfileAvatar user={user} showCompletionRing={true} size="sm" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none truncate">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Hamburger Menu - Mobile/Tablet Only */}
      {mobileMenuOpen && (
        <div className="border-t bg-background shadow-lg lg:hidden">
          <div className="px-2 sm:px-3 pt-2 pb-3 space-y-0.5 max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto">
            <NavLink href="/jobs" className="block py-2.5">Find Jobs</NavLink>
            <NavLink href="/community" className="block py-2.5">Community</NavLink>
            {isAuthenticated && (
              <>
                <NavLink href="/dashboard" badge={pendingApplicationsCount} className="block py-2.5">Dashboard</NavLink>
                <NavLink href="/applications" className="block py-2.5">My Applications</NavLink>
                <NavLink href="/my-page" className="block py-2.5">My Page</NavLink>

                {/* Share to Community */}
                <div className="pt-3 pb-2">
                  <div className="px-3 sm:px-4 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1.5">
                    Community
                  </div>
                  <Link
                    href="/community/create"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageSquarePlus className="h-4 w-4" />
                    Share to Community
                  </Link>
                </div>

                {/* Companies & Jobs */}
                <div className="pt-2 pb-2 border-t">
                  <div className="px-3 sm:px-4 text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1.5">
                    Companies & Jobs
                  </div>
                  {companiesLoading ? (
                    <div className="px-3 sm:px-4 py-2 text-sm text-muted-foreground">
                      Loading...
                    </div>
                  ) : companies.length === 0 ? (
                    <div className="px-3 sm:px-4 py-2">
                      <p className="text-xs text-muted-foreground mb-2">
                        Create a company to start posting jobs
                      </p>
                      <NavLink href="/company/create">
                        <Plus className="inline-block h-4 w-4 mr-2" />
                        Create Company
                      </NavLink>
                    </div>
                  ) : (
                    <>
                      {companies.map((company) => (
                        <Link
                          key={company.id}
                          href={`/company/${company.id}`}
                          className="flex items-center gap-2.5 px-3 sm:px-4 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {company.logo ? (
                            <div className="relative w-7 h-7 rounded overflow-hidden flex-shrink-0">
                              <Image
                                src={company.logo}
                                alt={company.name}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                              />
                            </div>
                          ) : (
                            <div className="w-7 h-7 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                              <Building2 className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                          <span className="truncate">{company.name}</span>
                        </Link>
                      ))}
                      <NavLink href="/company/create">
                        <Plus className="inline-block h-4 w-4 mr-2" />
                        Create New Company
                      </NavLink>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="py-3 border-t bg-secondary/20">
            {!isAuthenticated ? (
              <div className="px-2 sm:px-3 space-y-2">
                <Button variant="ghost" className="w-full justify-start h-10 sm:h-11 text-sm sm:text-base" asChild>
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button className="w-full h-10 sm:h-11 text-sm sm:text-base" asChild>
                  <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="px-2 sm:px-3 space-y-2">
                <div className="flex items-center px-3 py-2.5 bg-background rounded-lg">
                  <ProfileAvatar user={user} showCompletionRing={true} size="md" />
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{user?.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10 sm:h-11 text-sm sm:text-base"
                  onClick={() => {
                    router.push('/profile');
                    setMobileMenuOpen(false);
                  }}
                >
                  <User className="mr-2.5 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Profile Settings</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10 sm:h-11 text-sm sm:text-base text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="mr-2.5 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Log out</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
