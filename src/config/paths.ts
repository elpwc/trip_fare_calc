import { BASE_PATH } from '@/src/config/base-path';

export const APP_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? BASE_PATH;

export function withBasePath(path: string): string {
	const normalized = path.startsWith('/') ? path : `/${path}`;
	if (!APP_BASE) return normalized;
	if (normalized === APP_BASE || normalized.startsWith(`${APP_BASE}/`)) return normalized;
	return `${APP_BASE}${normalized}`;
}

export function apiPath(path: string): string {
	const normalized = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`;
	return withBasePath(normalized);
}
