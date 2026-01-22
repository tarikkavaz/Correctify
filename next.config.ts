import type { NextConfig } from 'next';

const isGhPages = process.env.GH_PAGES === 'true';
const basePath = isGhPages ? '/Correctify' : '';

const nextConfig: NextConfig = {
  // Use static export for Tauri and GitHub Pages
  output: process.env.TAURI_BUILD || isGhPages ? 'export' : undefined,
  distDir: process.env.TAURI_BUILD || isGhPages ? 'out' : '.next',
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
