import CommunityClient from './CommunityClient';

export const metadata = {
  title: 'Community - jobaye',
  description: 'Join the jobaye community. Share job tips, career insights, and connect with professionals.',
};

const CommunityPage = async () => {
  let initialPosts = null;
  let initialPagination = null;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/job-news?page=1&limit=10`,
      { cache: 'no-store' }
    );

    if (response.ok) {
      const json = await response.json();
      initialPosts = json.data?.jobNews ?? null;
      initialPagination = json.data?.pagination ?? null;
    }
  } catch {
    // SSR fetch failed; client will re-fetch
  }

  return (
    <CommunityClient
      initialPosts={initialPosts}
      initialPagination={initialPagination}
    />
  );
};

export default CommunityPage;
