'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Briefcase, Menu, X, User, LogOut, ChevronDown, Building2, Plus, MessageSquarePlus, Bell } from 'lucide-react';
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
import { useToast } from '@/components/ui/use-toast';
import { Logo } from '@/components/common/Logo';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import { authAPI } from '@/lib/api';
import { useCompanies } from '@/hooks/use-companies';
import { useNotifications } from '@/hooks/use-notifications';
import { useDashboardStats } from '@/hooks/use-dashboard';

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

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { companies, isLoading: companiesLoading } = useCompanies();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { stats } = useDashboardStats();
  const pendingApplicationsCount = stats?.pendingApplicationsCount || 0;

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Logout from server failed, but still clear local state
    }
    logout();
    router.push('/');
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await markAsRead(notification.id);

      const noNavigationTypes = ['POST_REJECTED', 'POST_DELETED'];
      if (notification.postId && !noNavigationTypes.includes(notification.type)) {
        router.push(`/community/${notification.postId}`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const NavLink = ({ href, children, badge, className = '' }: { href: string; children: React.ReactNode; badge?: number; className?: string }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`px-3 py-2 text-sm font-medium transition-colors relative ${
          isActive
            ? 'text-primary border-b-2 border-primary'
            : 'text-muted-foreground hover:text-foreground'
        } ${className}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        {children}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 animate-pulse shadow-lg">
            <span className="text-xs font-bold text-white leading-none">
              {badge > 9 ? '9+' : badge}
            </span>
          </span>
        )}
      </Link>
    );
  };

  return (
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="page-container">
        <div className="flex justify-between items-center h-14">
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
              <Logo size={32} />
              <span className="font-bold text-sm lg:text-base tracking-tight truncate">job<span className="text-indigo-500">aye</span></span>
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
                <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/register" className="text-xs sm:text-sm">Get Started</Link>
                </Button>
              </>
            ) : (
              <>
                {/* Unified Post Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="mr-2 h-4 w-4" />
                      <span className="hidden md:inline">Post</span>
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    {/* Share to Community */}
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Share</p>
                    </div>
                    <DropdownMenuItem
                      onClick={() => router.push('/community/create')}
                      className="flex items-center gap-3 py-3 px-3 cursor-pointer"
                    >
                      <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageSquarePlus className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium block text-sm">Share to Community</span>
                        <span className="text-xs text-muted-foreground">Job tips, leads & referrals</span>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Post Official Job */}
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Official Job Post</p>
                    </div>
                    {companiesLoading ? (
                      <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                        Loading companies...
                      </div>
                    ) : companies.length === 0 ? (
                      <>
                        <div className="px-3 py-2">
                          <p className="text-xs text-muted-foreground">
                            Create a company profile to post official jobs
                          </p>
                        </div>
                        <DropdownMenuItem onClick={() => router.push('/company/create')} className="py-3 px-3 cursor-pointer">
                          <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0 ml-3">
                            <span className="font-medium block text-sm">Create Company</span>
                            <span className="text-xs text-muted-foreground">Set up your company profile</span>
                          </div>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        {companies.map((company) => (
                          <DropdownMenuItem
                            key={company.id}
                            onClick={() => router.push(`/company/${company.id}`)}
                            className="flex items-center gap-3 py-3 px-3 cursor-pointer"
                          >
                            {company.logo ? (
                              <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border">
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
                              <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Building2 className="h-5 w-5 text-orange-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="truncate font-medium block text-sm">{company.name}</span>
                              <span className="text-xs text-muted-foreground">View company</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/company/create')} className="py-2.5 px-3 cursor-pointer">
                          <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Add New Company</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Notifications Bell - Always Visible when authenticated */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative h-9 w-9 rounded-full p-0 focus:outline-none flex-shrink-0 hover:bg-accent transition-colors flex items-center justify-center">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 animate-pulse shadow-lg">
                          <span className="text-xs font-bold text-white leading-none">
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
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded flex-shrink-0">
                                    REJECTED
                                  </span>
                                )}
                                {notification.type === 'POST_DELETED' && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded flex-shrink-0">
                                    REMOVED
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{notification.message}</p>
                              <div className="flex items-center justify-between w-full mt-1">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                                <p className="text-xs text-primary/70 italic">
                                  Click to dismiss
                                </p>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </div>
                        <DropdownMenuSeparator />
                        <div className="px-3 py-2 text-center">
                          <p className="text-xs text-muted-foreground">
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
                    <button className="relative h-9 w-9 rounded-full p-0 focus:outline-none flex-shrink-0 transition-colors">
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
          <div className="px-4 sm:px-6 pt-2 pb-3 space-y-1 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <NavLink href="/jobs" className="block min-h-10 py-2.5">Find Jobs</NavLink>
            <NavLink href="/community" className="block min-h-10 py-2.5">Community</NavLink>
            {isAuthenticated && (
              <>
                <NavLink href="/dashboard" badge={pendingApplicationsCount} className="block min-h-10 py-2.5">Dashboard</NavLink>
                <NavLink href="/applications" className="block min-h-10 py-2.5">My Applications</NavLink>
                <NavLink href="/my-page" className="block min-h-10 py-2.5">My Page</NavLink>

                {/* Post Section */}
                <div className="pt-4 pb-2 border-t border-border">
                  <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Post
                  </div>
                  <Link
                    href="/community/create"
                    className="flex items-center gap-2 px-3 py-2.5 min-h-10 rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquarePlus className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-medium truncate">Share to Community</span>
                      <span className="block text-xs text-muted-foreground">Job tips, leads & referrals</span>
                    </div>
                  </Link>
                  {companiesLoading ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Loading...
                    </div>
                  ) : companies.length === 0 ? (
                    <Link
                      href="/company/create"
                      className="flex items-center gap-2 px-3 py-2.5 min-h-10 rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-sm font-medium truncate">Create Company</span>
                        <span className="block text-xs text-muted-foreground">Set up to post official jobs</span>
                      </div>
                    </Link>
                  ) : (
                    <>
                      {companies.map((company) => (
                        <Link
                          key={company.id}
                          href={`/company/${company.id}`}
                          className="flex items-center gap-2 px-3 py-2.5 min-h-10 rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {company.logo ? (
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border">
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
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building2 className="h-4 w-4 text-orange-600" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="block text-sm font-medium truncate">{company.name}</span>
                            <span className="block text-xs text-muted-foreground">Post a job</span>
                          </div>
                        </Link>
                      ))}
                      <Link
                        href="/company/create"
                        className="flex items-center gap-2 px-3 py-2.5 min-h-10 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add New Company</span>
                      </Link>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="py-4 border-t border-border bg-secondary/20">
            {!isAuthenticated ? (
              <div className="px-4 sm:px-6 space-y-2">
                <Button variant="ghost" className="w-full justify-start h-10 text-sm" asChild>
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button className="w-full h-10 text-sm" asChild>
                  <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="px-4 sm:px-6 space-y-2">
                <div className="flex items-center gap-4 px-3 py-2.5 bg-background rounded-lg">
                  <ProfileAvatar user={user} showCompletionRing={true} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{user?.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10 text-sm"
                  onClick={() => {
                    router.push('/profile');
                    setMobileMenuOpen(false);
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
