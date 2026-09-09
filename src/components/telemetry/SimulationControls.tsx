import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Play, Pause, RotateCcw, Gauge, Zap } from 'lucide-react';
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

const SPEED_OPTIONS = [1, 2, 4];

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
  const [speedVisible, setSpeedVisible] = useState(true);

  return (
    <section className="playback-controller-bar" data-testid="playback-controller">
      <div className="controller-top-row">
        {/* Controls */}
        <div className="playback-controls-group">
          <button
            className="btn-play-pause"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 1 }} />}
          </button>

          <button
            className="btn btn-ghost btn-icon-only"
            onClick={onReset}
            title="Reset to origin"
            aria-label="Reset"
          >
            <RotateCcw size={13} />
          </button>

          {/* Speed toggle */}
          <button
            className={`btn btn-ghost speed-toggle-btn ${speedVisible ? 'active' : ''}`}
            onClick={() => setSpeedVisible((v) => !v)}
            title={speedVisible ? 'Hide speed' : 'Show speed'}
            aria-label="Toggle speed"
          >
            <Zap size={12} />
            <span className="speed-toggle-label">{playbackSpeed}×</span>
          </button>

          {/* Collapsible speed chips */}
          <AnimatePresence initial={false}>
            {speedVisible && (
              <motion.div
                className="speed-selector-group"
                initial={{ opacity: 0, scaleX: 0.8, originX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0, scaleX: 0.8 }}
                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              >
                {SPEED_OPTIONS.map((speed) => (
                  <button
                    key={speed}
                    className={`speed-chip ${playbackSpeed === speed ? 'active' : ''}`}
                    onClick={() => onSetSpeed(speed)}
                    title={`${speed}× speed`}
                    aria-label={`${speed}x`}
                  >
                    {speed}×
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live metrics */}
        <div className="controller-metrics">
          <div className="controller-metric">
            <Gauge size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span className="controller-metric-value">{telemetry.speedKmh}</span>
            <span className="controller-metric-label">km/h</span>
          </div>

          <div className="controller-metric">
            <span className="controller-metric-label">ETA</span>
            <span className="controller-metric-value" style={{ color: 'var(--accent-green)' }}>
              {formatDuration(telemetry.estimatedTimeToDestinationSecs)}
            </span>
          </div>
        </div>
      </div>

      {/* Scrubber */}
      <div className="scrubber-section">
        <span className="scrubber-time-badge">{telemetry.totalDistanceCoveredKm} km</span>
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={progressPercent}
          onChange={(e) => onScrub(parseFloat(e.target.value))}
          className="scrubber-slider"
          title="Scrub route"
          aria-label="Route progress"
        />
        <span className="scrubber-time-badge">{telemetry.totalRouteDistanceKm} km</span>
      </div>
    </section>
  );
};
