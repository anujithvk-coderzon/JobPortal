import useSWR from 'swr';

import { jobNewsAPI } from '@/lib/api';

export const useJobNews = (params?: Record<string, any>) => {
  const key = params
    ? `/job-news?${new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
      ).toString()}`
    : '/job-news';

  return useSWR(
    key,
    async () => {
      const response = await jobNewsAPI.getAllJobNews(params);
      return response.data?.data;
    },
    { revalidateOnFocus: true }
  );
};

export const useJobNewsById = (id: string | null) => {
  return useSWR(
    id ? `/job-news/${id}` : null,
    async () => {
      const response = await jobNewsAPI.getJobNewsById(id!);
      return response.data?.data;
    }
  );
};

export const useMyJobNews = (params?: Record<string, any>) => {
  const key = params
    ? `/job-news/user/my-news?${new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
      ).toString()}`
    : '/job-news/user/my-news';

  return useSWR(
    key,
    async () => {
      const response = await jobNewsAPI.getMyJobNews(params);
      return response.data?.data;
    }
  );
};
