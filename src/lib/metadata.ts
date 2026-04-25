import type { Metadata } from 'next';

const APP_NAME = 'SmartClass AI';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartclass-ai.vercel.app';

export function buildMetadata({
  title,
  description,
  keywords = [],
  path = '/',
}: {
  title: string;
  description: string;
  keywords?: string[];
  path?: string;
}): Metadata {
  const url = new URL(path, SITE_URL).toString();

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: APP_NAME,
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${APP_NAME} preview`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/opengraph-image`],
    },
  };
}
