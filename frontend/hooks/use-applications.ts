import useSWR from 'swr';

import { applicationAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export const useMyApplications = (params?: Record<string, any>) => {
  const { isAuthenticated } = useAuthStore();
  const key = params
    ? `/applications/my-applications?${new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
      ).toString()}`
    : '/applications/my-applications';

  return useSWR(
    isAuthenticated ? key : null,
    async () => {
      const response = await applicationAPI.getMyApplications(params);
      return response.data?.data;
    }
  );
};

export const useJobApplications = (jobId: string | null, params?: Record<string, any>) => {
  const key = params
    ? `/applications/job/${jobId}?${new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
      ).toString()}`
    : `/applications/job/${jobId}`;

  return useSWR(
    jobId ? key : null,
    async () => {
      const response = await applicationAPI.getJobApplications(jobId!, params);
      return response.data?.data;
    }
  );
};
