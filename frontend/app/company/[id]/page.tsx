import CompanyDetailClient from './CompanyDetailClient';

export const generateMetadata = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/companies/${id}`, { cache: 'no-store' });
    const data = await res.json();
    const company = data?.data;
    return {
      title: company ? `${company.name} - jobaye` : 'Company - jobaye',
      description: company?.description?.substring(0, 160) || 'View company profile on jobaye',
    };
  } catch {
    return { title: 'Company - jobaye' };
  }
};

const CompanyDetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  let initialCompany = null;
  let initialJobs = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/companies/${id}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      initialCompany = data?.data?.company || data?.data || null;
    }
  } catch (error) {
    console.error('Error fetching company data for SSR:', error);
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/company/${id}?page=1&limit=5`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      initialJobs = data?.data?.jobs || null;
    }
  } catch (error) {
    console.error('Error fetching company jobs for SSR:', error);
  }

  return <CompanyDetailClient initialCompany={initialCompany} initialJobs={initialJobs} />;
};

export default CompanyDetailPage;
