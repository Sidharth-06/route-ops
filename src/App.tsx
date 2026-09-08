import React, { useState, useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import { useTruckSimulation } from './hooks/useTruckSimulation';
import { Header } from './components/header/Header';
import { MapContainer } from './components/map/MapContainer';
import { StatusPanel } from './components/telemetry/StatusPanel';
import { SimulationControls } from './components/telemetry/SimulationControls';
import { TelemetryDock } from './components/telemetry/TelemetryDock';

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isDockOpen, setIsDockOpen] = useState<boolean>(true);

  const {
    isPlaying,
    playbackSpeed,
    followTruck,
    soundEnabled,
    telemetry,
    progressPercent,
    traversedPath,
    remainingPath,
    stops,
    togglePlay,
    reset,
    scrubToPercent,
    setSpeed,
    setFollowTruck,
    setSoundEnabled,
    skipToStop,
  } = useTruckSimulation();

  // Keyboard accessibility shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when focused on input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 't' || e.key === 'T') {
        toggleTheme();
      } else if (e.key === 'm' || e.key === 'M') {
        setSoundEnabled(!soundEnabled);
      } else if (e.key === 'f' || e.key === 'F') {
        setFollowTruck(!followTruck);
      } else if (e.key === 'r' || e.key === 'R') {
        reset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleTheme, soundEnabled, setSoundEnabled, followTruck, setFollowTruck, reset]);

  return (
    <div className="app-container" data-theme={theme}>
      {/* Top Application Header */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        telemetry={telemetry}
        followTruck={followTruck}
        onToggleFollow={() => setFollowTruck(!followTruck)}
        isDockOpen={isDockOpen}
        onToggleDock={() => setIsDockOpen(!isDockOpen)}
      />

      {/* Main Map & Telemetry Layout */}
      <main className="main-layout">
        <section className="map-section">
          {/* Interactive Leaflet Map with Animated Route */}
          <MapContainer
            theme={theme}
            traversedPath={traversedPath}
            remainingPath={remainingPath}
            telemetry={telemetry}
            stops={stops}
            followTruck={followTruck}
          />

          {/* Floating TRUCK STATUS Wireframe Card (Matching FreightFox spec) */}
          <StatusPanel
            telemetry={telemetry}
            progressPercent={progressPercent}
          />

          {/* Bottom Simulation Controller */}
          <SimulationControls
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onReset={reset}
            playbackSpeed={playbackSpeed}
            onSetSpeed={setSpeed}
            progressPercent={progressPercent}
            onScrub={scrubToPercent}
            telemetry={telemetry}
          />
        </section>

        {/* Right-Side Telemetry & Manifest Dock */}
        <TelemetryDock
          isOpen={isDockOpen}
          onClose={() => setIsDockOpen(false)}
          telemetry={telemetry}
          stops={stops}
          onSkipToStop={skipToStop}
        />
      </main>
    </div>
  );
};

export default App;
