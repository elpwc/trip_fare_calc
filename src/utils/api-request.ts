import { AuthRequestError } from '@/src/utils/auth-errors';

function extractApiError(payload: Record<string, unknown> | null, status: number): string {
	if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error;
	if (typeof payload?.message === 'string' && payload.message.trim()) return payload.message;
	return `HTTP_${status}`;
}

export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(options.headers as Record<string, string>),
	};

	let response: Response;
	try {
		response = await fetch(url, {
			...options,
			headers,
			cache: 'no-store',
		});
	} catch {
		throw new AuthRequestError('NETWORK_ERROR');
	}

	const text = await response.text();
	let payload: Record<string, unknown> | null = null;

	if (text) {
		try {
			payload = JSON.parse(text) as Record<string, unknown>;
		} catch {
			if (!response.ok) {
				throw new AuthRequestError(`HTTP_${response.status}`, response.status);
			}
			throw new AuthRequestError('INVALID_RESPONSE', response.status);
		}
	}

	if (!response.ok) {
		throw new AuthRequestError(extractApiError(payload, response.status), response.status);
	}

	return payload as T;
}
