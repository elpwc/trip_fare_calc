import { NextRequest } from 'next/server';
import { verifyJwtToken } from '@/src/lib/jwt';
import { getTripAccess } from '@/lib/trip-access';
import { subscribeTripEvents } from '@/lib/trip-realtime';
import type { TripBillEvent } from '@/src/types/trip-realtime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getUserId(request: NextRequest): string | null {
	const authHeader = request.headers.get('authorization');
	if (!authHeader?.startsWith('Bearer ')) return null;
	const decoded = verifyJwtToken(authHeader.slice(7));
	return decoded?.userId ?? null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const userId = getUserId(request);
	if (!userId) {
		return new Response('Unauthorized', { status: 401 });
	}

	const { id: tripId } = await params;
	const access = await getTripAccess(userId, tripId);
	if (!access) {
		return new Response('Not found', { status: 404 });
	}

	const encoder = new TextEncoder();
	let unsubscribe: (() => void) | null = null;
	let heartbeat: ReturnType<typeof setInterval> | null = null;

	const stream = new ReadableStream({
		start(controller) {
			const sendRaw = (payload: unknown) => {
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
			};

			sendRaw({ type: 'connected', tripId });

			unsubscribe = subscribeTripEvents(tripId, userId, (event: TripBillEvent) => {
				sendRaw(event);
			});

			heartbeat = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(': ping\n\n'));
				} catch {
					// stream closed
				}
			}, 25000);
		},
		cancel() {
			unsubscribe?.();
			if (heartbeat) clearInterval(heartbeat);
		},
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream; charset=utf-8',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no',
		},
	});
}
