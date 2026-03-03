/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Use a static ID or a build-time environment variable
  generateBuildId: async () => {
    return process.env.COMMIT_REF || 'man-support-desk-v2';
  },
};

export default nextConfig;