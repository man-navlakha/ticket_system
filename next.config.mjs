/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  generateBuildId: async () => {
    return 'man-support-desk-v2-' + Date.now();
  },
};

export default nextConfig;
