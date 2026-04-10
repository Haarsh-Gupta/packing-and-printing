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
    // We use the server-side internal URL if possible, otherwise falls back to public
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    const res = await fetch(`${apiUrl}/seo/config?path=${path}`, {
      // ISR: Cache the result for 1 hour (3600 seconds)
      next: { revalidate: 3600 },
      // Prevent 90s+ hangs when backend is restarting
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
        // If 404, we return the fallback. If we are on home page, maybe we want a specific default.
        return FALLBACK_SEO;
    }

    const data = await res.json();

    return {
      title: data.title,
      description: data.description,
      keywords: data.keywords ? data.keywords.split(',') : undefined,
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
  } catch (error) {
    console.error(`SEO Fetch failed for ${path}:`, error);
    return FALLBACK_SEO; // Never crash the page layout on API failure
  }
}
