import React from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  BatteryCharging,
  Thermometer,
  Wifi,
  Weight,
  X,
  ChevronRight,
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
  if (!isOpen) return null;

  return (
    <aside className="telemetry-dock" data-testid="telemetry-dock">
      <div className="dock-header">
        <div className="dock-title">
          <Activity size={18} style={{ color: 'var(--accent-blue)' }} />
          <span>Vehicle Telemetry & Manifest</span>
        </div>
        <button
          className="btn btn-ghost btn-icon-only"
          onClick={onClose}
          title="Close Dock"
        >
          <X size={18} />
        </button>
      </div>

      <div className="dock-body">
        {/* Speedometer & ETA Card */}
        <div className="gauge-card">
          <div className="speed-digital-display">
            <span className="speed-number">{Math.round(telemetry.speedKmh)}</span>
            <span className="speed-unit">Current Speed (km/h)</span>
          </div>

          <div className="gauge-divider" />

          <div className="eta-display">
            <span className="eta-time">
              {formatDuration(telemetry.estimatedTimeToDestinationSecs)}
            </span>
            <span className="eta-label">
              Total ETA ({formatClockETA(telemetry.estimatedTimeToDestinationSecs)})
            </span>
          </div>
        </div>

        {/* Delivery Stops Checklist */}
        <div className="stops-stepper-card">
          <div className="card-title">
            <span>Delivery Schedule (3 Stops)</span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--accent-emerald)',
                fontWeight: 700,
              }}
            >
              {telemetry.completedStopsCount} of {telemetry.totalStopsCount} Complete
            </span>
          </div>

          <div className="stepper-list">
            {stops.map((stop, idx) => {
              // Determine status
              let isPassed = false;
              let isCurrent = false;

              if (idx === 0) {
                // Origin
                isPassed = telemetry.totalDistanceCoveredKm > 0.5;
                isCurrent = telemetry.totalDistanceCoveredKm <= 0.5;
              } else if (idx === 1) {
                // D1
                isPassed = telemetry.completedStopsCount >= 1;
                isCurrent =
                  telemetry.completedStopsCount === 0 &&
                  telemetry.totalDistanceCoveredKm > 0.5;
              } else if (idx === 2) {
                // D2
                isPassed = telemetry.completedStopsCount >= 2;
                isCurrent = telemetry.completedStopsCount === 1;
              } else if (idx === 3) {
                // D3
                isPassed = telemetry.completedStopsCount >= 3;
                isCurrent = telemetry.completedStopsCount === 2;
              }

              return (
                <div
                  key={stop.id}
                  className="stepper-item"
                  onClick={() => onSkipToStop(stop.code)}
                  title={`Click to jump simulation to ${stop.name}`}
                >
                  {/* Stepper connecting line */}
                  {idx < stops.length - 1 && (
                    <div
                      className={`stepper-line ${isPassed ? 'passed' : ''}`}
                    />
                  )}

                  <div className="stepper-icon-col">
                    <div
                      className={`stepper-node ${
                        isPassed ? 'passed' : isCurrent ? 'current' : ''
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        stop.code.slice(-2) || stop.code[0]
                      )}
                    </div>
                  </div>

                  <div className="stepper-content">
                    <div className="stepper-stop-name">
                      <span>{stop.name}</span>
                      <span
                        className="stepper-stop-badge"
                        style={{
                          backgroundColor: isPassed
                            ? 'rgba(16, 185, 129, 0.15)'
                            : isCurrent
                            ? 'rgba(59, 130, 246, 0.15)'
                            : 'rgba(255, 255, 255, 0.06)',
                          color: isPassed
                            ? 'var(--accent-emerald)'
                            : isCurrent
                            ? 'var(--accent-blue)'
                            : 'var(--text-muted)',
                        }}
                      >
                        {isPassed ? 'Delivered' : isCurrent ? 'En Route' : 'Scheduled'}
                      </span>
                    </div>

                    <div className="stepper-stop-details">
                      {stop.city} · {stop.address}
                    </div>

                    <div className="stepper-cargo-tag">
                      <strong>Cargo:</strong> {stop.cargoDescription} ({stop.weightKg} kg)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hardware & Diagnostics */}
        <div className="diagnostics-grid">
          <div className="diagnostic-item">
            <span className="diag-label">
              <BatteryCharging size={13} style={{ color: 'var(--accent-emerald)' }} />
              Battery / Fuel
            </span>
            <span className="diag-val" style={{ color: 'var(--accent-emerald)' }}>
              {telemetry.fuelLevelPercent}% (Eco-Hybrid)
            </span>
          </div>

          <div className="diagnostic-item">
            <span className="diag-label">
              <Thermometer size={13} style={{ color: 'var(--accent-amber)' }} />
              Powertrain Temp
            </span>
            <span className="diag-val">{telemetry.engineTempC} °C</span>
          </div>

          <div className="diagnostic-item">
            <span className="diag-label">
              <Wifi size={13} style={{ color: 'var(--accent-blue)' }} />
              GPS / Telematics
            </span>
            <span className="diag-val" style={{ color: 'var(--accent-blue)' }}>
              5G Satellite (Active)
            </span>
          </div>

          <div className="diagnostic-item">
            <span className="diag-label">
              <Weight size={13} style={{ color: 'var(--text-muted)' }} />
              Total Payload
            </span>
            <span className="diag-val">16,900 kg</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
