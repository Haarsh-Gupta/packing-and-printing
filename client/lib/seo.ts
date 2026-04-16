import { Metadata } from 'next';

const FALLBACK_SEO: Metadata = {
  title: `${process.env.NEXT_PUBLIC_COMPANY_NAME || "NavArt"} | Premium Packaging Solutions`,
  description: "High-quality custom printed packaging and corrugated boxes.",
  icons: {
    icon: "/favicon.png",
  },
};

let isApiUnreachable = false;

export async function fetchPageSEO(path: string): Promise<Metadata> {
  // If we've already determined the API is unreachable during this build/process run, 
  // skip the wait and return fallback immediately.
  if (isApiUnreachable) {
    return FALLBACK_SEO;
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    const res = await fetch(`${apiUrl}/seo/config?path=${path}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
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
  } catch (error: any) {
    // If it's a timeout or connection error, mark as unreachable to avoid spamming the build
    if (error.name === 'TimeoutError' || error.innerError?.code === 'ECONNREFUSED' || error.code === 'ECONNREFUSED') {
        if (!isApiUnreachable) {
            console.warn(`[SEO] API unreachable at ${path}. Falling back to default metadata for this build run.`);
            isApiUnreachable = true;
        }
    } else {
        console.error(`[SEO] Fetch failed for ${path}:`, error.message || error);
    }
    return FALLBACK_SEO; 
  }
}
