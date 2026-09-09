import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  CheckCircle2,
  BatteryCharging,
  Thermometer,
  Wifi,
  Weight,
  X,
  Package,
} from 'lucide-react';
import { DeliveryStop, TruckTelemetry } from '../../types/logistics';
import { formatDuration, formatClockETA } from '../../services/telemetryService';

interface TelemetryDockProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: TruckTelemetry;
  stops: DeliveryStop[];
  onSkipToStop: (code: 'Origin' | 'D1' | 'D2' | 'D3') => void;
}

export const TelemetryDock: React.FC<TelemetryDockProps> = ({
  isOpen,
  onClose,
  telemetry,
  stops,
  onSkipToStop,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          className="telemetry-dock"
          data-testid="telemetry-dock"
          initial={{ opacity: 0, x: 48, width: 0 }}
          animate={{ opacity: 1, x: 0, width: 300 }}
          exit={{ opacity: 0, x: 48, width: 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden', flexShrink: 0 }}
        >
          {/* Header */}
          <div className="dock-header">
            <div className="dock-title">
              <Activity size={12} />
              TELEMETRY
            </div>
            <button
              className="btn btn-ghost btn-icon-only"
              onClick={onClose}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>

          <div className="dock-body">
            {/* Speed & ETA */}
            <div className="dock-section">
              <div className="dock-section-header">
                <span>VEHICLE STATUS</span>
              </div>
              <div className="dock-stats-row">
                <div className="dock-stat-cell">
                  <span className="dock-stat-label">Speed</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span className="dock-stat-value">{Math.round(telemetry.speedKmh)}</span>
                    <span className="dock-stat-unit">km/h</span>
                  </div>
                </div>
                <div className="dock-stat-divider" />
                <div className="dock-stat-cell">
                  <span className="dock-stat-label">Trip ETA</span>
                  <span className="dock-eta-value">
                    {formatDuration(telemetry.estimatedTimeToDestinationSecs)}
                  </span>
                  <span className="dock-stat-unit" style={{ marginTop: 4 }}>
                    by {formatClockETA(telemetry.estimatedTimeToDestinationSecs)}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Stops */}
            <div className="dock-section">
              <div className="dock-section-header">
                <span>DELIVERY SCHEDULE</span>
                <span style={{ color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                  {telemetry.completedStopsCount}/{telemetry.totalStopsCount}
                </span>
              </div>
              <div className="dock-stop-list">
                {stops.map((stop, idx) => {
                  let isPassed = false;
                  let isCurrent = false;

                  if (idx === 0) {
                    isPassed = telemetry.totalDistanceCoveredKm > 0.5;
                    isCurrent = telemetry.totalDistanceCoveredKm <= 0.5;
                  } else if (idx === 1) {
                    isPassed = telemetry.completedStopsCount >= 1;
                    isCurrent =
                      telemetry.completedStopsCount === 0 &&
                      telemetry.totalDistanceCoveredKm > 0.5;
                  } else if (idx === 2) {
                    isPassed = telemetry.completedStopsCount >= 2;
                    isCurrent = telemetry.completedStopsCount === 1;
                  } else if (idx === 3) {
                    isPassed = telemetry.completedStopsCount >= 3;
                    isCurrent = telemetry.completedStopsCount === 2;
                  }

                  const statusLabel = isPassed
                    ? 'Delivered'
                    : isCurrent
                    ? 'En Route'
                    : 'Scheduled';
                  const statusClass = isPassed
                    ? 'status-delivered'
                    : isCurrent
                    ? 'status-en-route'
                    : 'status-scheduled';

                  return (
                    <div
                      key={stop.id}
                      className="dock-stop-item"
                      onClick={() => onSkipToStop(stop.code)}
                      title={`Jump to ${stop.name}`}
                    >
                      <div className="dock-stop-left">
                        <div
                          className={`dock-stop-node ${
                            isPassed ? 'passed' : isCurrent ? 'current' : ''
                          }`}
                        >
                          {isPassed ? (
                            <CheckCircle2 size={11} />
                          ) : (
                            stop.code.replace('Origin', 'O')
                          )}
                        </div>
                        {idx < stops.length - 1 && (
                          <div className={`dock-stop-line ${isPassed ? 'passed' : ''}`} />
                        )}
                      </div>

                      <div className="dock-stop-body">
                        <div className="dock-stop-name">
                          <span>{stop.name}</span>
                          <span className={`dock-stop-status ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <div className="dock-stop-detail">{stop.city} · {stop.address}</div>
                        <div className="dock-stop-cargo">
                          <Package size={9} />
                          {stop.cargoDescription} · {stop.weightKg} kg
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Diagnostics */}
            <div className="dock-section">
              <div className="dock-section-header">
                <span>DIAGNOSTICS</span>
              </div>
              <div className="dock-diag-grid">
                <div className="dock-diag-cell">
                  <span className="dock-diag-label">
                    <BatteryCharging size={10} style={{ display: 'inline', marginRight: 4 }} />
                    Fuel / Battery
                  </span>
                  <span
                    className="dock-diag-value"
                    style={{ color: 'var(--accent-green)' }}
                  >
                    {telemetry.fuelLevelPercent}%
                  </span>
                </div>

                <div className="dock-diag-cell">
                  <span className="dock-diag-label">
                    <Thermometer size={10} style={{ display: 'inline', marginRight: 4 }} />
                    Powertrain
                  </span>
                  <span className="dock-diag-value">{telemetry.engineTempC} °C</span>
                </div>

                <div className="dock-diag-cell">
                  <span className="dock-diag-label">
                    <Wifi size={10} style={{ display: 'inline', marginRight: 4 }} />
                    Telematics
                  </span>
                  <span
                    className="dock-diag-value"
                    style={{ color: 'var(--accent-cyan)', fontSize: 10 }}
                  >
                    5G · Active
                  </span>
                </div>

                <div className="dock-diag-cell">
                  <span className="dock-diag-label">
                    <Weight size={10} style={{ display: 'inline', marginRight: 4 }} />
                    Payload
                  </span>
                  <span className="dock-diag-value">16,900 kg</span>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
