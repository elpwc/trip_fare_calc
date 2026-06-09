'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { usePreferences } from '@/src/utils/preferences-provider';
import { buildBillMapMarkerHtml } from '@/src/utils/map-marker-html';

export type BillMapBill = {
	id: string;
	name: string;
	amount: number;
	latitude: number | null;
	longitude: number | null;
	payerName?: string;
	payerIsSelf?: boolean;
};

type BillMapProps = {
	bills: BillMapBill[];
	interactive?: boolean;
	tileLayer?: 'osm' | 'satellite';
	onClick?: () => void;
	className?: string;
	/** Show bill name + payer avatar markers (map detail mode) */
	showBillMarkers?: boolean;
};

const tileSources = {
	osm: {
		url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
		attribution: '&copy; OpenStreetMap contributors',
	},
	satellite: {
		url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
		attribution: '&copy; Esri &mdash; Source: Esri, Earthstar Geographics, CNES/Airbus DS',
	},
};

export default function BillMap({ bills, interactive = false, tileLayer = 'osm', onClick, className, showBillMarkers = false }: BillMapProps) {
	const { t } = usePreferences();
	const mapContainerRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<LeafletMap | null>(null);
	const selfLabel = t('common.self');

	useEffect(() => {
		if (!mapContainerRef.current) return;

		let cancelled = false;

		async function initMap() {
			const L = (await import('leaflet')).default;
			if (cancelled || !mapContainerRef.current) return;

			if (mapRef.current) {
				try {
					mapRef.current.off();
					mapRef.current.remove();
				} catch (e) {
					console.warn('Leaflet remove failed, clearing container manually', e);
				}
				mapRef.current = null;
			}

			const container = mapContainerRef.current as HTMLElement & { _leaflet_id?: number };
			if (container._leaflet_id) {
				delete container._leaflet_id;
			}
			container.innerHTML = '';

			const map = L.map(container, {
				center: [30, 104],
				zoom: 3,
				zoomControl: interactive,
				scrollWheelZoom: interactive,
				doubleClickZoom: interactive,
				dragging: interactive,
				touchZoom: interactive,
				boxZoom: interactive,
				keyboard: interactive,
				attributionControl: true,
			});

			L.tileLayer(tileSources[tileLayer].url, {
				attribution: tileSources[tileLayer].attribution,
				maxZoom: 19,
			}).addTo(map);

			const validPoints = bills.filter((bill) => bill.latitude != null && bill.longitude != null);

			validPoints.forEach((bill) => {
				const lat = bill.latitude!;
				const lng = bill.longitude!;
				const popupHtml = `<div class="text-sm"><strong>${bill.name}</strong><br/>¥${bill.amount}${bill.payerName ? `<br/><span style="color:#6b6458">${bill.payerName}</span>` : ''}</div>`;

				if (showBillMarkers && bill.payerName) {
					const html = buildBillMapMarkerHtml(bill.name, bill.payerName, bill.payerIsSelf ?? false, selfLabel);
					const icon = L.divIcon({
						html,
						className: 'bill-map-marker-icon',
						iconSize: [88, 52],
						iconAnchor: [44, 46],
					});
					L.marker([lat, lng], { icon }).bindPopup(popupHtml).addTo(map);
					return;
				}

				L.circleMarker([lat, lng], {
					radius: 7,
					color: '#2563eb',
					fillColor: '#3b82f6',
					fillOpacity: 0.9,
					weight: 1,
				})
					.bindPopup(popupHtml)
					.addTo(map);
			});

			if (validPoints.length > 0) {
				const bounds = L.latLngBounds(validPoints.map((bill) => [bill.latitude!, bill.longitude!] as [number, number]));
				map.fitBounds(bounds.pad(0.4));
			}

			if (!interactive) {
				map.dragging.disable();
				map.touchZoom.disable();
				map.doubleClickZoom.disable();
				map.scrollWheelZoom.disable();
				map.boxZoom.disable();
				map.keyboard.disable();
				if ((map as LeafletMap & { tap?: { disable: () => void } }).tap) {
					(map as LeafletMap & { tap?: { disable: () => void } }).tap?.disable();
				}
			}

			mapRef.current = map;
		}

		initMap();

		return () => {
			cancelled = true;
			if (mapRef.current) {
				mapRef.current.remove();
				mapRef.current = null;
			}
		};
	}, [bills, interactive, tileLayer, showBillMarkers, selfLabel]);

	return <div ref={mapContainerRef} className={className} onClick={onClick} style={{ minHeight: '100%', width: '100%' }} />;
}
