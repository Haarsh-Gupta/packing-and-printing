import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://navart.com'; // Placeholder base URL
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/dashboard/', // Don't crawl private dashboard pages
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
