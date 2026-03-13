'use client';

import { AdminAuthProvider } from '@/context/AdminAuthContext';
import AdminLayout from '@/components/AdminLayout';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AdminAuthProvider>
  );
}
