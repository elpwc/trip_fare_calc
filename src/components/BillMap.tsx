'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';

type BillMapProps = {
  bills: Array<{
    id: string;
    name: string;
    amount: number;
    latitude: number | null;
    longitude: number | null;
  }>;
  interactive?: boolean;
  tileLayer?: 'osm' | 'satellite';
  onClick?: () => void;
  className?: string;
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

export default function BillMap({ bills, interactive = false, tileLayer = 'osm', onClick, className }: BillMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      try {
        mapRef.current.off();
        mapRef.current.remove();
      } catch (e) {
        console.warn('Leaflet remove failed, clearing container manually', e);
      }
      mapRef.current = null;
    }

    if (mapContainerRef.current) {
      const container = mapContainerRef.current as HTMLElement & { _leaflet_id?: number };
      if (container._leaflet_id) {
        delete container._leaflet_id;
      }
      container.innerHTML = '';
    }

    const map = L.map(mapContainerRef.current, {
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

    const markers: L.Marker[] = [];
    const validPoints = bills.filter(bill => bill.latitude != null && bill.longitude != null);

    validPoints.forEach((bill) => {
      const marker = L.circleMarker([bill.latitude!, bill.longitude!], {
        radius: 7,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.9,
        weight: 1,
      }).bindPopup(`<div class="text-sm"><strong>${bill.name}</strong><br/>¥${bill.amount}</div>`);
      marker.addTo(map);
      markers.push(marker as unknown as L.Marker);
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
      if ((map as any).tap) {
        (map as any).tap.disable();
      }
    }

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [bills, interactive, tileLayer]);

  return (
    <div
      ref={mapContainerRef}
      className={className}
      onClick={onClick}
      style={{ minHeight: '100%', width: '100%' }}
    />
  );
}
