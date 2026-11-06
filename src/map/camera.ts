import { PerspectiveCamera, Vector3 } from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { GALAXY_RADIUS } from './layers/galaxy';

const FOV_DEGREES = 50;
const VIEW_DIRECTION = new Vector3(0, 0.8, 0.6);
const FIT_MARGIN = 1.1;

export const CAMERA_FOV_RADIANS = (FOV_DEGREES * Math.PI) / 180;

export interface MapCamera {
  camera: PerspectiveCamera;
  controls: MapControls;
  setAspect(aspect: number): void;
  dispose(): void;
}

/** Distance at which the whole galaxy fits on screen, in landscape and in portrait. */
export function fitDistance(aspect: number): number {
  const halfHeight = Math.tan(CAMERA_FOV_RADIANS / 2);
  return (FIT_MARGIN * GALAXY_RADIUS) / (halfHeight * Math.min(1, aspect));
}

export function createMapCamera(canvas: HTMLCanvasElement): MapCamera {
  const aspect = canvas.clientWidth / canvas.clientHeight || 1;
  const camera = new PerspectiveCamera(FOV_DEGREES, aspect, 0.1, 2000);
  camera.position.copy(VIEW_DIRECTION).multiplyScalar(fitDistance(aspect));

  const controls = new MapControls(camera, canvas);
  controls.enableDamping = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.dampingFactor = 0.1;
  controls.minDistance = 1;
  controls.maxDistance = fitDistance(0.4) * 1.5;
  controls.maxPolarAngle = 1.4;
  controls.maxTargetRadius = GALAXY_RADIUS * 1.2;

  return {
    camera,
    controls,
    setAspect(next) {
      camera.aspect = next;
      camera.updateProjectionMatrix();
    },
    dispose() {
      controls.dispose();
    },
  };
}
