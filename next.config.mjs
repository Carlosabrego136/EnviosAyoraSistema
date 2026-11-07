/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob: https://images.higgs.ai https://d8j0ntlcm91z4.cloudfront.net",
      "font-src 'self' data:",
      "media-src 'self' https://d8j0ntlcm91z4.cloudfront.net",
      "style-src 'self' 'unsafe-inline'",
      // Next.js necesita scripts inline para la hidratación; en desarrollo también eval.
      `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
      "connect-src 'self'",
      ...(isProd ? ['upgrade-insecure-requests'] : []),
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['pg', 'bcryptjs'],
  // Las fotos del panel se reducen en el navegador; este límite cubre lo que llega al servidor (máx. ~4 MB por imagen).
  experimental: { serverActions: { bodySizeLimit: '4.5mb' } },
  // Rutas antiguas del módulo de folios (ahora vive en /fenix).
  async redirects() {
    return [
      { source: '/admin/folios', destination: '/fenix', permanent: false },
      { source: '/admin/folios/historial', destination: '/fenix/historial', permanent: false },
      { source: '/admin/folios/exportar', destination: '/fenix/exportar', permanent: false },
      { source: '/admin/folios/:id(\\d+)', destination: '/fenix/folio/:id', permanent: false },
      { source: '/admin/etiqueta/:id(\\d+)', destination: '/fenix/etiqueta/:id', permanent: false },
    ];
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
