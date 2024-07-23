/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  reactStrictMode: true,

  rewrites() {
    return [
      {
        source: "/:path*",
        destination: "/",
      },
    ]
  }
};

export default nextConfig;
