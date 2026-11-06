import { PerspectiveCamera, Vector3 } from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { GALAXY_RADIUS } from './layers/galaxy';

const FOV_DEGREES = 50;
const VIEW_DIRECTION = new Vector3(0, 0.8, 0.6);
const FIT_MARGIN = 1.1;
const FLY_DURATION_MS = 900;
const FLY_ARRIVAL_DISTANCE = 20;

export const CAMERA_FOV_RADIANS = (FOV_DEGREES * Math.PI) / 180;

export interface MapCamera {
  camera: PerspectiveCamera;
  controls: MapControls;
  setAspect(aspect: number): void;
  /** Moves toward a point. Takes effect through updateFly, so request a frame after calling. */
  flyTo(target: { x: number; y: number; z: number }, options: { instant: boolean }): void;
  cancelFly(): void;
  /** Advances the flight. Returns true while there is more of it to draw. */
  updateFly(now: number): boolean;
  dispose(): void;
}

/** Distance at which the whole galaxy fits on screen, in landscape and in portrait. */
export function fitDistance(aspect: number): number {
  const halfHeight = Math.tan(CAMERA_FOV_RADIANS / 2);
  return (FIT_MARGIN * GALAXY_RADIUS) / (halfHeight * Math.min(1, aspect));
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export interface FlyEndpoints {
  fromPosition: Vector3;
  fromTarget: Vector3;
  toPosition: Vector3;
  toTarget: Vector3;
}

/** Keeps the current viewing angle, and only ever moves closer. */
export function flyEndpoints(
  position: Vector3,
  target: Vector3,
  destination: { x: number; y: number; z: number },
): FlyEndpoints {
  const offset = position.clone().sub(target);
  const distance = Math.min(offset.length(), FLY_ARRIVAL_DISTANCE);
  const toTarget = new Vector3(destination.x, destination.y, destination.z);
  return {
    fromPosition: position.clone(),
    fromTarget: target.clone(),
    toPosition: toTarget.clone().add(offset.setLength(distance)),
    toTarget,
  };
}

export function createMapCamera(canvas: HTMLCanvasElement): MapCamera {
  const aspect = canvas.clientWidth / canvas.clientHeight || 1;
  const camera = new PerspectiveCamera(FOV_DEGREES, aspect, 0.1, 2000);
  camera.position.copy(VIEW_DIRECTION).multiplyScalar(fitDistance(aspect));

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const controls = new MapControls(camera, canvas);
  controls.enableDamping = !reducedMotion;
  controls.dampingFactor = 0.1;
  controls.minDistance = 1;
  controls.maxDistance = fitDistance(0.4) * 1.5;
  controls.maxPolarAngle = 1.4;
  controls.maxTargetRadius = GALAXY_RADIUS * 1.2;

  let flight: (FlyEndpoints & { startedAt: number | null }) | null = null;

  const cancelFly = () => {
    flight = null;
  };
  // The user always wins over a flight in progress.
  controls.addEventListener('start', cancelFly);

  return {
    camera,
    controls,
    setAspect(next) {
      camera.aspect = next;
      camera.updateProjectionMatrix();
    },
    flyTo(target, { instant }) {
      const endpoints = flyEndpoints(camera.position, controls.target, target);
      if (instant || reducedMotion) {
        camera.position.copy(endpoints.toPosition);
        controls.target.copy(endpoints.toTarget);
        flight = null;
        return;
      }
      flight = { ...endpoints, startedAt: null };
    },
    cancelFly,
    updateFly(now) {
      if (!flight) return false;
      flight.startedAt ??= now;
      const progress = Math.min((now - flight.startedAt) / FLY_DURATION_MS, 1);
      const eased = easeInOutCubic(progress);
      camera.position.lerpVectors(flight.fromPosition, flight.toPosition, eased);
      controls.target.lerpVectors(flight.fromTarget, flight.toTarget, eased);
      if (progress === 1) flight = null;
      return flight !== null;
    },
    dispose() {
      controls.removeEventListener('start', cancelFly);
      controls.dispose();
    },
  };
}
