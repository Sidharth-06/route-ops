import { describe, it, expect } from 'vitest';
import {
  calculateDistanceKm,
  calculateBearing,
  formatDuration,
  formatClockETA,
  getInterpolatedPosition,
  computeTruckTelemetry,
} from '../services/telemetryService';
import { STOPS, ROUTE_WAYPOINTS } from '../services/routeData';

describe('Telemetry Service & Math Calculations', () => {
  it('calculates geographic distance using Haversine accurately', () => {
    // Distance between Mumbai (19.0760, 72.8777) and Pune (18.5204, 73.8567) is ~120-150 km
    const dist = calculateDistanceKm(STOPS[0].coordinate, STOPS[1].coordinate);
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeLessThan(160);
  });

  it('calculates heading bearing between 0 and 360 degrees', () => {
    // Heading south-east from Mumbai to Pune
    const bearing = calculateBearing(STOPS[0].coordinate, STOPS[1].coordinate);
    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThanOrEqual(360);
  });

  it('formats durations cleanly into human readable units', () => {
    expect(formatDuration(0)).toBe('Arrived');
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(840)).toBe('14 mins');
    expect(formatDuration(3600)).toBe('1h');
    expect(formatDuration(4500)).toBe('1h 15m');
  });

  it('interpolates intermediate positions between waypoints correctly', () => {
    const startPos = getInterpolatedPosition(0);
    expect(startPos.coordinate.lat).toBeCloseTo(ROUTE_WAYPOINTS[0].lat, 2);
    expect(startPos.coordinate.lng).toBeCloseTo(ROUTE_WAYPOINTS[0].lng, 2);

    const midPos = getInterpolatedPosition(5.5);
    expect(midPos.coordinate).toBeDefined();
    expect(midPos.heading).toBeGreaterThanOrEqual(0);
  });

  it('computes telemetry matching the FreightFox assignment specification', () => {
    // Initial position between Origin and D1
    const telemetry = computeTruckTelemetry(2, 1, false, false, 0);
    expect(telemetry.currentLocationDescription).toBe('Between Origin → D1');
    expect(telemetry.nextStop?.code).toBe('D1');
    expect(telemetry.completedStopsCount).toBe(0);
    expect(telemetry.totalStopsCount).toBe(3);
    expect(telemetry.totalDistanceCoveredKm).toBeGreaterThan(0);
    expect(telemetry.status).toBe('in_transit');
  });
});
