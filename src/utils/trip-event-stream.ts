import { apiPath } from '@/src/config/paths';
import { getAuthHeaders } from '@/src/utils/auth';
import type { TripBillEvent } from '@/src/types/trip-realtime';

type StreamPayload = TripBillEvent | { type: 'connected'; tripId: string };

function parseSseChunk(chunk: string): StreamPayload | null {
	const dataLine = chunk
		.split('\n')
		.map((line) => line.trim())
		.find((line) => line.startsWith('data: '));
	if (!dataLine) return null;
	try {
		return JSON.parse(dataLine.slice(6)) as StreamPayload;
	} catch {
		return null;
	}
}

export async function connectTripEventStream(
	tripId: string,
	signal: AbortSignal,
	onEvent: (event: TripBillEvent) => void,
): Promise<void> {
	const response = await fetch(apiPath(`/api/trips/${tripId}/events`), {
		headers: getAuthHeaders(),
		signal,
	});

	if (!response.ok || !response.body) {
		throw new Error(`Trip event stream failed: ${response.status}`);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const frames = buffer.split('\n\n');
		buffer = frames.pop() ?? '';

		for (const frame of frames) {
			const payload = parseSseChunk(frame);
			if (!payload || payload.type === 'connected') continue;
			onEvent(payload);
		}
	}
}
