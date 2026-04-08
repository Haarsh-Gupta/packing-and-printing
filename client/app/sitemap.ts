import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://navart.com';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  let products = [];
  try {
    const res = await fetch(`${apiUrl}/products`);
    if (res.ok) {
        products = await res.json();
    }
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
  }

  let services = [];
  try {
    const res = await fetch(`${apiUrl}/services`);
    if (res.ok) {
        services = await res.json();
    }
  } catch (error) {
    console.error('Error fetching services for sitemap:', error);
  }

  const productUrls: MetadataRoute.Sitemap = products.flatMap((product: any) => {
    const urls: MetadataRoute.Sitemap = [
      {
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }
    ];

    if (product.sub_products) {
      product.sub_products.forEach((subProduct: any) => {
        urls.push({
          url: `${baseUrl}/products/customize/${subProduct.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });
    }

    return urls;
  });

  const serviceUrls: MetadataRoute.Sitemap = services.flatMap((service: any) => {
    const urls: MetadataRoute.Sitemap = [
      {
        url: `${baseUrl}/services/${service.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }
    ];

    if (service.sub_services) {
      service.sub_services.forEach((subService: any) => {
        urls.push({
          url: `${baseUrl}/services/request/${subService.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });
    }

    return urls;
  });

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    ...productUrls,
    ...serviceUrls,
  ];
}
