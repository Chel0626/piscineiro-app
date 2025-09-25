/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações para deploy estável
  poweredByHeader: false,
  
  // Configurações para Capacitor (SPA mode)
  ...(process.env.CAPACITOR_BUILD === 'true' && {
    output: 'export',
    trailingSlash: true,
    distDir: 'out',
    images: {
      unoptimized: true,
    },
    // SPA mode - todas as rotas vão para index.html
    async rewrites() {
      return {
        fallback: [
          {
            source: '/(.*)',
            destination: '/index.html',
          },
        ],
      };
    },
  }),
  
  // Headers para evitar cache agressivo em desenvolvimento/produção
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/'
          }
        ]
      }
    ];
  }
};

export default nextConfig;