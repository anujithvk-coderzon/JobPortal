'use client';

import { AdminAuthProvider } from '@/context/AdminAuthContext';
import AdminLayout from '@/components/AdminLayout';

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AdminAuthProvider>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AdminAuthProvider>
  );
};

export default ProtectedLayout;
