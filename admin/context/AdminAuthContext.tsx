'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';

interface AdminAuthContextType {
  admin: any;
  loading: boolean;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  admin: null,
  loading: true,
  logout: async () => {},
});

export const useAdminAuth = () => {
  return useContext(AdminAuthContext);
};

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!checked) {
      checkAuth();
    }
  }, [checked]);

  const checkAuth = async () => {
    const response = await api.getMe();
    if (response.success && response.data) {
      setAdmin(response.data);
    } else {
      router.push('/login');
    }
    setLoading(false);
    setChecked(true);
  };

  const logout = useCallback(async () => {
    await api.logout();
    setAdmin(null);
    router.push('/login');
  }, [router]);

  return (
    <AdminAuthContext.Provider value={{ admin, loading, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
