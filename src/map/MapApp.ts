import { Scene } from 'three';
import { CAMERA_FOV_RADIANS, createMapCamera } from './camera';
import type { DebugOverlay } from './debug';
import { createGalaxy } from './layers/galaxy';
import { createStars } from './layers/stars';
import { createRenderer, createRenderLoop } from './renderer';

export interface MapWorld {
  slug: string;
  name: string;
  position: { x: number; y: number; z: number };
}

export interface MapData {
  worlds: readonly MapWorld[];
}

export interface MapOptions {
  /** Shows the FPS and draw call readout. */
  debug?: boolean;
}

export interface MapApp {
  dispose(): void;
}

/** Throws if WebGL is unavailable; the caller decides what to show instead. */
export function init(canvas: HTMLCanvasElement, data: MapData, options: MapOptions = {}): MapApp {
  const renderer = createRenderer(canvas);
  const { camera, controls, setAspect, dispose: disposeCamera } = createMapCamera(canvas);
  const galaxy = createGalaxy();
  const stars = createStars(data.worlds.map((world) => world.position));

  const scene = new Scene();
  scene.add(galaxy.object, stars.object);

  let debug: DebugOverlay | undefined;
  let disposed = false;
  const debugParent = canvas.parentElement;
  if (options.debug && debugParent) {
    // Loaded on demand so the overlay stays out of what production pages download.
    void import('./debug').then(({ createDebugOverlay }) => {
      if (!disposed) debug = createDebugOverlay(renderer, debugParent);
    });
  }

  const loop = createRenderLoop(
    () => {
      // While damping settles, this update emits 'change', which requests the next frame.
      controls.update();
      renderer.render(scene, camera);
      debug?.frame();
    },
    {
      requestAnimationFrame: (callback) => window.requestAnimationFrame(callback),
      cancelAnimationFrame: (handle) => window.cancelAnimationFrame(handle),
    },
  );

  const requestFrame = () => loop.request();
  controls.addEventListener('change', requestFrame);
  canvas.addEventListener('webglcontextrestored', requestFrame);

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    setAspect(width / height);
    const pixelRatio = renderer.getPixelRatio();
    stars.setViewport(height * pixelRatio, CAMERA_FOV_RADIANS, pixelRatio);
    loop.request();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  const syncVisibility = () => {
    if (document.hidden) loop.pause();
    else loop.resume();
  };
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();

  resize();

  return {
    dispose() {
      disposed = true;
      loop.stop();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', syncVisibility);
      canvas.removeEventListener('webglcontextrestored', requestFrame);
      controls.removeEventListener('change', requestFrame);
      disposeCamera();
      galaxy.dispose();
      stars.dispose();
      debug?.dispose();
      renderer.dispose();
    },
  };
}
