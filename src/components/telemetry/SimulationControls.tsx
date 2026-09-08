import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Gauge } from 'lucide-react';
import { TruckTelemetry } from '../../types/logistics';
import { formatDuration } from '../../services/telemetryService';

interface SimulationControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  playbackSpeed: number;
  onSetSpeed: (speed: number) => void;
  progressPercent: number;
  onScrub: (percent: number) => void;
  telemetry: TruckTelemetry;
}

const SPEED_OPTIONS = [1, 2, 4, 8, 16];

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onReset,
  playbackSpeed,
  onSetSpeed,
  progressPercent,
  onScrub,
  telemetry,
}) => {
  return (
    <div className="playback-controller-bar" data-testid="playback-controller">
      <div className="controller-top-row">
        {/* Play / Pause / Reset group */}
        <div className="playback-controls-group">
          <button
            className="btn-play-pause"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause Simulation (Space)' : 'Resume Simulation (Space)'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={20} fill="#ffffff" />
            ) : (
              <Play size={20} fill="#ffffff" style={{ marginLeft: 2 }} />
            )}
          </button>

          <button
            className="btn btn-ghost btn-icon-only"
            onClick={onReset}
            title="Reset Simulation to Origin"
            aria-label="Reset"
          >
            <RotateCcw size={17} />
          </button>

          {/* Speed Multipliers */}
          <div className="speed-selector-group">
            {SPEED_OPTIONS.map((speed) => (
              <button
                key={speed}
                className={`speed-chip ${playbackSpeed === speed ? 'active' : ''}`}
                onClick={() => onSetSpeed(speed)}
                title={`Run simulation at ${speed}x speed`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Live Metrics Highlights */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Gauge size={15} style={{ color: 'var(--accent-blue)' }} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {telemetry.speedKmh} km/h
            </span>
          </div>

          <div
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span>Trip ETA: </span>
            <strong style={{ color: 'var(--accent-emerald)' }}>
              {formatDuration(telemetry.estimatedTimeToDestinationSecs)}
            </strong>
          </div>
        </div>
      </div>

      {/* Timeline Scrubber */}
      <div className="scrubber-section">
        <span className="scrubber-time-badge">
          {telemetry.totalDistanceCoveredKm} km
        </span>

        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={progressPercent}
          onChange={(e) => onScrub(parseFloat(e.target.value))}
          className="scrubber-slider"
          title="Drag to scrub along route"
          aria-label="Route progress"
        />

        <span className="scrubber-time-badge">
          {telemetry.totalRouteDistanceKm} km
        </span>
      </div>
    </div>
  );
};
