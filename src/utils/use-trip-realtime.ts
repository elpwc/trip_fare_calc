'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { TripBillEvent } from '@/src/types/trip-realtime';
import { connectTripEventStream } from '@/src/utils/trip-event-stream';

type UseTripRealtimeOptions = {
	tripId: string | null;
	userId: string | undefined;
	enabled?: boolean;
	onRemoteEvent: (event: TripBillEvent) => void;
	onRefresh: () => void | Promise<void>;
};

const RECONNECT_BASE_MS = 2000;
const RECONNECT_MAX_MS = 30000;

export function useTripRealtime({ tripId, userId, enabled = true, onRemoteEvent, onRefresh }: UseTripRealtimeOptions) {
	const onRemoteEventRef = useRef(onRemoteEvent);
	const onRefreshRef = useRef(onRefresh);

	useEffect(() => {
		onRemoteEventRef.current = onRemoteEvent;
		onRefreshRef.current = onRefresh;
	}, [onRemoteEvent, onRefresh]);

	const handleEvent = useCallback(
		(event: TripBillEvent) => {
			void onRefreshRef.current();
			if (event.actorUserId !== userId) {
				onRemoteEventRef.current(event);
			}
		},
		[userId],
	);

	useEffect(() => {
		if (!enabled || !tripId || !userId) return;

		let cancelled = false;
		let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
		let attempt = 0;
		const controller = new AbortController();

		const connect = async () => {
			if (cancelled) return;
			try {
				await connectTripEventStream(tripId, controller.signal, handleEvent);
				attempt = 0;
			} catch (error) {
				if (cancelled || controller.signal.aborted) return;
				const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS);
				attempt += 1;
				reconnectTimer = setTimeout(connect, delay);
			}
		};

		void connect();

		return () => {
			cancelled = true;
			controller.abort();
			if (reconnectTimer) clearTimeout(reconnectTimer);
		};
	}, [tripId, userId, enabled, handleEvent]);
}
