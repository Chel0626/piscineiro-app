/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações para deploy estável
  poweredByHeader: false,
  
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