/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'n8n.werposolutions.com',
        port: '',
        pathname: '/webhook/**',
      },
    ],
  },
};

export default nextConfig;
