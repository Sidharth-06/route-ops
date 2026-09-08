import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SimulationControls } from '../components/telemetry/SimulationControls';
import { TruckTelemetry } from '../types/logistics';
import { STOPS } from '../services/routeData';

const mockTelemetry: TruckTelemetry = {
  currentCoordinate: { lat: 18.9, lng: 73.1 },
  heading: 145,
  speedKmh: 60,
  totalDistanceCoveredKm: 50,
  totalRouteDistanceKm: 985.4,
  currentSegmentIndex: 0,
  currentLocationDescription: 'Between Origin → D1',
  nextStop: STOPS[1],
  completedStopsCount: 0,
  totalStopsCount: 3,
  estimatedTimeToNextStopSecs: 600,
  estimatedTimeToDestinationSecs: 50000,
  fuelLevelPercent: 90,
  batteryStatus: 'eco',
  engineTempC: 84,
  signalStrength: 'excellent',
  status: 'in_transit',
};

describe('SimulationControls Component (Bonus Features)', () => {
  it('triggers onTogglePlay when play/pause button is clicked', () => {
    const handleTogglePlay = vi.fn();
    render(
      <SimulationControls
        isPlaying={true}
        onTogglePlay={handleTogglePlay}
        onReset={vi.fn()}
        playbackSpeed={1}
        onSetSpeed={vi.fn()}
        progressPercent={5}
        onScrub={vi.fn()}
        telemetry={mockTelemetry}
      />
    );

    const playPauseBtn = screen.getByLabelText('Pause');
    fireEvent.click(playPauseBtn);
    expect(handleTogglePlay).toHaveBeenCalledTimes(1);
  });

  it('triggers onSetSpeed when a speed chip (e.g. 4x) is clicked', () => {
    const handleSetSpeed = vi.fn();
    render(
      <SimulationControls
        isPlaying={true}
        onTogglePlay={vi.fn()}
        onReset={vi.fn()}
        playbackSpeed={1}
        onSetSpeed={handleSetSpeed}
        progressPercent={5}
        onScrub={vi.fn()}
        telemetry={mockTelemetry}
      />
    );

    const chip4x = screen.getByRole('button', { name: '4x' });
    fireEvent.click(chip4x);
    expect(handleSetSpeed).toHaveBeenCalledWith(4);
  });

  it('triggers onScrub when the scrubber range input changes', () => {
    const handleScrub = vi.fn();
    render(
      <SimulationControls
        isPlaying={true}
        onTogglePlay={vi.fn()}
        onReset={vi.fn()}
        playbackSpeed={1}
        onSetSpeed={vi.fn()}
        progressPercent={5}
        onScrub={handleScrub}
        telemetry={mockTelemetry}
      />
    );

    const slider = screen.getByLabelText('Route progress');
    fireEvent.change(slider, { target: { value: '45' } });
    expect(handleScrub).toHaveBeenCalledWith(45);
  });
});
