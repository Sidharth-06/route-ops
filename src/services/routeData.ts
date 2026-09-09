import { Coordinate, DeliveryStop } from '../types/logistics';

export const STOPS: DeliveryStop[] = [
  {
    id: 'stop-origin',
    name: 'Mumbai Central Logistics Hub',
    code: 'Origin',
    address: 'Gate 4, JNPT Logistics Corridor',
    city: 'Mumbai',
    coordinate: { lat: 19.0760, lng: 72.8777 },
    type: 'origin',
    cargoDescription: 'Heavy Machinery & Automotive Components',
    packageCount: 142,
    weightKg: 8450,
    recipient: 'RouteOps Fleet Operations',
    plannedArrivalTime: '08:00 AM (Departed)',
    color: '#10b981', // Emerald green
  },
  {
    id: 'stop-d1',
    name: 'Pune Industrial DC',
    code: 'D1',
    address: 'Sector 18, Chakan MIDC Industrial Area',
    city: 'Pune',
    coordinate: { lat: 18.5204, lng: 73.8567 },
    type: 'delivery',
    cargoDescription: 'Precision Bearings & Control Modules',
    packageCount: 38,
    weightKg: 2100,
    recipient: 'Apex Engineering Ltd.',
    plannedArrivalTime: '11:15 AM',
    color: '#ef4444', // Vibrant red
  },
  {
    id: 'stop-d2',
    name: 'Kolhapur Gateway Terminal',
    code: 'D2',
    address: 'Plot 42, Shiroli Industrial Park',
    city: 'Kolhapur',
    coordinate: { lat: 16.7050, lng: 74.2433 },
    type: 'delivery',
    cargoDescription: 'Foundry Castings & Hydraulic Assemblies',
    packageCount: 45,
    weightKg: 2950,
    recipient: 'Kirloskar Logistics Partner',
    plannedArrivalTime: '03:45 PM',
    color: '#f59e0b', // Amber/Orange
  },
  {
    id: 'stop-d3',
    name: 'Bengaluru Tech Mega Warehouse',
    code: 'D3',
    address: 'Hub 7, Nelamangala Logistics Corridor',
    city: 'Bengaluru',
    coordinate: { lat: 12.9716, lng: 77.5946 },
    type: 'destination',
    cargoDescription: 'Finished Assemblies & Server Enclosures',
    packageCount: 59,
    weightKg: 3400,
    recipient: 'Titan Tech Distribution',
    plannedArrivalTime: '09:30 PM',
    color: '#64748b', // Slate grey matching assignment diagram
  },
];

// Helper to generate smooth highway corridor waypoints between points
function generateCurvedWaypoints(
  start: Coordinate,
  end: Coordinate,
  numPoints: number,
  curveAmplitude: number = 0.04
): Coordinate[] {
  const points: Coordinate[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Linear interpolation
    const baseLat = start.lat + (end.lat - start.lat) * t;
    const baseLng = start.lng + (end.lng - start.lng) * t;
    
    // Gentle sine wave curve simulating natural highway road curvature
    const offset = Math.sin(t * Math.PI) * curveAmplitude;
    // Perpendicular vector for offset
    const dx = end.lng - start.lng;
    const dy = end.lat - start.lat;
    const len = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / len;
    const perpY = dx / len;

    points.push({
      lat: Number((baseLat + perpY * offset).toFixed(6)),
      lng: Number((baseLng + perpX * offset).toFixed(6)),
    });
  }
  return points;
}

// Generate high-density realistic highway waypoints for each segment
// Segment 1: Origin (Mumbai) -> D1 (Pune)
const segment1 = generateCurvedWaypoints(STOPS[0].coordinate, STOPS[1].coordinate, 80, -0.06);

// Segment 2: D1 (Pune) -> D2 (Kolhapur)
const segment2 = generateCurvedWaypoints(STOPS[1].coordinate, STOPS[2].coordinate, 100, 0.08);

// Segment 3: D2 (Kolhapur) -> D3 (Bengaluru)
const segment3 = generateCurvedWaypoints(STOPS[2].coordinate, STOPS[3].coordinate, 140, -0.12);

// Combined seamless route waypoints without duplicating connecting points
export const ROUTE_WAYPOINTS: Coordinate[] = [
  ...segment1,
  ...segment2.slice(1),
  ...segment3.slice(1),
];

// Precomputed indices for where each stop falls on the ROUTE_WAYPOINTS array
export const STOP_WAYPOINT_INDICES = {
  Origin: 0,
  D1: segment1.length - 1,
  D2: segment1.length - 1 + segment2.length - 1,
  D3: ROUTE_WAYPOINTS.length - 1,
};
