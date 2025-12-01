import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatSalary(min?: number, max?: number, currency: string = 'USD') {
  if (!min && !max) return 'Not specified';

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  } else if (min) {
    return `From ${formatter.format(min)}`;
  } else if (max) {
    return `Up to ${formatter.format(max)}`;
  }

  return 'Not specified';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function timeAgo(date: string | Date): string {
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
}

// Transform technical error messages to user-friendly messages
export function getUserFriendlyErrorMessage(error: string | undefined, statusCode?: number): string {
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
}
