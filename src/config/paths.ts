import { BASE_PATH } from '@/src/config/base-path';

export const APP_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? BASE_PATH;

/** PWA / 应用入口 URL，不带尾斜杠（与服务器可访问路径一致） */
export const APP_ENTRY = APP_BASE;

/** PWA scope：不带尾斜杠，可同时匹配 /tripfarecalc 与 /tripfarecalc/... */
export const PWA_SCOPE = APP_BASE;

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
