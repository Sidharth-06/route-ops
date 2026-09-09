import React from 'react';
import { Truck, Sun, Moon, Volume2, VolumeX, Navigation, SlidersHorizontal } from 'lucide-react';
import { ThemeMode, TruckTelemetry } from '../../types/logistics';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  telemetry: TruckTelemetry;
  followTruck: boolean;
  onToggleFollow: () => void;
  isDockOpen: boolean;
  onToggleDock: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  telemetry,
  followTruck,
  onToggleFollow,
  isDockOpen,
  onToggleDock,
}) => {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo-icon">
          <Truck size={16} strokeWidth={2.5} />
        </div>
        <div className="brand-info">
          <div className="brand-title">
            <span>RouteOps</span>
            <span className="brand-title-sep">|</span>
            <span className="brand-title-sub">Route Visualizer</span>
            <span className="trip-badge">RO-04-8842</span>
          </div>
          <div className="brand-subtitle">Fleet telemetry &amp; multi-stop delivery simulation</div>
        </div>
      </div>

      <div className="header-actions">
        <button
          className={`btn btn-ghost ${followTruck ? 'active' : ''}`}
          onClick={onToggleFollow}
          title={followTruck ? 'Camera locked to truck' : 'Free map pan'}
        >
          <Navigation size={13} />
          <span>{followTruck ? 'Tracking' : 'Free Cam'}</span>
        </button>

        <button
          className="btn btn-ghost btn-icon-only"
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute audio' : 'Enable audio'}
        >
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>

        <button
          className="btn btn-ghost btn-icon-only"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <button
          className={`btn btn-ghost ${isDockOpen ? 'active' : ''}`}
          onClick={onToggleDock}
          title="Toggle telemetry panel"
        >
          <SlidersHorizontal size={13} />
          <span>Telemetry</span>
        </button>
      </div>
    </header>
  );
};
