/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
   experimental: {
    serverActions: {
      // Increase limit to 10 MB (adjust as needed)
      bodySizeLimit: '40mb',
    },
  },
}

export default nextConfig