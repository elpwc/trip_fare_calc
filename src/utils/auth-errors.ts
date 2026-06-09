import type { MessageKey } from '@/src/utils/i18n/types';

export class AuthRequestError extends Error {
	readonly code: string;
	readonly status?: number;

	constructor(code: string, status?: number) {
		super(code);
		this.name = 'AuthRequestError';
		this.code = code;
		this.status = status;
	}
}

const AUTH_ERROR_I18N: Record<string, MessageKey> = {
	'Email and password required': 'auth.error.emailPasswordRequired',
	'Invalid credentials': 'auth.error.invalidCredentials',
	'All fields required': 'auth.error.allFieldsRequired',
	'Password must be at least 6 characters': 'auth.error.passwordTooShort',
	'Invalid verification code': 'auth.error.invalidVerificationCode',
	'Verification code expired': 'auth.error.verificationCodeExpired',
	'Email already registered': 'auth.error.emailAlreadyRegistered',
	'Invalid email': 'auth.error.invalidEmail',
	'Authorization required': 'auth.error.authorizationRequired',
	Unauthorized: 'auth.error.authorizationRequired',
	'Invalid token': 'auth.error.invalidToken',
	'No update fields provided': 'auth.error.noUpdateFields',
	'User not found': 'auth.error.userNotFound',
	'Email already taken': 'auth.error.emailAlreadyTaken',
	'Old password required to change password': 'auth.error.oldPasswordRequired',
	'Invalid old password': 'auth.error.invalidOldPassword',
	'Old and new password required': 'auth.error.oldAndNewPasswordRequired',
	'New password must be at least 6 characters': 'auth.error.newPasswordTooShort',
	'Internal server error': 'auth.error.serverError',
	'Internal Server Error': 'auth.error.serverError',
	REQUEST_FAILED: 'auth.error.generic',
	NETWORK_ERROR: 'auth.error.network',
	INVALID_RESPONSE: 'auth.error.invalidResponse',
	HTTP_404: 'auth.error.notFound',
	HTTP_502: 'auth.error.badGateway',
	HTTP_503: 'auth.error.badGateway',
};

function lookupAuthErrorKey(code: string, status?: number): MessageKey {
	const direct = AUTH_ERROR_I18N[code];
	if (direct) return direct;

	if (code.toLowerCase() === 'internal server error') {
		return 'auth.error.serverError';
	}

	if (status === 404) return 'auth.error.notFound';
	if (status === 502 || status === 503) return 'auth.error.badGateway';
	if (status && status >= 500) return 'auth.error.serverError';

	return 'auth.error.generic';
}

export function resolveAuthErrorMessage(error: unknown, t: (key: MessageKey) => string): string {
	if (error instanceof AuthRequestError) {
		return t(lookupAuthErrorKey(error.code, error.status));
	}

	if (error instanceof Error) {
		const key = AUTH_ERROR_I18N[error.message];
		if (key) return t(key);
	}

	return t('auth.error.network');
}
