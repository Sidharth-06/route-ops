import React, { lazy, Suspense, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinate, DeliveryStop, ThemeMode, TruckTelemetry } from '../../types/logistics';

const VehicleScene = lazy(() =>
  import('./VehicleScene').then((module) => ({ default: module.VehicleScene }))
);

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
  const stopMarkersRef = useRef<L.Marker[]>([]);
  const vehicleOverlayRef = useRef<HTMLDivElement | null>(null);
  const lastFollowPanAtRef = useRef(0);
  const vehicleCoordinateRef = useRef<Coordinate>(telemetry.currentCoordinate);
  vehicleCoordinateRef.current = telemetry.currentCoordinate;

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

    // Custom pane for the 3D truck — Leaflet automatically animates all panes
    // during zoom and pan, so the truck stays locked to its lat/lng.
    const vehiclePane = map.createPane('vehiclePane');
    vehiclePane.style.zIndex = '650';
    vehiclePane.style.pointerEvents = 'none';

    // OpenStreetMap's standard tiles are keyless and keep the map usable in local demos.
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abc',
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
            <div class="stop-pin-radar" style="color: ${stop.color};"></div>
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
        iconSize: [36, 52],
        iconAnchor: [18, 28],
      });

      const marker = L.marker([stop.coordinate.lat, stop.coordinate.lng], {
        icon: customIcon,
      }).addTo(map);

      // Popup
      marker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; padding: 8px; background: #131318; color: #e4e4ef; border-radius: 4px; min-width: 200px; font-size: 11px;">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:6px; border-bottom: 1px solid #1f1f2a; padding-bottom:6px;">
            <span style="font-family: monospace; font-weight:700; font-size:10px; background:${stop.color}; color:#fff; padding:1px 5px; border-radius:2px;">${stop.code}</span>
            <strong style="font-size:12px;">${stop.name}</strong>
          </div>
          <div style="color:#8b8ba7; margin-bottom:4px;">${stop.address}</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-top:6px;">
            <div><span style="color:#55556e; font-size:9px; text-transform:uppercase; letter-spacing:0.06em;">Payload</span><br/><span style="font-family:monospace; font-weight:600;">${stop.cargoDescription}</span></div>
            <div><span style="color:#55556e; font-size:9px; text-transform:uppercase; letter-spacing:0.06em;">Weight</span><br/><span style="font-family:monospace; font-weight:600;">${stop.weightKg} kg</span></div>
          </div>
        </div>
      `);

      return marker;
    });

    // Fit map bounds to show full route initially
    const bounds = L.latLngBounds(stops.map((s) => [s.coordinate.lat, s.coordinate.lng]));
    map.fitBounds(bounds, { padding: [60, 60] });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Run once on mount

  // Attach overlay to Leaflet's vehiclePane and track position with layerPoint.
  // Leaflet animates the pane during zoom/pan so the truck is always geo-locked.
  useEffect(() => {
    const map = mapInstanceRef.current;
    const overlay = vehicleOverlayRef.current;
    if (!map || !overlay) return;

    // Move the overlay div into Leaflet's managed pane.
    const pane = map.getPane('vehiclePane');
    if (pane && overlay.parentElement !== pane) {
      pane.appendChild(overlay);
    }

    // layerPoint is relative to the pane origin — correct coordinate space.
    const setPos = () => {
      const { lat, lng } = vehicleCoordinateRef.current;
      const pt = map.latLngToLayerPoint([lat, lng]);
      overlay.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0) translate(-50%, -85%)`;
    };

    let rafId: number;
    let zooming = false;

    // During zoom Leaflet animates the pane itself — we must NOT update
    // layerPoint ourselves or it will fight Leaflet and glitch.
    const onZoomStart = () => { zooming = true; };
    const onZoomEnd   = () => { zooming = false; setPos(); };

    const tick = () => {
      if (!zooming) setPos();
      rafId = requestAnimationFrame(tick);
    };

    map.on('zoomstart', onZoomStart);
    map.on('zoomend',   onZoomEnd);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      map.off('zoomstart', onZoomStart);
      map.off('zoomend',   onZoomEnd);
    };
  }, []); // runs once — RAF + refs give live position

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

  // Follow-truck camera pan (position sync is handled by the RAF above).
  useEffect(() => {
    if (!followTruck || !telemetry.currentCoordinate) return;
    const map = mapInstanceRef.current;
    if (!map) return;

    const { lat, lng } = telemetry.currentCoordinate;
    const now = performance.now();
    const distanceFromView = map.distance(map.getCenter(), [lat, lng]);

    if (distanceFromView > 15000 && now - lastFollowPanAtRef.current > 600) {
      lastFollowPanAtRef.current = now;
      map.stop();
      map.panTo([lat, lng], { animate: true, duration: 0.6 });
    }
  }, [telemetry, followTruck]);

  return (
    <div className="map-viewport" data-testid="map-viewport">
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Overlay div — moved into Leaflet's vehiclePane by useEffect above.
           We still render it in JSX so React manages its lifetime. */}
      <div
        ref={vehicleOverlayRef}
        id="map-vehicle-3d"
        className="map-vehicle-3d"
        aria-label="Live vehicle position"
        style={{ width: 140, height: 110 }}
      >
        <Suspense fallback={null}>
          <VehicleScene
            isMoving={telemetry.status === 'in_transit'}
            heading={telemetry.heading}
          />
        </Suspense>
      </div>

      {/* Route info bar — top left */}
      <div className="map-brief">
        <div className="map-brief-inner">
          <span className="map-brief-label">LIVE ROUTE</span>
          <span className="map-brief-title">West Coast Corridor</span>
          <div className="map-brief-meta">
            <span>Mumbai → Bengaluru</span>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <span>{telemetry.totalRouteDistanceKm} km</span>
          </div>
        </div>
      </div>

      <div className="map-scale-note">INDIA / SW SECTOR</div>
    </div>
  );
};
