import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Brand pages moved from /shop/brand(s) to /marques — permanent redirects
  async redirects() {
    return [
      {
        source: "/shop/brands",
        destination: "/marques",
        permanent: true,
      },
      {
        source: "/shop/brand/:slug",
        destination: "/marques/:slug",
        permanent: true,
      },
    ];
  },

  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
    imageSizes: [32, 48, 64, 96, 128, 160, 256, 384],

    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
      },
      {
        protocol: "https",
        hostname: "*.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "*.fbcdn.net",
      },
    ],

    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;