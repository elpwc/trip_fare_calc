import { APP_ENTRY, APP_BASE, PWA_SCOPE, withBasePath } from '@/src/config/paths';

export const PWA_BASE_PATH = APP_BASE;
export const PWA_SCOPE_PATH = PWA_SCOPE;
export const PWA_SW_URL = withBasePath('/sw.js');
export const PWA_START_URL = APP_ENTRY;
