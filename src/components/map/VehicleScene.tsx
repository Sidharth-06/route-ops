import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group } from 'three';
import { Component, ErrorInfo, ReactNode } from 'react';

interface VehicleSceneProps {
  isMoving: boolean;
  heading?: number;
}

/* ── Error boundary ── */
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e: Error, i: ErrorInfo) {
    console.error('[VehicleScene] GLTF load failed', e, i);
  }
  render() {
    return this.state.hasError
      ? <div className="vehicle-scene-fallback">Model offline</div>
      : this.props.children;
  }
}

/* Preload once at module parse time — model is ready before mount */
useGLTF.preload('/models/CesiumMilkTruck.glb');

/* ── The Cesium Milk Truck default GLTF orientation faces +Z in Three.js world
      space (i.e. its nose points toward the viewer when camera is at [0,y,+z]).
      The map bearing convention is:
        0°  = North  →  world −Z (truck faces away from camera)
        90° = East   →  world +X
        180°= South  →  world +Z (truck faces toward camera, i.e. default pose)
        270°= West   →  world −X
      Therefore:  rotation.y = π − (heading × π/180)             ── */
function TruckModel({ isMoving, heading = 0 }: VehicleSceneProps) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF('/models/CesiumMilkTruck.glb');

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // Heading → Three.js rotation.y (see formula above)
    groupRef.current.rotation.y = Math.PI - (heading * Math.PI) / 180;

    // Subtle road-bounce when driving
    groupRef.current.position.y = isMoving ? Math.sin(t * 7) * 0.008 : 0;
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={0.62} />
    </group>
  );
}

/* ── Canvas wrapper ── */
export function VehicleScene({ isMoving, heading = 0 }: VehicleSceneProps) {
  return (
    <div className="vehicle-scene" aria-hidden="true">
      <ErrorBoundary>
        <Suspense fallback={<div className="vehicle-scene-fallback">Loading…</div>}>
          <Canvas
            dpr={[1, 2]}
            camera={{ position: [0, 2.8, 4.2], fov: 40, near: 0.1, far: 100 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            shadows
          >
            {/* Neutral sky + sun lighting — no Stage so heading is fully ours */}
            <ambientLight intensity={1.8} />
            <directionalLight
              position={[4, 8, 5]}
              intensity={2.6}
              color="#fff8f0"
              castShadow
              shadow-mapSize={[512, 512]}
            />
            <directionalLight position={[-3, 3, -2]} intensity={0.9} color="#c8deff" />
            <hemisphereLight
              args={['#dce8ff', '#3a3a3a', 0.8]}
            />

            <TruckModel isMoving={isMoving} heading={heading} />

            {/* Soft ground shadow disc */}
            <mesh position={[0, -0.01, 0.1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <circleGeometry args={[1.1, 32]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.22} />
            </mesh>
          </Canvas>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
