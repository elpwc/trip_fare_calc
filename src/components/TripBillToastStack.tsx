'use client';

import { useCallback, useEffect, useState } from 'react';

export type TripBillToastItem = {
	id: string;
	title: string;
	detail?: string;
};

type TripBillToastStackProps = {
	toasts: TripBillToastItem[];
	onDismiss: (id: string) => void;
};

const AUTO_DISMISS_MS = 6000;

export function useTripBillToasts() {
	const [toasts, setToasts] = useState<TripBillToastItem[]>([]);

	const dismissToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	const pushToast = useCallback((title: string, detail?: string) => {
		const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		setToasts((prev) => [...prev.slice(-4), { id, title, detail }]);
		return id;
	}, []);

	return { toasts, pushToast, dismissToast };
}

export default function TripBillToastStack({ toasts, onDismiss }: TripBillToastStackProps) {
	useEffect(() => {
		if (toasts.length === 0) return;
		const timers = toasts.map((toast) =>
			window.setTimeout(() => {
				onDismiss(toast.id);
			}, AUTO_DISMISS_MS),
		);
		return () => {
			timers.forEach((timer) => window.clearTimeout(timer));
		};
	}, [toasts, onDismiss]);

	if (toasts.length === 0) return null;

	return (
		<div className="trip-bill-toast-stack" aria-live="polite">
			{toasts.map((toast) => (
				<div key={toast.id} className="trip-bill-toast">
					<div className="trip-bill-toast-body">
						<p className="trip-bill-toast-title">{toast.title}</p>
						{toast.detail ? <p className="trip-bill-toast-detail">{toast.detail}</p> : null}
					</div>
					<button type="button" className="trip-bill-toast-close" aria-label="Close" onClick={() => onDismiss(toast.id)}>
						×
					</button>
				</div>
			))}
		</div>
	);
}
