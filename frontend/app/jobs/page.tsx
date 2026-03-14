import JobsClient from './JobsClient';

export const metadata = {
  title: 'Browse Jobs - jobaye',
  description: 'Find your next career opportunity. Browse thousands of job listings on jobaye.',
};

const JobsPage = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) => {
  const params = await searchParams;
  let initialJobs = null;
  let initialPagination = null;

  try {
    const queryParams = new URLSearchParams();
    queryParams.set('page', '1');
    queryParams.set('limit', '10');
    if (params.search) queryParams.set('search', String(params.search));
    if (params.location) queryParams.set('location', String(params.location));
    if (params.employmentType && params.employmentType !== 'ALL') queryParams.set('employmentType', String(params.employmentType));
    if (params.experienceLevel && params.experienceLevel !== 'ALL') queryParams.set('experienceLevel', String(params.experienceLevel));
    if (params.locationType && params.locationType !== 'ALL') queryParams.set('locationType', String(params.locationType));

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs?${queryParams.toString()}`, { cache: 'no-store' });
    const data = await res.json();
    if (data?.success) {
      initialJobs = data.data.jobs;
      initialPagination = data.data.pagination;
    }
  } catch {}

  return <JobsClient initialJobs={initialJobs} initialPagination={initialPagination} />;
};

export default JobsPage;
