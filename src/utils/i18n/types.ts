import type { zhCN } from '@/src/utils/i18n/locales/zh-CN';

export type MessageKey = keyof typeof zhCN;

export type Messages = Record<MessageKey, string>;
