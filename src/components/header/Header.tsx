import React from 'react';
import {
  Truck,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Radio,
  SlidersHorizontal,
  Navigation,
} from 'lucide-react';
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
          <Truck size={20} strokeWidth={2.2} />
        </div>
        <div className="brand-info">
          <div className="brand-title">
            <span>FreightFox</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>|</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Route Visualizer</span>
            <span className="trip-badge">MH-04-FF-8842</span>
          </div>
          <div className="brand-subtitle">
            Autonomous Freight Telemetry & Multi-Stop Delivery Simulation
          </div>
        </div>
      </div>

      <div className="header-actions">
        {/* Follow Truck Toggle */}
        <button
          className={`btn btn-ghost ${followTruck ? 'active' : ''}`}
          onClick={onToggleFollow}
          title={followTruck ? 'Camera locked to truck' : 'Free map pan'}
        >
          <Navigation size={15} style={{ transform: followTruck ? 'rotate(45deg)' : 'none' }} />
          <span>{followTruck ? 'Tracking' : 'Free Camera'}</span>
        </button>

        {/* Audio Mute/Unmute */}
        <button
          className="btn btn-ghost btn-icon-only"
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Sound' : 'Enable Audio Feedback'}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {/* Theme Toggle (Bonus Requirement) */}
        <button
          className="btn btn-ghost btn-icon-only"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Toggle Telemetry Dock */}
        <button
          className={`btn btn-ghost ${isDockOpen ? 'active' : ''}`}
          onClick={onToggleDock}
          title="Toggle Telemetry Panel"
        >
          <SlidersHorizontal size={16} />
          <span>Telemetry</span>
        </button>
      </div>
    </header>
  );
};
