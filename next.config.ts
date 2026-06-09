import type { NextConfig } from "next";
import { BASE_PATH } from './src/config/base-path';

const nextConfig: NextConfig = {
  /* config options here */
	//output: 'export',
	images: { unoptimized: true },
	basePath: BASE_PATH,
	trailingSlash: false,
	env: {
		NEXT_PUBLIC_BASE_PATH: BASE_PATH,
	},
	//assetPrefix: '/simticket',
	compress: true,
};

export default nextConfig;
