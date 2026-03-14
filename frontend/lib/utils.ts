import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatSalary = (min?: number, max?: number, currency: string = 'INR', period: string = 'LPA') => {
  if (!min && !max) return 'Not specified';

  // Treat legacy 'YEARLY' / 'YEARLY_CTC' values as LPA / CTC
  const fmt = period === 'YEARLY' ? 'LPA' : period === 'YEARLY_CTC' ? 'CTC' : period;

  if (fmt === 'LPA') {
    if (min) return `₹${min} LPA`;
    return 'Not specified';
  }

  if (fmt === 'CTC') {
    if (min) return `₹${min}L CTC`;
    return 'Not specified';
  }

  // Monthly format - show range with ₹ symbol
  const formatNum = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  if (min && max) {
    return `${formatNum(min)} - ${formatNum(max)} /month`;
  } else if (min) {
    return `From ${formatNum(min)} /month`;
  } else if (max) {
    return `Up to ${formatNum(max)} /month`;
  }

  return 'Not specified';
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const timeAgo = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    return formatDate(date);
  }
};

// Transform technical error messages to user-friendly messages
export const getUserFriendlyErrorMessage = (error: string | undefined, statusCode?: number): string => {
  if (!error) {
    return 'Something went wrong. Please try again.';
  }

  const errorLower = error.toLowerCase();

  // Authentication related errors
  if (errorLower.includes('no token') || errorLower.includes('token provided')) {
    return 'Please log in to continue.';
  }
  if (errorLower.includes('invalid token') || errorLower.includes('expired token')) {
    return 'Your session has expired. Please log in again.';
  }
  if (errorLower.includes('unauthorized') || statusCode === 401) {
    return 'Please log in to continue.';
  }

  // Network related errors
  if (errorLower.includes('network') || errorLower.includes('connection')) {
    return 'Connection error. Please check your internet and try again.';
  }
  if (errorLower.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Server errors
  if (statusCode && statusCode >= 500) {
    return 'Server error. Please try again later.';
  }

  // Return original message if it's already user-friendly
  return error;
};
