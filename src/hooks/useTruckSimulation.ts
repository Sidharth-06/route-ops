import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Coordinate,
  DeliveryStop,
  TruckTelemetry,
} from '../types/logistics';
import {
  STOPS,
  ROUTE_WAYPOINTS,
  STOP_WAYPOINT_INDICES,
} from '../services/routeData';
import {
  computeTruckTelemetry,
  playUiFeedbackSound,
  getInterpolatedPosition,
} from '../services/telemetryService';

const MAX_INDEX = ROUTE_WAYPOINTS.length - 1;
// Base traversal duration: ~45 seconds at 1x speed for full trip
const BASE_POINTS_PER_SECOND = MAX_INDEX / 40;

export function useTruckSimulation() {
  const [floatIndex, setFloatIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [followTruck, setFollowTruck] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isAtStopDwell, setIsAtStopDwell] = useState<boolean>(false);
  const [dwellRemaining, setDwellRemaining] = useState<number>(0);

  // Track stops that have triggered arrival alerts to avoid re-triggering during dwell
  const alertedStopsRef = useRef<Set<string>>(new Set());
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const dwellTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs so the RAF callback always reads latest values without being in deps
  const floatIndexRef = useRef<number>(0);
  const playbackSpeedRef = useRef<number>(1);
  const isAtStopDwellRef = useRef<boolean>(false);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (dwellTimerRef.current) clearInterval(dwellTimerRef.current);
    };
  }, []);

  // Check for stop arrivals & dwell trigger
  const checkStopArrival = useCallback(
    (currentIdx: number) => {
      const stopEntries: [string, number][] = [
        ['D1', STOP_WAYPOINT_INDICES.D1],
        ['D2', STOP_WAYPOINT_INDICES.D2],
        ['D3', STOP_WAYPOINT_INDICES.D3],
      ];

      for (const [code, idx] of stopEntries) {
        // Trigger if within a tight threshold and not already alerted
        if (Math.abs(currentIdx - idx) < 0.6 && !alertedStopsRef.current.has(code)) {
          alertedStopsRef.current.add(code);

          if (code === 'D3') {
            // Final destination reached!
            setIsPlaying(false);
            if (soundEnabled) playUiFeedbackSound('complete');
            try {
              confetti({
                particleCount: 120,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
              });
            } catch {
              // Graceful fallback
            }
          } else {
            // D1 or D2 intermediate stop dwell simulation (3 seconds cargo unload)
            if (soundEnabled) playUiFeedbackSound('arrival');
            setIsAtStopDwell(true);
            setDwellRemaining(3);

            let remaining = 3;
            if (dwellTimerRef.current) clearInterval(dwellTimerRef.current);
            dwellTimerRef.current = setInterval(() => {
              remaining -= 1;
              setDwellRemaining(remaining);
              if (remaining <= 0) {
                if (dwellTimerRef.current) clearInterval(dwellTimerRef.current);
                setIsAtStopDwell(false);
              }
            }, 1000);
          }
          break;
        }
      }
    },
    [soundEnabled]
  );

  // Keep refs in sync with state
  useEffect(() => { floatIndexRef.current = floatIndex; }, [floatIndex]);
  useEffect(() => { playbackSpeedRef.current = playbackSpeed; }, [playbackSpeed]);
  useEffect(() => { isAtStopDwellRef.current = isAtStopDwell; }, [isAtStopDwell]);

  // Main high-precision animation loop
  // floatIndex is intentionally NOT in deps – we use refs to avoid restarting RAF every frame
  useEffect(() => {
    if (!isPlaying || isAtStopDwell) {
      lastTimeRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = (time: number) => {
      // Read latest values from refs so we never have stale closures
      if (isAtStopDwellRef.current) {
        lastTimeRef.current = null;
        return;
      }

      if (lastTimeRef.current !== null) {
        const deltaSecs = Math.min((time - lastTimeRef.current) / 1000, 0.1); // cap to avoid big jumps
        const deltaPoints = BASE_POINTS_PER_SECOND * playbackSpeedRef.current * deltaSecs;

        setFloatIndex((prev) => {
          const next = prev + deltaPoints;
          if (next >= MAX_INDEX) {
            floatIndexRef.current = MAX_INDEX;
            checkStopArrival(MAX_INDEX);
            return MAX_INDEX;
          }
          floatIndexRef.current = next;
          checkStopArrival(next);
          return next;
        });
      }
      lastTimeRef.current = time;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = null; // reset so first frame has no delta
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isAtStopDwell, checkStopArrival]);

  // Telemetry computation
  const telemetry: TruckTelemetry = useMemo(() => {
    return computeTruckTelemetry(
      floatIndex,
      playbackSpeed,
      !isPlaying,
      isAtStopDwell,
      dwellRemaining
    );
  }, [floatIndex, playbackSpeed, isPlaying, isAtStopDwell, dwellRemaining]);

  // Overall progress percentage (0 - 100)
  const progressPercent = useMemo(() => {
    return Number(((floatIndex / MAX_INDEX) * 100).toFixed(1));
  }, [floatIndex]);

  // Traversed and remaining route segments for map rendering
  const { traversedPath, remainingPath } = useMemo(() => {
    const baseIdx = Math.floor(floatIndex);
    const currentCoord = getInterpolatedPosition(floatIndex).coordinate;

    const traversed: Coordinate[] = ROUTE_WAYPOINTS.slice(0, baseIdx + 1);
    traversed.push(currentCoord);

    const remaining: Coordinate[] = [currentCoord, ...ROUTE_WAYPOINTS.slice(baseIdx + 1)];

    return {
      traversedPath: traversed,
      remainingPath: remaining,
    };
  }, [floatIndex]);

  // Playback control functions
  const play = useCallback(() => {
    if (floatIndex >= MAX_INDEX) {
      // If completed, restart from origin
      alertedStopsRef.current.clear();
      setFloatIndex(0);
    }
    setIsPlaying(true);
    if (soundEnabled) playUiFeedbackSound('click');
  }, [floatIndex, soundEnabled]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (soundEnabled) playUiFeedbackSound('click');
  }, [soundEnabled]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const reset = useCallback(() => {
    // Reset is an intentional restart: return to origin and resume immediately.
    setIsPlaying(true);
    setIsAtStopDwell(false);
    if (dwellTimerRef.current) clearInterval(dwellTimerRef.current);
    alertedStopsRef.current.clear();
    setFloatIndex(0);
    if (soundEnabled) playUiFeedbackSound('click');
  }, [soundEnabled]);

  const scrubToPercent = useCallback(
    (percent: number) => {
      const targetIndex = (Math.max(0, Math.min(100, percent)) / 100) * MAX_INDEX;
      // Recalculate which stops were passed
      alertedStopsRef.current.clear();
      if (targetIndex >= STOP_WAYPOINT_INDICES.D1) alertedStopsRef.current.add('D1');
      if (targetIndex >= STOP_WAYPOINT_INDICES.D2) alertedStopsRef.current.add('D2');
      if (targetIndex >= STOP_WAYPOINT_INDICES.D3) alertedStopsRef.current.add('D3');

      setIsAtStopDwell(false);
      if (dwellTimerRef.current) clearInterval(dwellTimerRef.current);
      setFloatIndex(targetIndex);
    },
    []
  );

  const setSpeed = useCallback(
    (speed: number) => {
      setPlaybackSpeed(speed);
      if (soundEnabled) playUiFeedbackSound('click');
    },
    [soundEnabled]
  );

  const skipToStop = useCallback(
    (stopCode: 'Origin' | 'D1' | 'D2' | 'D3') => {
      const idx = STOP_WAYPOINT_INDICES[stopCode];
      scrubToPercent((idx / MAX_INDEX) * 100);
      if (soundEnabled) playUiFeedbackSound('click');
    },
    [scrubToPercent, soundEnabled]
  );

  return {
    floatIndex,
    isPlaying,
    playbackSpeed,
    followTruck,
    soundEnabled,
    isAtStopDwell,
    dwellRemaining,
    telemetry,
    progressPercent,
    traversedPath,
    remainingPath,
    stops: STOPS,
    play,
    pause,
    togglePlay,
    reset,
    scrubToPercent,
    setSpeed,
    setFollowTruck,
    setSoundEnabled,
    skipToStop,
  };
}
