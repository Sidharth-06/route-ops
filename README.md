# RouteOps

RouteOps is a focused fleet-operations simulator for a multi-stop delivery run across western and southern India. It combines a live Leaflet route map, animated telemetry, delivery-stop state, and an interactive 3D vehicle scene in a compact operations UI.

**Live demo:** [routeops-simulation.vercel.app](https://routeops-simulation.vercel.app)

## What it includes

- Mumbai → Pune → Kolhapur → Bengaluru route visualization
- Traversed and remaining route trails with animated vehicle position
- Actual Khronos Cesium Milk Truck 3D model rendered with React Three Fiber
- Live speed, distance, ETA, stop completion, and dwell-state telemetry
- Route rail with delivery-stop navigation, reset, and 1× / 2× / 4× speed controls
- Telemetry dock with manifest details and vehicle diagnostics
- Dark and light themes with persisted preference
- Keyboard shortcuts for playback, theme, sound, follow mode, and reset
- Responsive layout for desktop and smaller screens

## Tech stack

- React 19 + TypeScript
- Vite
- Leaflet + OpenStreetMap tiles
- Three.js + React Three Fiber
- Lucide React
- Motion
- Vitest + React Testing Library
- CSS custom-property design system

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Useful commands:

```bash
npm test       # Run the test suite
npm run build  # Type-check and create a production build
npm run preview
```

## Controls

The route rail provides the visible controls:

- **Reset run** — return to the origin and resume automatically
- **1× / 2× / 4×** — change simulation speed
- Clicking a stop — jump the vehicle to that stop

Keyboard shortcuts:

| Key | Action |
| --- | --- |
| `Space` | Play or pause the simulation |
| `R` | Reset to the origin and resume |
| `T` | Toggle dark/light theme |
| `M` | Toggle sound feedback |
| `F` | Toggle follow-vehicle camera mode |

## Project structure

```text
src/
├── components/
│   ├── header/        # Global navigation and telemetry toggles
│   ├── map/           # Leaflet map and 3D vehicle scene
│   ├── route/         # Route rail, stop list, and simulation controls
│   └── telemetry/     # Telemetry dock and status components
├── hooks/             # Simulation and theme state
├── services/          # Route data, interpolation, ETA, and audio feedback
├── styles/            # Global tokens, map styles, and component styles
└── tests/             # UI and telemetry tests
```

## 3D model attribution

The vehicle scene uses the Khronos Group **Cesium Milk Truck** glTF sample model. The asset is included at `public/models/CesiumMilkTruck.glb` under the terms described in [CesiumMilkTruck-LICENSE.md](public/models/CesiumMilkTruck-LICENSE.md).
