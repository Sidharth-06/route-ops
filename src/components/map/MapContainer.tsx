import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinate, DeliveryStop, ThemeMode, TruckTelemetry } from '../../types/logistics';

interface MapContainerProps {
  theme: ThemeMode;
  traversedPath: Coordinate[];
  remainingPath: Coordinate[];
  telemetry: TruckTelemetry;
  stops: DeliveryStop[];
  followTruck: boolean;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  theme,
  traversedPath,
  remainingPath,
  telemetry,
  stops,
  followTruck,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const traversedPolylineRef = useRef<L.Polyline | null>(null);
  const remainingPolylineRef = useRef<L.Polyline | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);
  const stopMarkersRef = useRef<L.Marker[]>([]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center between Mumbai (19.07) and Bengaluru (12.97)
    const map = L.map(mapContainerRef.current, {
      center: [16.0, 75.2],
      zoom: 6,
      zoomControl: true,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Initial Tile Layer
    const tileUrl =
      theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Traversed Path Polyline (Solid Green)
    const traversedLine = L.polyline([], {
      color: '#10b981',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    traversedPolylineRef.current = traversedLine;

    // Remaining Path Polyline (Dashed Blue - matching assignment wireframe)
    const remainingLine = L.polyline([], {
      color: '#3b82f6',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    remainingPolylineRef.current = remainingLine;

    // Stop Markers
    stopMarkersRef.current = stops.map((stop) => {
      let iconHtml = '';

      if (stop.code === 'Origin') {
        iconHtml = `
          <div class="origin-dot-wrapper">
            <div class="origin-dot-radar"></div>
            <div class="origin-dot-body"></div>
            <div class="stop-title-tag">Origin</div>
          </div>
        `;
      } else {
        iconHtml = `
          <div class="stop-pin-wrapper">
            <div class="stop-pin-radar" style="border: 2px solid ${stop.color};"></div>
            <div class="stop-pin-body" style="background-color: ${stop.color};">
              <span class="stop-pin-label">${stop.code}</span>
            </div>
            <div class="stop-title-tag">${stop.code} · ${stop.city}</div>
          </div>
        `;
      }

      const customIcon = L.divIcon({
        className: 'custom-stop-marker-icon',
        html: iconHtml,
        iconSize: [40, 48],
        iconAnchor: [20, 24],
      });

      const marker = L.marker([stop.coordinate.lat, stop.coordinate.lng], {
        icon: customIcon,
      }).addTo(map);

      // Popup with manifest info
      marker.bindPopup(`
        <div style="font-family: var(--font-main); padding: 4px;">
          <strong style="font-size: 13px; color: ${stop.color}">${stop.code}: ${stop.name}</strong>
          <div style="font-size: 11px; margin-top: 4px; color: #64748b;">${stop.address}</div>
          <div style="font-size: 11px; margin-top: 6px;"><strong>Payload:</strong> ${stop.cargoDescription}</div>
          <div style="font-size: 11px;"><strong>Weight:</strong> ${stop.weightKg} kg (${stop.packageCount} pkgs)</div>
        </div>
      `);

      return marker;
    });

    // Truck Marker (with Freight Truck SVG & heading rotation)
    const truckIconHtml = `
      <div class="truck-marker-wrapper" id="truck-visual-marker">
        <div class="truck-radar-pulse"></div>
        <div class="truck-speed-tag" id="truck-speed-bubble">-- km/h</div>
        <div class="truck-icon-container" id="truck-rotator">
          <svg class="truck-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" fill="#38bdf8"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-5l-3-4h-5v10Z" fill="#0284c7"/>
            <circle cx="7" cy="18" r="2" fill="#f8fafc"/>
            <circle cx="17" cy="18" r="2" fill="#f8fafc"/>
          </svg>
        </div>
      </div>
    `;

    const truckIcon = L.divIcon({
      className: 'custom-truck-marker-icon',
      html: truckIconHtml,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const initialCoord = stops[0].coordinate;
    const truckMarker = L.marker([initialCoord.lat, initialCoord.lng], {
      icon: truckIcon,
      zIndexOffset: 1000,
    }).addTo(map);
    truckMarkerRef.current = truckMarker;

    // Fit map bounds to show full route initially
    const bounds = L.latLngBounds(stops.map((s) => [s.coordinate.lat, s.coordinate.lng]));
    map.fitBounds(bounds, { padding: [60, 60] });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Run once on mount

  // Update Tile Layer when theme changes (bonus requirement: Dark mode)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileUrl =
      theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png';

    tileLayerRef.current.setUrl(tileUrl);
  }, [theme]);

  // Update Traversed and Remaining Polylines
  useEffect(() => {
    if (traversedPolylineRef.current) {
      const latLngs = traversedPath.map((c) => [c.lat, c.lng] as [number, number]);
      traversedPolylineRef.current.setLatLngs(latLngs);
    }

    if (remainingPolylineRef.current) {
      const latLngs = remainingPath.map((c) => [c.lat, c.lng] as [number, number]);
      remainingPolylineRef.current.setLatLngs(latLngs);
    }
  }, [traversedPath, remainingPath]);

  // Update Truck Position, Heading Rotation, and Speed Bubble
  useEffect(() => {
    if (!truckMarkerRef.current || !telemetry.currentCoordinate) return;

    const { lat, lng } = telemetry.currentCoordinate;
    truckMarkerRef.current.setLatLng([lat, lng]);

    // Update rotation transform for heading
    const rotatorEl = document.getElementById('truck-rotator');
    if (rotatorEl) {
      // SVG base truck points right (90 deg), so we adjust offset: heading - 90
      rotatorEl.style.transform = `rotate(${telemetry.heading - 90}deg)`;
    }

    // Update speed bubble
    const speedBubbleEl = document.getElementById('truck-speed-bubble');
    if (speedBubbleEl) {
      speedBubbleEl.textContent = `${Math.round(telemetry.speedKmh)} km/h`;
    }

    // Auto-center map if followTruck is enabled
    if (followTruck && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([lat, lng], {
        animate: true,
        duration: 0.15,
      });
    }
  }, [telemetry, followTruck]);

  return (
    <div className="map-viewport" data-testid="map-viewport">
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
