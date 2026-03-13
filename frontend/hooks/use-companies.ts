import useSWR from 'swr';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Company {
  id: string;
  name: string;
  logo: string | null;
  _count?: { jobs: number };
}

export function useCompanies() {
  const { isAuthenticated } = useAuthStore();

  const swr = useSWR<Company[]>(
    isAuthenticated ? '/companies' : null,
    async () => {
      const response = await api.get('/companies');
      return response.data?.companies || [];
    },
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  return {
    ...swr,
    companies: swr.data || [],
    isLoading: swr.isLoading,
  };
}

export function useCompany(companyId: string | null) {
  return useSWR(
    companyId ? `/companies/${companyId}` : null,
    async () => {
      const response = await api.get(`/companies/${companyId}`);
      return response.data;
    }
  );
}
