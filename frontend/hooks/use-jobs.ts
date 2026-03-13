import useSWR from 'swr';
import { jobAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function useJobs(params?: Record<string, any>) {
  const key = params
    ? `/jobs?${new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
      ).toString()}`
    : '/jobs';

  return useSWR(
    key,
    async () => {
      const response = await jobAPI.getAllJobs(params);
      return response.data?.data;
    },
    { revalidateOnFocus: false }
  );
}

export function useJob(jobId: string | null) {
  return useSWR(
    jobId ? `/jobs/job/${jobId}` : null,
    async () => {
      const response = await jobAPI.getJobById(jobId!);
      return response.data?.data;
    }
  );
}

export function useSavedJobs(params?: Record<string, any>) {
  const { isAuthenticated } = useAuthStore();
  const key = params
    ? `/jobs/saved?${new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
      ).toString()}`
    : '/jobs/saved';

  return useSWR(
    isAuthenticated ? key : null,
    async () => {
      const response = await jobAPI.getSavedJobs(params);
      return response.data?.data;
    }
  );
}
