/** @type {import('next').NextConfig} */
const nextConfig = {
  // Renamed from the default ".next" — on this Windows dev machine something
  // (AV/indexing) intermittently locks a freshly-created ".next/trace" file
  // and hangs `next dev`/`next build` at "Starting...". A fresh, distinct
  // build directory sidesteps whatever is holding that particular file.
  distDir: ".next-build",
};

export default nextConfig;
