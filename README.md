# RouteOps Logistics Route Simulator

An enterprise-grade frontend application that simulates an autonomous freight vehicle navigating through multi-stop delivery locations (**Origin → D1 → D2 → D3**) with live telemetry, heading rotation, dynamic status cards, and interactive playback controls.

An interactive route simulation for fleet operations teams.

---

## 🌟 Features

### 1. Interactive Route Map
- **Stops Display**:
  - **Origin**: Mumbai Central Logistics Hub (Green radar pulse dot)
  - **D1**: Pune Industrial DC (Red pin marker)
  - **D2**: Kolhapur Gateway Terminal (Amber pin marker)
  - **D3**: Bengaluru Tech Mega Warehouse (Slate destination pin)
- **Route Visualization**:
  - **Traversed Trail**: Solid emerald green path (`#10b981`)
  - **Remaining Route**: Dashed electric blue path (`#3b82f6`) matching the assignment wireframe
- **Animated Truck Marker**:
  - Vehicle marker smoothly interpolating across highway waypoints
  - Real-time **heading/bearing rotation** ($\Delta \theta$ degree calculation) so the truck naturally steers along turns
  - Floating live speed tag above the vehicle
  - Pulsing radar halo under the chassis

### 2. Live Truck Status Panel (Wireframe Spec)
Floating glassmorphic card displaying:
- **Current Location**: Real-time location description (e.g. `Between Origin → D1`, `At Delivery Point D1`)
- **Distance Covered**: Dynamic km tracker (e.g. `4.2 km / 985.4 km`)
- **Next Stop**: Upcoming stop name and remaining distance
- **Completed Stops**: Live counter (`0/3`, `1/3`, `2/3`, `3/3`)
- **ETA**: Dynamic arrival duration based on current vehicle speed
- **Dwell Mode**: Simulates a 3-second cargo unloading stop when arriving at D1 and D2

### 3. Bonus Capabilities
- **Pause & Resume**: Spacebar shortcut or play/pause button to pause and resume live tracking
- **Dynamic ETA Engine**: Computes exact arrival estimates for the next waypoint and overall destination
- **Dark Mode & Light Mode**: One-click theme toggle with a shared, accessible design system
- **Simulation Speed Controls**: Fast-forward simulation with `1x`, `2x`, `4x`, `8x`, `16x` multiplier chips
- **Timeline Scrubber Slider**: Seek and drag to any percentage or distance along the delivery route
- **Interactive Telemetry Dock**:
  - Digital speedometer readout
  - Delivery schedule timeline with cargo manifests and payloads (kg)
  - Click any stop in the schedule to jump the vehicle directly to that destination
  - Powertrain diagnostics: Eco-Hybrid battery/fuel level, engine temperature, and 5G GPS telematics signal
- **Audio Feedback**: Subtle synthesized Web Audio API sound effects for clicks, arrival chimes, and completion fanfare
- **Trip Celebration**: Confetti animation upon reaching final delivery point D3

---

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Map Engine**: Leaflet (custom DivIcons, tile layers, and dynamic polylines)
- **Icons**: Lucide React
- **Celebration Effects**: Canvas Confetti
- **Testing**: Vitest + React Testing Library + jsdom
- **Styling**: Vanilla CSS Design System with CSS Custom Properties and Glassmorphism (no external CSS bloat)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Automated Tests
```bash
npm run test
```

### 4. Build for Production
```bash
npm run build
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `Space` | Toggle Play / Pause simulation |
| `T` | Toggle Dark / Light theme |
| `M` | Mute / Unmute audio feedback |
| `F` | Toggle camera tracking / Free map pan |
| `R` | Reset simulation to Origin |

---

## 📁 Project Structure

```
src/
├── types/
│   └── logistics.ts              # Route, Stop, Telemetry, Simulation types
├── services/
│   ├── routeData.ts              # Origin, D1, D2, D3 coordinates, and waypoint generation
│   └── telemetryService.ts       # Haversine distance, bearing math, ETA, and Web Audio
├── hooks/
│   ├── useTruckSimulation.ts     # 60fps interpolation loop, dwell timer, and playback state
│   └── useTheme.ts               # Theme management (dark/light mode persistence)
├── components/
│   ├── header/
│   │   └── Header.tsx            # App branding, vehicle badge, and global toggles
│   ├── map/
│   │   └── MapContainer.tsx      # Leaflet map, custom SVG DivIcons, and dynamic polylines
│   ├── telemetry/
│   │   ├── StatusPanel.tsx       # Pixel-accurate wireframe TRUCK STATUS card
│   │   ├── SimulationControls.tsx# Play/Pause, speed multipliers, and scrubber
│   │   └── TelemetryDock.tsx     # Speedometer, schedule stepper, and diagnostics
├── styles/
│   ├── variables.css             # Design tokens and theme colors
│   ├── global.css                # Base layout, typography, and animations
│   ├── map.css                   # Custom map pin and truck marker styles
│   └── components.css            # Controls, status card, and dock styling
├── tests/
│   ├── telemetryService.test.ts  # Math and telemetry unit tests
│   ├── StatusPanel.test.tsx      # Wireframe spec validation tests
│   └── SimulationControls.test.tsx# Controls and bonus feature tests
├── App.tsx                       # Main application shell
└── main.tsx                      # Entry point
```
