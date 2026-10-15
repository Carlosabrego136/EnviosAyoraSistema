import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/cotizar`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/rastreo`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/comerciantes`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/ruta-del-saldo`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/comunicados`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/privacidad`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/terminos`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
