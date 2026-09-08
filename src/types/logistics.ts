export interface Coordinate {
  lat: number;
  lng: number;
}

export interface DeliveryStop {
  id: string;
  name: string;
  code: 'Origin' | 'D1' | 'D2' | 'D3';
  address: string;
  city: string;
  coordinate: Coordinate;
  type: 'origin' | 'delivery' | 'destination';
  cargoDescription: string;
  packageCount: number;
  weightKg: number;
  recipient: string;
  plannedArrivalTime: string;
  color: string;
}

export interface RouteSegment {
  fromStopId: string;
  toStopId: string;
  distanceKm: number;
  estimatedDurationMins: number;
  waypoints: Coordinate[];
}

export interface TruckTelemetry {
  currentCoordinate: Coordinate;
  heading: number; // Degrees 0-360
  speedKmh: number;
  totalDistanceCoveredKm: number;
  totalRouteDistanceKm: number;
  currentSegmentIndex: number;
  currentLocationDescription: string;
  nextStop: DeliveryStop | null;
  completedStopsCount: number;
  totalStopsCount: number;
  estimatedTimeToNextStopSecs: number;
  estimatedTimeToDestinationSecs: number;
  fuelLevelPercent: number;
  batteryStatus: 'normal' | 'eco' | 'charging';
  engineTempC: number;
  signalStrength: 'excellent' | 'good' | 'fair';
  status: 'idle' | 'in_transit' | 'at_stop' | 'paused' | 'completed';
  dwellRemainingSecs?: number;
}

export interface SimulationControls {
  isPlaying: boolean;
  playbackSpeed: number; // 1x, 2x, 4x, 8x, 16x
  progressPercent: number; // 0 to 100
  followTruck: boolean;
  soundEnabled: boolean;
}

export type ThemeMode = 'dark' | 'light';
