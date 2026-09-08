import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatusPanel } from '../components/telemetry/StatusPanel';
import { TruckTelemetry } from '../types/logistics';
import { STOPS } from '../services/routeData';

const mockTelemetry: TruckTelemetry = {
  currentCoordinate: { lat: 18.9, lng: 73.1 },
  heading: 145,
  speedKmh: 62.4,
  totalDistanceCoveredKm: 4.2,
  totalRouteDistanceKm: 985.4,
  currentSegmentIndex: 0,
  currentLocationDescription: 'Between Origin → D1',
  nextStop: STOPS[1], // D1
  completedStopsCount: 0,
  totalStopsCount: 3,
  estimatedTimeToNextStopSecs: 840,
  estimatedTimeToDestinationSecs: 57000,
  fuelLevelPercent: 94,
  batteryStatus: 'eco',
  engineTempC: 84,
  signalStrength: 'excellent',
  status: 'in_transit',
};

describe('StatusPanel Component (FreightFox Wireframe Spec)', () => {
  it('renders the TRUCK STATUS title and card', () => {
    render(<StatusPanel telemetry={mockTelemetry} progressPercent={0.4} />);
    expect(screen.getByTestId('truck-status-panel')).toBeInTheDocument();
    expect(screen.getByText(/Truck Status/i)).toBeInTheDocument();
  });

  it('displays Current location matching wireframe (Between Origin -> D1)', () => {
    render(<StatusPanel telemetry={mockTelemetry} progressPercent={0.4} />);
    const locationEl = screen.getByTestId('status-current-location');
    expect(locationEl).toHaveTextContent('Between Origin → D1');
  });

  it('displays Distance covered (4.2 km)', () => {
    render(<StatusPanel telemetry={mockTelemetry} progressPercent={0.4} />);
    const distanceEl = screen.getByTestId('status-distance-covered');
    expect(distanceEl).toHaveTextContent(/4\.2 km/);
  });

  it('displays Next stop and Completed stops counter (D1 · Completed: 0/3)', () => {
    render(<StatusPanel telemetry={mockTelemetry} progressPercent={0.4} />);
    const nextStopEl = screen.getByTestId('status-next-stop');
    expect(nextStopEl).toHaveTextContent(/D1/);
    expect(nextStopEl).toHaveTextContent(/Completed: 0\/3/);
  });
});
