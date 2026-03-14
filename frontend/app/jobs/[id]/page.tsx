import JobDetailClient from './JobDetailClient';

export const generateMetadata = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/job/${id}`, { cache: 'no-store' });
    const data = await res.json();
    const job = data?.data;
    return {
      title: job ? `${job.title} - jobaye` : 'Job Detail - jobaye',
      description: job?.description?.substring(0, 160) || 'View job details on jobaye',
    };
  } catch {
    return { title: 'Job Detail - jobaye' };
  }
};

const JobDetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  let initialJob = null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/job/${id}`, { cache: 'no-store' });
    const data = await res.json();
    if (data?.success) initialJob = data.data;
  } catch {}
  return <JobDetailClient initialJob={initialJob} jobId={id} />;
};

export default JobDetailPage;
