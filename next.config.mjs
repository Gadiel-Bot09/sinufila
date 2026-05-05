/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'esetre.sinuhub.com',
      },
    ],
  },
};

export default nextConfig;
