'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { Briefcase, Menu, X, User, LogOut, PlusCircle, ChevronDown, Newspaper, Building2 } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`block px-4 py-3 rounded-md text-sm md:text-base font-medium transition-colors ${
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-foreground hover:bg-accent hover:text-accent-foreground'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        {children}
      </Link>
    );
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Briefcase className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">Job Portal</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex md:ml-10 md:space-x-2">
              <NavLink href="/jobs">Find Jobs</NavLink>
              <NavLink href="/community">Community</NavLink>
              {isAuthenticated && (
                <>
                  <NavLink href="/dashboard">Dashboard</NavLink>
                  <NavLink href="/applications">My Applications</NavLink>
                </>
              )}
            </div>
          </div>

          {/* Desktop Auth Buttons / User Menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {!isAuthenticated ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </>
            ) : (
              <>
                {/* Post Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Post
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => router.push('/community/create')}>
                      <Newspaper className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Create Post</span>
                        <span className="text-xs text-muted-foreground">Share articles, tips, or job leads</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/jobs/post')}>
                      <Building2 className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Post Official Job</span>
                        <span className="text-xs text-muted-foreground">Post on behalf of a company</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar>
                        <AvatarImage
                          src={user?.profilePhoto ? `http://localhost:5001${user.profilePhoto}` : undefined}
                          alt={user?.name}
                        />
                        <AvatarFallback>{getInitials(user?.name || 'U')}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
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

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background shadow-lg">
          <div className="px-3 pt-3 pb-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <NavLink href="/jobs">Find Jobs</NavLink>
            <NavLink href="/community">Community</NavLink>
            {isAuthenticated && (
              <>
                <NavLink href="/dashboard">Dashboard</NavLink>
                <NavLink href="/applications">My Applications</NavLink>
                <div className="pt-2 pb-2">
                  <div className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Create
                  </div>
                  <NavLink href="/jobs/post">Post Official Job</NavLink>
                  <NavLink href="/community/create">Create Post</NavLink>
                </div>
              </>
            )}
          </div>
          <div className="pt-3 pb-4 border-t bg-secondary/20">
            {!isAuthenticated ? (
              <div className="px-3 space-y-2">
                <Button variant="ghost" className="w-full justify-start h-11" asChild>
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button className="w-full h-11" asChild>
                  <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="px-3 space-y-2">
                <div className="flex items-center px-3 py-3 bg-background rounded-lg">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage
                      src={user?.profilePhoto ? `http://localhost:5001${user.profilePhoto}` : undefined}
                      alt={user?.name}
                    />
                    <AvatarFallback className="text-base">{getInitials(user?.name || 'U')}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{user?.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-11"
                  onClick={() => {
                    router.push('/profile');
                    setMobileMenuOpen(false);
                  }}
                >
                  <User className="mr-3 h-5 w-5" />
                  <span>Profile</span>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="mr-3 h-5 w-5" />
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
