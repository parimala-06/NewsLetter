/** @type {import('next').NextConfig} */
const nextConfig = {
  // Renamed from the default ".next" — on this Windows dev machine something
  // (AV/indexing) intermittently locks a freshly-created ".next/trace" file
  // and hangs `next dev`/`next build` at "Starting...". A fresh, distinct
  // build directory sidesteps whatever is holding that particular file.
  // Vercel's build step expects the standard ".next" output, so this only
  // applies to local builds (Vercel sets the VERCEL env var during build).
  distDir: process.env.VERCEL ? ".next" : ".next-build",
};

export default nextConfig;
