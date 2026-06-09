import { BASE_PATH } from '@/src/config/base-path';

export const PWA_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? BASE_PATH;
export const PWA_SCOPE = `${PWA_BASE_PATH}/`;
export const PWA_SW_URL = `${PWA_BASE_PATH}/sw.js`;
export const PWA_START_URL = `${PWA_BASE_PATH}/`;
