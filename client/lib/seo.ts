import { Metadata } from 'next';

const FALLBACK_SEO: Metadata = {
  title: `${process.env.NEXT_PUBLIC_COMPANY_NAME || "NavArt"} | Premium Packaging Solutions`,
  description: "High-quality custom printed packaging and corrugated boxes.",
  icons: {
    icon: "/favicon.png",
  },
};

export async function fetchPageSEO(path: string): Promise<Metadata> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    const res = await fetch(`${apiUrl}/seo/config?path=${path}`, {
      next: { 
        revalidate: 86400, // Cache for 24 hours
        tags: ['seo'] 
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
        console.error(`[SEO] API returned status ${res.status} for path ${path}`);
        return FALLBACK_SEO;
    }

    const data = await res.json();

    return {
      title: data.title,
      description: data.description,
      keywords: data.keywords ? data.keywords.split(',') : undefined,
      icons: {
        icon: "/favicon.png",
        shortcut: "/favicon.png",
        apple: "/favicon.png",
      },
      alternates: {
        canonical: data.canonical_url || undefined,
      },
      openGraph: {
        title: data.og_title || data.title,
        description: data.og_description || data.description,
        images: data.og_image ? [{ url: data.og_image }] : undefined,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: data.og_title || data.title,
        description: data.og_description || data.description,
        images: data.og_image ? [data.og_image] : undefined,
      }
    };
  } catch (error: any) {
    console.error(`[SEO] Fetch failed for ${path}:`, error.message || error);
    return FALLBACK_SEO; 
  }
}
