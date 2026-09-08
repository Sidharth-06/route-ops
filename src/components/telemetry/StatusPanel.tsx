import React from 'react';
import { Package, Clock, Navigation } from 'lucide-react';
import { TruckTelemetry } from '../../types/logistics';
import { formatDuration } from '../../services/telemetryService';

interface StatusPanelProps {
  telemetry: TruckTelemetry;
  progressPercent: number;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({
  telemetry,
  progressPercent,
}) => {
  const isPaused = telemetry.status === 'paused';
  const isDwell = telemetry.status === 'at_stop';

  return (
    <div className="truck-status-wireframe-card" data-testid="truck-status-panel">
      {/* Header with Live Indicator */}
      <div className="status-card-header">
        <span className="status-card-title">
          <span
            className={`live-indicator-dot ${
              isPaused ? 'paused' : isDwell ? 'dwell' : ''
            }`}
          />
          Truck Status
        </span>
        <span
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          {telemetry.status.toUpperCase().replace('_', ' ')}
        </span>
      </div>

      {/* Dwell Unload Notification Banner */}
      {isDwell && (
        <div className="dwell-alert-banner">
          <Package size={14} />
          <span>Unloading cargo... Resuming in {telemetry.dwellRemainingSecs}s</span>
        </div>
      )}

      {/* Metric 1: Current Location */}
      <div className="status-metric-row">
        <span className="status-label">Current:</span>
        <span className="status-value" data-testid="status-current-location">
          {telemetry.currentLocationDescription}
        </span>
      </div>

      {/* Metric 2: Distance covered */}
      <div className="status-metric-row">
        <span className="status-label">Distance covered:</span>
        <span className="status-value status-value-highlight" data-testid="status-distance-covered">
          {telemetry.totalDistanceCoveredKm} km
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-muted)',
              marginLeft: 6,
            }}
          >
            / {telemetry.totalRouteDistanceKm} km
          </span>
        </span>
      </div>

      {/* Metric 3: Next stop & Completed stops */}
      <div className="status-metric-row">
        <span className="status-label">Next stop:</span>
        <span className="status-value" data-testid="status-next-stop">
          {telemetry.nextStop ? (
            <>
              {telemetry.nextStop.code}
              <span
                style={{
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  margin: '0 6px',
                }}
              >
                ·
              </span>
              Completed: {telemetry.completedStopsCount}/{telemetry.totalStopsCount}
            </>
          ) : (
            <span style={{ color: 'var(--accent-emerald)' }}>
              Completed: 3/3 (All Delivered)
            </span>
          )}
        </span>
      </div>

      {/* ETA info pill */}
      {telemetry.nextStop && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: 'var(--text-secondary)',
            background: 'rgba(0, 0, 0, 0.15)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <Clock size={12} style={{ color: 'var(--accent-blue)' }} />
          <span>ETA to {telemetry.nextStop.code}: </span>
          <strong style={{ color: 'var(--accent-emerald)' }}>
            {formatDuration(telemetry.estimatedTimeToNextStopSecs)}
          </strong>
        </div>
      )}

      {/* Mini Progress Track */}
      <div className="status-mini-progress-track">
        <div
          className="status-mini-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
