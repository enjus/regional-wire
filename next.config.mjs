import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  async redirects() {
    return [
      { source: '/docs/uploading-stories', destination: '/wire/docs/uploading-stories', permanent: true },
      { source: '/docs/feeds', destination: '/wire/docs/feeds', permanent: true },
      { source: '/docs/alerts', destination: '/wire/docs/alerts', permanent: true },
      { source: '/docs/requests', destination: '/wire/docs/requests', permanent: true },
      { source: '/docs/republishing', destination: '/wire/docs/republishing', permanent: true },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/sign/**',
      },
    ],
  },
};

export default nextConfig;
