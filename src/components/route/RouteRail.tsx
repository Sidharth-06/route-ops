import React from 'react';
import { Check, Crosshair, MapPin, RotateCcw } from 'lucide-react';
import { DeliveryStop, TruckTelemetry } from '../../types/logistics';

interface RouteRailProps {
  telemetry: TruckTelemetry;
  stops: DeliveryStop[];
  onSkipToStop: (code: 'Origin' | 'D1' | 'D2' | 'D3') => void;
  onReset: () => void;
  playbackSpeed: number;
  onSetSpeed: (speed: number) => void;
}

const SPEED_OPTIONS = [1, 2, 4];

export const RouteRail: React.FC<RouteRailProps> = ({
  telemetry,
  stops,
  onSkipToStop,
  onReset,
  playbackSpeed,
  onSetSpeed,
}) => {
  const progress = Math.min(
    100,
    Math.round((telemetry.totalDistanceCoveredKm / telemetry.totalRouteDistanceKm) * 100)
  );

  const etaMins = Math.ceil(telemetry.estimatedTimeToDestinationSecs / 60);

  return (
    <aside className="route-rail" aria-label="Active route">
      {/* Kicker */}
      <div className="rail-kicker">
        <span className="rail-kicker-dot" />
        ACTIVE RUN
      </div>

      {/* Heading */}
      <div className="rail-heading-row">
        <h1>West Coast</h1>
        <p>Multi-stop delivery</p>
        <span className="rail-live-chip">
          <span className="rail-live-chip-dot" />
          LIVE
        </span>
      </div>

      {/* Route summary */}
      <div className="rail-route-summary">
        <div className="rail-endpoint">
          <span className="rail-endpoint-dot origin" />
          Mumbai
        </div>
        <div className="rail-route-line">
          <div className="rail-route-line-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="rail-endpoint">
          <span className="rail-endpoint-dot destination" />
          Bengaluru
        </div>
      </div>

      {/* Metrics */}
      <div className="rail-metrics">
        <div className="rail-metric-cell">
          <span className="rail-metric-label">Distance</span>
          <span className="rail-metric-value">{telemetry.totalDistanceCoveredKm}</span>
          <span className="rail-metric-sub">/ {telemetry.totalRouteDistanceKm} km</span>
        </div>
        <div className="rail-metric-cell">
          <span className="rail-metric-label">ETA</span>
          <span className="rail-metric-value">{etaMins}</span>
          <span className="rail-metric-sub">min remaining</span>
        </div>
      </div>

      <div className="rail-simulation-controls" aria-label="Simulation controls">
        <div className="rail-control-heading">Simulation</div>
        <div className="rail-control-row">
          <button className="rail-reset-button" onClick={onReset} type="button">
            <RotateCcw size={13} />
            Reset run
          </button>
          <div className="rail-speed-control" aria-label="Playback speed">
            <span>Speed</span>
            <div className="rail-speed-options">
              {SPEED_OPTIONS.map((speed) => (
                <button
                  key={speed}
                  className={playbackSpeed === speed ? 'active' : ''}
                  onClick={() => onSetSpeed(speed)}
                  type="button"
                  aria-label={`${speed}x speed`}
                >
                  {speed}×
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stop section heading */}
      <div className="rail-section-heading">
        <span>Stops</span>
        <span className="rail-section-count">
          {telemetry.completedStopsCount}/{telemetry.totalStopsCount}
        </span>
      </div>

      {/* Stop list */}
      <div className="rail-stop-list">
        {stops.map((stop, idx) => {
          const isPassed =
            idx === 0
              ? telemetry.totalDistanceCoveredKm > 0.5
              : telemetry.completedStopsCount >= idx;
          const isCurrent =
            idx === 0
              ? telemetry.totalDistanceCoveredKm <= 0.5
              : telemetry.completedStopsCount === idx - 1;

          return (
            <button
              className={`rail-stop ${isCurrent ? 'current' : ''} ${isPassed ? 'passed' : ''}`}
              key={stop.id}
              onClick={() => onSkipToStop(stop.code)}
              title={`Jump to ${stop.name}`}
            >
              <span className="rail-stop-marker">
                {isPassed ? (
                  <Check size={10} />
                ) : isCurrent ? (
                  <Crosshair size={10} />
                ) : (
                  <MapPin size={10} />
                )}
              </span>
              <span className="rail-stop-copy">
                <strong>{stop.code === 'Origin' ? 'Origin' : stop.name}</strong>
                <small>
                  {stop.city} ·{' '}
                  {isPassed ? 'Delivered' : isCurrent ? 'In transit' : 'Scheduled'}
                </small>
              </span>
              <span className="rail-stop-index">0{idx + 1}</span>
            </button>
          );
        })}
      </div>

      <div className="rail-footer">
        <span>Route follows vehicle position</span>
      </div>
    </aside>
  );
};
