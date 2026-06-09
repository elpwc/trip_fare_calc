import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
	//output: 'export',
	images: { unoptimized: true },
	basePath: '/tripfarecalc',
	//assetPrefix: '/simticket',
	compress: true,
};

export default nextConfig;
