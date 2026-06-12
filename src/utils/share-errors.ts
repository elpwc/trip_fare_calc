import type { MessageKey } from '@/src/utils/i18n/types';

const SHARE_ERROR_I18N: Record<string, MessageKey> = {
	'Invalid token or password': 'share.passwordError',
	'Token and password are required': 'share.enterPassword',
};

export function resolveShareErrorMessage(error: unknown, t: (key: MessageKey) => string): string {
	if (error instanceof Error) {
		const key = SHARE_ERROR_I18N[error.message];
		if (key) return t(key);
	}

	if (typeof error === 'string') {
		const key = SHARE_ERROR_I18N[error];
		if (key) return t(key);
	}

	return t('share.passwordError');
}
