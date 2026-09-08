import { Coordinate, DeliveryStop, TruckTelemetry } from '../types/logistics';
import { STOPS, ROUTE_WAYPOINTS, STOP_WAYPOINT_INDICES } from './routeData';

/**
 * Calculates great-circle distance between two points in kilometers using Haversine formula
 */
export function calculateDistanceKm(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const lat1 = (coord1.lat * Math.PI) / 180;
  const lat2 = (coord2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Pre-computes cumulative distances along the route waypoints in kilometers
 */
export const CUMULATIVE_DISTANCES_KM: number[] = (() => {
  const distances: number[] = [0];
  let total = 0;
  for (let i = 1; i < ROUTE_WAYPOINTS.length; i++) {
    const d = calculateDistanceKm(ROUTE_WAYPOINTS[i - 1], ROUTE_WAYPOINTS[i]);
    total += d;
    distances.push(Number(total.toFixed(4)));
  }
  return distances;
})();

export const TOTAL_ROUTE_DISTANCE_KM =
  CUMULATIVE_DISTANCES_KM[CUMULATIVE_DISTANCES_KM.length - 1];

/**
 * Calculates initial bearing / heading in degrees from coord1 to coord2 (0-360 degrees)
 */
export function calculateBearing(coord1: Coordinate, coord2: Coordinate): number {
  const lat1 = (coord1.lat * Math.PI) / 180;
  const lat2 = (coord2.lat * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Interpolates coordinate position along the route given a float index (e.g. 14.35)
 */
export function getInterpolatedPosition(floatIndex: number): {
  coordinate: Coordinate;
  heading: number;
} {
  const maxIndex = ROUTE_WAYPOINTS.length - 1;
  const clampedIndex = Math.max(0, Math.min(maxIndex, floatIndex));
  const baseIndex = Math.floor(clampedIndex);
  const fraction = clampedIndex - baseIndex;

  if (baseIndex >= maxIndex) {
    const lastCoord = ROUTE_WAYPOINTS[maxIndex];
    const prevCoord = ROUTE_WAYPOINTS[maxIndex - 1];
    return {
      coordinate: lastCoord,
      heading: calculateBearing(prevCoord, lastCoord),
    };
  }

  const p1 = ROUTE_WAYPOINTS[baseIndex];
  const p2 = ROUTE_WAYPOINTS[baseIndex + 1];

  const lat = p1.lat + (p2.lat - p1.lat) * fraction;
  const lng = p1.lng + (p2.lng - p1.lng) * fraction;
  const heading = calculateBearing(p1, p2);

  return {
    coordinate: {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
    },
    heading: Math.round(heading),
  };
}

/**
 * Formats time in seconds to human readable string (e.g. "14 mins", "1 hr 25m")
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return 'Arrived';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} mins`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
}

/**
 * Formats ETA arrival clock time given remaining seconds
 */
export function formatClockETA(seconds: number): string {
  if (seconds <= 0) return 'Now';
  const targetDate = new Date(Date.now() + seconds * 1000);
  return targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Evaluates current full telemetry state for the truck
 */
export function computeTruckTelemetry(
  floatWaypointIndex: number,
  speedMultiplier: number,
  isPaused: boolean,
  isAtStopDwell: boolean,
  dwellRemainingSecs: number = 0
): TruckTelemetry {
  const { coordinate, heading } = getInterpolatedPosition(floatWaypointIndex);
  const maxIndex = ROUTE_WAYPOINTS.length - 1;
  const baseIndex = Math.floor(floatWaypointIndex);
  const fraction = floatWaypointIndex - baseIndex;

  // Compute distance covered
  const d0 = CUMULATIVE_DISTANCES_KM[baseIndex] || 0;
  const d1 =
    baseIndex < maxIndex
      ? CUMULATIVE_DISTANCES_KM[baseIndex + 1]
      : TOTAL_ROUTE_DISTANCE_KM;
  const distanceCovered = d0 + (d1 - d0) * fraction;

  // Realistic highway speed: base 55-65 km/h with subtle dynamic variation
  const baseSpeedKmh = isPaused || isAtStopDwell ? 0 : 58 + Math.sin(floatWaypointIndex * 0.5) * 6;
  const effectiveSpeedKmh = Number(baseSpeedKmh.toFixed(1));

  // Determine current segment & next stop
  let currentLocationDescription = 'Origin (Mumbai Hub)';
  let nextStop: DeliveryStop | null = STOPS[1]; // D1 initially
  let completedStopsCount = 0;
  let currentSegmentIndex = 0;
  let remainingDistanceToNextStopKm = 0;

  if (floatWaypointIndex <= 0) {
    currentLocationDescription = 'At Origin (Mumbai Hub)';
    nextStop = STOPS[1];
    completedStopsCount = 0;
    remainingDistanceToNextStopKm = CUMULATIVE_DISTANCES_KM[STOP_WAYPOINT_INDICES.D1];
  } else if (floatWaypointIndex < STOP_WAYPOINT_INDICES.D1) {
    currentLocationDescription = 'Between Origin → D1';
    nextStop = STOPS[1];
    completedStopsCount = 0;
    currentSegmentIndex = 0;
    remainingDistanceToNextStopKm =
      CUMULATIVE_DISTANCES_KM[STOP_WAYPOINT_INDICES.D1] - distanceCovered;
  } else if (
    Math.abs(floatWaypointIndex - STOP_WAYPOINT_INDICES.D1) < 0.8 ||
    (isAtStopDwell && baseIndex === STOP_WAYPOINT_INDICES.D1)
  ) {
    currentLocationDescription = 'At Delivery Point D1 (Pune DC)';
    nextStop = STOPS[2];
    completedStopsCount = 1;
    currentSegmentIndex = 1;
    remainingDistanceToNextStopKm =
      CUMULATIVE_DISTANCES_KM[STOP_WAYPOINT_INDICES.D2] -
      CUMULATIVE_DISTANCES_KM[STOP_WAYPOINT_INDICES.D1];
  } else if (floatWaypointIndex < STOP_WAYPOINT_INDICES.D2) {
    currentLocationDescription = 'Between D1 → D2';
    nextStop = STOPS[2];
    completedStopsCount = 1;
    currentSegmentIndex = 1;
    remainingDistanceToNextStopKm =
      CUMULATIVE_DISTANCES_KM[STOP_WAYPOINT_INDICES.D2] - distanceCovered;
  } else if (
    Math.abs(floatWaypointIndex - STOP_WAYPOINT_INDICES.D2) < 0.8 ||
    (isAtStopDwell && baseIndex === STOP_WAYPOINT_INDICES.D2)
  ) {
    currentLocationDescription = 'At Delivery Point D2 (Kolhapur Gateway)';
    nextStop = STOPS[3];
    completedStopsCount = 2;
    currentSegmentIndex = 2;
    remainingDistanceToNextStopKm =
      CUMULATIVE_DISTANCES_KM[STOP_WAYPOINT_INDICES.D3] -
      CUMULATIVE_DISTANCES_KM[STOP_WAYPOINT_INDICES.D2];
  } else if (floatWaypointIndex < STOP_WAYPOINT_INDICES.D3) {
    currentLocationDescription = 'Between D2 → D3';
    nextStop = STOPS[3];
    completedStopsCount = 2;
    currentSegmentIndex = 2;
    remainingDistanceToNextStopKm =
      CUMULATIVE_DISTANCES_KM[STOP_WAYPOINT_INDICES.D3] - distanceCovered;
  } else {
    currentLocationDescription = 'At Final Destination D3 (Bengaluru Hub)';
    nextStop = null;
    completedStopsCount = 3;
    currentSegmentIndex = 2;
    remainingDistanceToNextStopKm = 0;
  }

  // Calculate ETAs
  // Average simulation speed in km/s (scaled for interactive demonstration)
  // Baseline: 60 km/h = 1 km per min = 1/60 km/s
  const speedCalc = Math.max(effectiveSpeedKmh > 0 ? effectiveSpeedKmh : 60, 20);
  const remainingTotalKm = Math.max(0, TOTAL_ROUTE_DISTANCE_KM - distanceCovered);

  // In simulated time, factoring in playbackSpeed
  const etaToNextStopSecs = (remainingDistanceToNextStopKm / speedCalc) * 3600;
  const etaToDestinationSecs = (remainingTotalKm / speedCalc) * 3600;

  // Fuel level decreases progressively from 95% to 32%
  const progressRatio = distanceCovered / TOTAL_ROUTE_DISTANCE_KM;
  const fuelLevelPercent = Math.max(15, Math.round(95 - progressRatio * 60));

  let status: TruckTelemetry['status'] = 'in_transit';
  if (floatWaypointIndex >= maxIndex) {
    status = 'completed';
  } else if (isAtStopDwell) {
    status = 'at_stop';
  } else if (isPaused) {
    status = 'paused';
  } else if (floatWaypointIndex <= 0) {
    status = 'idle';
  }

  return {
    currentCoordinate: coordinate,
    heading,
    speedKmh: effectiveSpeedKmh,
    totalDistanceCoveredKm: Number(distanceCovered.toFixed(1)),
    totalRouteDistanceKm: Number(TOTAL_ROUTE_DISTANCE_KM.toFixed(1)),
    currentSegmentIndex,
    currentLocationDescription,
    nextStop,
    completedStopsCount,
    totalStopsCount: 3, // 3 delivery points (D1, D2, D3)
    estimatedTimeToNextStopSecs: Math.round(etaToNextStopSecs),
    estimatedTimeToDestinationSecs: Math.round(etaToDestinationSecs),
    fuelLevelPercent,
    batteryStatus: 'eco',
    engineTempC: 84 + Math.round(Math.sin(floatWaypointIndex * 0.2) * 3),
    signalStrength: 'excellent',
    status,
    dwellRemainingSecs,
  };
}

/**
 * Synthesizes clean Web Audio API sound feedback (no external audio files needed)
 */
export function playUiFeedbackSound(type: 'click' | 'arrival' | 'complete') {
  try {
    const AudioContext =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'arrival') {
      // Pleasant delivery chime chord (C5 -> E5 -> G5)
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.4);
      });
    } else if (type === 'complete') {
      // Celebration fanfare
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.55);
      });
    }
  } catch {
    // Graceful silence if audio permissions or browser audio not permitted
  }
}
