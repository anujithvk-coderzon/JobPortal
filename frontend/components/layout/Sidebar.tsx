'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Briefcase,
  Search,
  Home,
  LayoutDashboard,
  FileText,
  UserCircle,
  Users,
  Building2,
  Plus,
  MessageSquarePlus,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  MoreHorizontal,
  ChevronRight,
  Bell,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Logo } from '@/components/common/Logo';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { useAuthStore } from '@/store/authStore';
import { useCompanies } from '@/hooks/use-companies';
import { useNotifications } from '@/hooks/use-notifications';

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

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar = ({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [jobPostOpen, setJobPostOpen] = useState(false);

  const { companies, isLoading: companiesLoading } = useCompanies();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const handleLogout = async () => {
    try {
      const { authAPI } = await import('@/lib/api');
      await authAPI.logout();
    } catch {}
    logout();
    router.push('/');
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await markAsRead(notification.id);
      const noNav = ['POST_REJECTED', 'POST_DELETED'];
      if (notification.postId && !noNav.includes(notification.type)) {
        router.push(`/community/${notification.postId}`);
      }
    } catch {}
    onClose();
  };

  const mainNav = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/jobs', icon: Search, label: 'Jobs' },
    { href: '/applications', icon: FileText, label: 'My Applications' },
    { href: '/community', icon: Users, label: 'Community' },
    { href: '/my-page', icon: UserCircle, label: 'My Page' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/jobs') return pathname === '/jobs' || (pathname.startsWith('/jobs/') && !pathname.includes('/applications'));
    if (href === '/community') return pathname === '/community' || pathname.startsWith('/community/');
    if (href === '/applications') return pathname === '/applications' || pathname.startsWith('/applications/');
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/my-page') return pathname === '/my-page';
    return pathname === href;
  };

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  // Collapsed icon with tooltip
  const CollapsedNavButton = ({ icon: Icon, label, active, onClick, badge }: {
    icon: any; label: string; active?: boolean; onClick: () => void; badge?: number;
  }) => (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={`relative w-full h-9 rounded-md flex items-center justify-center transition-all duration-150 ${
              active
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
            {badge !== undefined && badge > 0 && (
              <span className="absolute top-0.5 right-1 h-[14px] min-w-[14px] flex items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground px-0.5">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const content = (
    <div className="flex flex-col h-full select-none">
      {/* ── Header ── */}
      <div className={`flex items-center h-14 border-b border-border/60 flex-shrink-0 ${collapsed ? 'justify-center px-2' : 'px-4 justify-between'}`}>
        <Link href="/" onClick={onClose} className="flex items-center gap-2.5 min-w-0">
          <Logo size={32} />
          {!collapsed && (
            <span className="font-semibold text-[15px] tracking-tight truncate">job<span className="text-indigo-500">aye</span></span>
          )}
        </Link>

        <button
          onClick={onClose}
          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>

        {!collapsed && (
          <button
            onClick={onToggleCollapse}
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
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleCollapse}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Expand sidebar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2">
        {/* Main Nav */}
        <div className="space-y-0.5">
          {(isAuthenticated ? mainNav : mainNav.filter(n => n.href === '/' || n.href === '/jobs' || n.href === '/community')).map((item) => {
            const active = isActive(item.href);
            return collapsed ? (
              <CollapsedNavButton
                key={item.href}
                icon={item.icon}
                label={item.label}
                active={active}
                onClick={() => navigate(item.href)}
              />
            ) : (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-2.5 h-8 rounded-md text-[13px] font-medium transition-all duration-150 ${
                  active
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
                {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>

        {/* ── Notifications (Expanded) ── */}
        {isAuthenticated && !collapsed && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 px-2.5 h-8 rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors">
                  <div className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1.5 h-[14px] min-w-[14px] flex items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground px-0.5">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="ml-auto text-[11px] text-muted-foreground">{unreadCount}</span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-80">
                <DropdownMenuLabel className="font-semibold text-sm">Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <Bell className="h-4 w-4 mx-auto text-muted-foreground/40 mb-1.5" />
                    <p className="text-[12px] text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className="flex flex-col items-start gap-0.5 py-2.5 px-3 cursor-pointer"
                      >
                        <div className="flex items-start justify-between w-full gap-2">
                          <p className="text-[13px] font-medium leading-snug">{n.title}</p>
                          {(n.type === 'POST_REJECTED' || n.type === 'POST_DELETED') && (
                            <span className="px-1.5 py-0.5 bg-destructive/10 text-destructive text-[9px] font-semibold rounded flex-shrink-0 uppercase">
                              {n.type === 'POST_REJECTED' ? 'Rejected' : 'Removed'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60">{new Date(n.createdAt).toLocaleString()}</p>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* ── Notifications (Collapsed) ── */}
        {isAuthenticated && collapsed && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div>
                  <CollapsedNavButton
                    icon={Bell}
                    label={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                    onClick={() => {}}
                    badge={unreadCount}
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-80">
                <DropdownMenuLabel className="font-semibold text-sm">Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <Bell className="h-4 w-4 mx-auto text-muted-foreground/40 mb-1.5" />
                    <p className="text-[12px] text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className="flex flex-col items-start gap-0.5 py-2.5 px-3 cursor-pointer"
                      >
                        <div className="flex items-start justify-between w-full gap-2">
                          <p className="text-[13px] font-medium leading-snug">{n.title}</p>
                          {(n.type === 'POST_REJECTED' || n.type === 'POST_DELETED') && (
                            <span className="px-1.5 py-0.5 bg-destructive/10 text-destructive text-[9px] font-semibold rounded flex-shrink-0 uppercase">
                              {n.type === 'POST_REJECTED' ? 'Rejected' : 'Removed'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60">{new Date(n.createdAt).toLocaleString()}</p>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* ── Create Section (Expanded) ── */}
        {isAuthenticated && !collapsed && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <div className="px-2.5 mb-2">
              <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
                Create Post
              </span>
            </div>

            {/* Community Post */}
            <button
              onClick={() => navigate('/community/create')}
              className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
            >
              <div className="h-5 w-5 rounded bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageSquarePlus className="h-3 w-3 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] font-medium block">Community Post</span>
                <span className="text-[11px] text-muted-foreground/70 leading-tight block">Share job tips, news & alerts</span>
              </div>
            </button>

            {/* Post Official Job — collapsible with companies */}
            <div className="mt-0.5">
              <button
                onClick={() => setJobPostOpen(!jobPostOpen)}
                className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
              >
                <div className="h-5 w-5 rounded bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Briefcase className="h-3 w-3 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[13px] font-medium block">Post Official Job</span>
                  <span className="text-[11px] text-muted-foreground/70 leading-tight block">Post verified jobs from your company</span>
                </div>
                <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200 mt-1 flex-shrink-0 ${jobPostOpen ? 'rotate-90' : ''}`} />
              </button>

              {jobPostOpen && (
                <div className="ml-[30px] mt-0.5 space-y-0.5 border-l border-border/50 pl-2">
                  {companiesLoading ? (
                    <div className="px-2.5 py-2">
                      <div className="h-2 w-20 bg-muted rounded animate-pulse" />
                    </div>
                  ) : companies.length === 0 ? (
                    <>
                      <p className="text-[11px] text-muted-foreground/60 px-2.5 py-1.5 leading-relaxed">
                        Create your company first to post official jobs
                      </p>
                      <button
                        onClick={() => navigate('/company/create')}
                        className="w-full flex items-center gap-2 px-2.5 h-7 rounded-md text-[12px] font-medium text-primary hover:bg-accent/60 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Create Company</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider px-2.5 pt-1 pb-0.5">
                        Companies
                      </p>
                      {companies.map((company) => (
                        <button
                          key={company.id}
                          onClick={() => navigate(`/company/${company.id}`)}
                          className="w-full flex items-center gap-2 px-2.5 h-7 rounded-md text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
                        >
                          {company.logo ? (
                            <div className="relative h-4 w-4 rounded overflow-hidden flex-shrink-0 border border-border/50">
                              <Image src={company.logo} alt={company.name} fill className="object-cover" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                            </div>
                          ) : (
                            <div className="h-4 w-4 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <Building2 className="h-2.5 w-2.5" />
                            </div>
                          )}
                          <span className="truncate">{company.name}</span>
                        </button>
                      ))}
                      <button
                        onClick={() => navigate('/company/create')}
                        className="w-full flex items-center gap-2 px-2.5 h-7 rounded-md text-[12px] text-muted-foreground/60 hover:text-muted-foreground hover:bg-accent/60 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Company</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Create Section (Collapsed) ── */}
        {isAuthenticated && collapsed && (
          <div className="mt-2 pt-2 border-t border-border/60 space-y-0.5">
            <CollapsedNavButton
              icon={MessageSquarePlus}
              label="Community Post"
              onClick={() => navigate('/community/create')}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div>
                  <CollapsedNavButton
                    icon={Briefcase}
                    label="Post Official Job"
                    onClick={() => {}}
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-56">
                <DropdownMenuLabel className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                  Post Official Job
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {companies.length === 0 ? (
                  <>
                    <div className="px-2 py-2">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">Create your company first to post official jobs</p>
                    </div>
                    <DropdownMenuItem onClick={() => navigate('/company/create')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Company
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">
                      Companies
                    </DropdownMenuLabel>
                    {companies.map((c) => (
                      <DropdownMenuItem key={c.id} onClick={() => navigate(`/company/${c.id}`)}>
                        <Building2 className="mr-2 h-4 w-4" />
                        {c.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/company/create')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Company
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

      </nav>

      {/* ── Footer — User ── */}
      <div className="border-t border-border/60 flex-shrink-0">
        {isAuthenticated ? (
          collapsed ? (
            <div className="flex flex-col items-center gap-1 py-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-md p-1 hover:bg-accent transition-colors">
                    <ProfileAvatar user={user} showCompletionRing={false} size="sm" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-52">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="p-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-accent transition-colors">
                    <ProfileAvatar user={user} showCompletionRing={false} size="sm" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[13px] font-medium truncate leading-tight">{user?.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate leading-tight">{user?.email}</p>
                    </div>
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-52">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        ) : (
          <div className={`p-2 space-y-1 ${collapsed ? 'flex flex-col items-center' : ''}`}>
            <Link
              href="/auth/login"
              onClick={onClose}
              className={`flex items-center justify-center rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${collapsed ? 'h-9 w-9' : 'h-8 px-2.5 w-full'}`}
            >
              {collapsed ? 'In' : 'Sign In'}
            </Link>
            <Link
              href="/auth/register"
              onClick={onClose}
              className={`flex items-center justify-center rounded-md text-[13px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors ${collapsed ? 'h-9 w-9' : 'h-8 px-2.5 w-full'}`}
            >
              {collapsed ? 'Go' : 'Get Started'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col border-r border-border/60 bg-card fixed top-0 left-0 h-screen z-40 transition-all duration-200 ease-in-out ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {content}
      </aside>

      {open && (
        <>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
          <aside className="fixed top-0 left-0 h-screen w-72 bg-card border-r border-border/60 z-50 lg:hidden shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
