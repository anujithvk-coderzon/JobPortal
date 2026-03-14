'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  UserX,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  Flag,
  Loader2,
  ArrowRight,
  AlertTriangle,
  Activity,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAdminAuth } from '@/context/AdminAuthContext';

const DashboardPage = () => {
  const [stats, setStats] = useState<any>(null);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { admin } = useAdminAuth();

  useEffect(() => {
    fetchStats();
    fetchFlaggedCount();
  }, []);

  const fetchStats = async () => {
    const response = await api.getStats();
    if (response.success && response.data) {
      setStats(response.data);
    }
    setLoading(false);
  };

  const fetchFlaggedCount = async () => {
    const response = await api.getFlaggedPostsCount() as { success: boolean; data?: { count: number } };
    if (response.success && response.data) {
      setFlaggedCount(response.data.count);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const adminName = admin?.name || '';

  const pendingCount = stats?.posts?.pending || 0;
  const totalUsers = stats?.users?.total || 0;
  const activeUsers = stats?.users?.active || 0;
  const blockedUsers = stats?.users?.blocked || 0;
  const deletedUsers = stats?.users?.deleted || 0;
  const totalPosts = stats?.posts?.total || 0;
  const approvedPosts = stats?.posts?.approved || 0;

  const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const approvalRate = totalPosts > 0 ? Math.round((approvedPosts / totalPosts) * 100) : 0;

  const needsAttention = pendingCount > 0 || flaggedCount > 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <>
      <div className="space-y-5 max-w-[1400px]">
        {/* Welcome Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            {getGreeting()}{adminName ? `, ${adminName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Here&apos;s what&apos;s happening on your platform today.
          </p>
        </div>

        {/* Attention Banner */}
        {needsAttention && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3.5 flex items-start gap-3">
            <div className="h-8 w-8 rounded-md bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-amber-900">Items need your attention</p>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                {pendingCount > 0 && (
                  <Link href="/posts" className="inline-flex items-center gap-1.5 text-[12px] text-amber-700 hover:text-amber-900 font-medium transition-colors">
                    <Clock className="h-3.5 w-3.5" />
                    {pendingCount} pending {pendingCount === 1 ? 'post' : 'posts'}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
                {flaggedCount > 0 && (
                  <Link href="/flagged" className="inline-flex items-center gap-1.5 text-[12px] text-red-700 hover:text-red-900 font-medium transition-colors">
                    <Flag className="h-3.5 w-3.5" />
                    {flaggedCount} flagged {flaggedCount === 1 ? 'post' : 'posts'}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-md bg-blue-500/8 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-[12px] text-gray-500">Total Users</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{totalUsers.toLocaleString()}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] text-green-600 font-medium">{activeRate}% active</span>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-md bg-purple-500/8 flex items-center justify-center">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-[12px] text-gray-500">Total Posts</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{totalPosts.toLocaleString()}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] text-green-600 font-medium">{approvalRate}% approved</span>
            </div>
          </div>

          <Link href="/posts" className="rounded-lg border bg-white p-4 hover:border-amber-300 transition-colors group">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-md bg-amber-500/8 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-[12px] text-gray-500">Pending Review</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{pendingCount.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-[11px] text-amber-600 font-medium group-hover:underline">Review now</span>
              <ArrowRight className="h-3 w-3 text-amber-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </div>
          </Link>

          <Link href="/flagged" className="rounded-lg border bg-white p-4 hover:border-red-300 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-red-500/8 flex items-center justify-center">
                  <Flag className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-[12px] text-gray-500">Flagged</span>
              </div>
              {flaggedCount > 0 && (
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </div>
            <p className="text-2xl font-semibold text-gray-900">{flaggedCount.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <span className={`text-[11px] font-medium group-hover:underline ${flaggedCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {flaggedCount > 0 ? 'Review reports' : 'All clear'}
              </span>
              {flaggedCount > 0 && (
                <ArrowRight className="h-3 w-3 text-red-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              )}
            </div>
          </Link>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* User Breakdown */}
          <div className="rounded-lg border bg-white">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-400" />
                  <h3 className="text-[13px] font-semibold text-gray-900">User Breakdown</h3>
                </div>
                <Link href="/users" className="text-[11px] text-primary hover:text-primary/80 font-medium transition-colors">
                  View all
                </Link>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {/* Active users bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-[13px] text-gray-700">Active</span>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900">{activeUsers.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Blocked users bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <UserX className="h-3.5 w-3.5 text-red-600" />
                    <span className="text-[13px] text-gray-700">Blocked</span>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900">{blockedUsers.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${totalUsers > 0 ? (blockedUsers / totalUsers) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Deleted users bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-[13px] text-gray-700">Deleted</span>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900">{deletedUsers.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-400 rounded-full transition-all duration-500"
                    style={{ width: `${totalUsers > 0 ? (deletedUsers / totalUsers) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Post Breakdown */}
          <div className="rounded-lg border bg-white">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <h3 className="text-[13px] font-semibold text-gray-900">Post Breakdown</h3>
                </div>
                <Link href="/posts" className="text-[11px] text-primary hover:text-primary/80 font-medium transition-colors">
                  View all
                </Link>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {/* Approved bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-[13px] text-gray-700">Approved</span>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900">{approvedPosts.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${totalPosts > 0 ? (approvedPosts / totalPosts) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Pending bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-[13px] text-gray-700">Pending</span>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900">{pendingCount.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${totalPosts > 0 ? (pendingCount / totalPosts) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Flagged bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-[13px] text-gray-700">Flagged</span>
                  </div>
                  <span className={`text-[13px] font-semibold ${flaggedCount > 0 ? 'text-red-700' : 'text-gray-900'}`}>{flaggedCount.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${totalPosts > 0 ? (flaggedCount / totalPosts) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-[13px] font-semibold text-gray-900 mb-2.5">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Link
              href="/posts"
              className="rounded-lg border bg-white p-3.5 flex items-center gap-3 hover:border-gray-300 transition-colors group"
            >
              <div className="h-9 w-9 rounded-md bg-amber-500/8 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-900">Moderate Posts</p>
                <p className="text-[11px] text-gray-500">Review pending content</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
            </Link>

            <Link
              href="/users"
              className="rounded-lg border bg-white p-3.5 flex items-center gap-3 hover:border-gray-300 transition-colors group"
            >
              <div className="h-9 w-9 rounded-md bg-blue-500/8 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-900">Manage Users</p>
                <p className="text-[11px] text-gray-500">View and manage accounts</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
            </Link>

            <Link
              href="/deleted"
              className="rounded-lg border bg-white p-3.5 flex items-center gap-3 hover:border-gray-300 transition-colors group"
            >
              <div className="h-9 w-9 rounded-md bg-gray-500/8 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-900">Deleted Posts</p>
                <p className="text-[11px] text-gray-500">Restore or permanently remove</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
