/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",

  // Disable React Strict Mode to prevent double rendering issues with R3F
  reactStrictMode: false,

  // Transpile packages that need it
  transpilePackages: [
    "socket.io-client",
    "three",
    "@react-three/fiber",
    "@react-three/drei",
  ],

  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // Webpack configuration for Three.js
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
};

export default nextConfig;
