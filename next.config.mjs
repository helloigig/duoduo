/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // The project list now lives on the homepage
  async redirects() {
    return [{ source: '/work', destination: '/', permanent: false }];
  },
};

export default nextConfig;
