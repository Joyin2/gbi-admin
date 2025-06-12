import { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Remove the output: 'export' line
  // output: 'export',
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig