/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Exportação estática para produção (Docker + nginx)
  ...(isProd ? { output: 'export' } : {}),
  // Proxy da API apenas em dev (em produção o nginx faz isso)
  ...(!isProd
    ? {
        async rewrites() {
          const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'
          return [
            {
              source: '/api/:path*',
              destination: `${backendUrl}/api/:path*`,
            },
          ]
        },
      }
    : {}),
}

export default nextConfig
