'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/lib/api';
import {
  Users,
  UserCheck,
  UserX,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  Activity,
  Flag,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users?.total || 0,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Active Users',
      value: stats?.users?.active || 0,
      icon: UserCheck,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Blocked Users',
      value: stats?.users?.blocked || 0,
      icon: UserX,
      gradient: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      trend: '-3%',
      trendUp: false,
    },
    {
      title: 'Deleted Users',
      value: stats?.users?.deleted || 0,
      icon: Trash2,
      gradient: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-600',
      trend: '+2%',
      trendUp: true,
    },
    {
      title: 'Total Posts',
      value: stats?.posts?.total || 0,
      icon: FileText,
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      trend: '+15%',
      trendUp: true,
    },
    {
      title: 'Pending Posts',
      value: stats?.posts?.pending || 0,
      icon: Clock,
      gradient: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Approved Posts',
      value: stats?.posts?.approved || 0,
      icon: CheckCircle2,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      trend: '+18%',
      trendUp: true,
    },
    {
      title: 'Flagged Posts',
      value: flaggedCount,
      icon: Flag,
      gradient: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      trend: '',
      trendUp: false,
      isAlert: flaggedCount > 0,
      href: '/flagged',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Dashboard Overview
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
              Monitor platform statistics and activities
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm">
            <Activity className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Live Data</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {statCards.map((card: any) => {
            const Icon = card.icon;
            const CardWrapper = card.href ? Link : 'div';
            const wrapperProps = card.href ? { href: card.href } : {};

            return (
              <CardWrapper
                key={card.title}
                {...wrapperProps}
                className={`group bg-white rounded-2xl border p-4 sm:p-5 lg:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer ${
                  card.isAlert
                    ? 'border-red-300 bg-red-50/30 hover:border-red-400'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className={`p-2 sm:p-3 ${card.bgColor} rounded-xl group-hover:scale-110 transition-transform duration-300 ${card.isAlert ? 'animate-pulse' : ''}`}>
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.iconColor}`} />
                  </div>
                  {card.isAlert && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 text-red-700">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-xs font-semibold">Action Needed</span>
                    </div>
                  )}
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                    <p className={`text-2xl sm:text-3xl font-bold ${card.isAlert ? 'text-red-700' : 'text-gray-900'}`}>{card.value.toLocaleString()}</p>
                  </div>
                  {card.href && (
                    <ArrowRight className={`h-5 w-5 ${card.isAlert ? 'text-red-400' : 'text-gray-400'} group-hover:translate-x-1 transition-transform`} />
                  )}
                </div>
              </CardWrapper>
            );
          })}
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Statistics */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">User Statistics</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-700 font-medium">Total Users</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{stats?.users?.total || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-transparent rounded-xl border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <span className="text-gray-700 font-medium">Active Users</span>
                </div>
                <span className="text-lg font-bold text-green-700">{stats?.users?.active || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-transparent rounded-xl border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  <span className="text-gray-700 font-medium">Blocked Users</span>
                </div>
                <span className="text-lg font-bold text-red-700">{stats?.users?.blocked || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  <span className="text-gray-700 font-medium">Deleted Users</span>
                </div>
                <span className="text-lg font-bold text-gray-700">{stats?.users?.deleted || 0}</span>
              </div>
            </div>
          </div>

          {/* Post Statistics */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-50 rounded-xl">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Post Statistics</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-transparent rounded-xl border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-700 font-medium">Total Posts</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{stats?.posts?.total || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-transparent rounded-xl border border-yellow-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
                  <span className="text-gray-700 font-medium">Pending Review</span>
                </div>
                <span className="text-lg font-bold text-yellow-700">{stats?.posts?.pending || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-transparent rounded-xl border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="text-gray-700 font-medium">Approved</span>
                </div>
                <span className="text-lg font-bold text-green-700">{stats?.posts?.approved || 0}</span>
              </div>
              <Link
                href="/flagged"
                className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md ${
                  flaggedCount > 0
                    ? 'bg-gradient-to-r from-red-50 to-red-100/50 border-red-200 hover:border-red-300'
                    : 'bg-gradient-to-r from-gray-50 to-transparent border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${flaggedCount > 0 ? 'bg-red-600 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-gray-700 font-medium">Flagged Posts</span>
                  {flaggedCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                      Needs Review
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${flaggedCount > 0 ? 'text-red-700' : 'text-gray-500'}`}>{flaggedCount}</span>
                  <ArrowRight className={`h-4 w-4 ${flaggedCount > 0 ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
