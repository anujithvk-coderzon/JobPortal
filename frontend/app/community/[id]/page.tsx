import type { Metadata } from 'next';

import PostDetailClient from './PostDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { id } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/job-news/${id}`,
      { cache: 'no-store' }
    );

    if (response.ok) {
      const json = await response.json();
      const post = json.data;

      if (post) {
        return {
          title: `${post.title} - Community - jobaye`,
          description: post.description?.slice(0, 160) || 'View this community post on jobaye.',
        };
      }
    }
  } catch {
    // Fallback metadata below
  }

  return {
    title: 'Community Post - jobaye',
    description: 'View this community post on jobaye.',
  };
};

const PostDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;

  let initialPost = null;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/job-news/${id}`,
      { cache: 'no-store' }
    );

    if (response.ok) {
      const json = await response.json();
      initialPost = json.data ?? null;
    }
  } catch {
    // SSR fetch failed; client will re-fetch
  }

  return <PostDetailClient initialPost={initialPost} />;
};

export default PostDetailPage;
