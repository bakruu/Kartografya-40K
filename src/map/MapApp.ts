import { Scene } from 'three';
import { CAMERA_FOV_RADIANS, createMapCamera } from './camera';
import type { DebugOverlay } from './debug';
import { createEventBus, type EventBus, type MapEvents } from './events';
import { createGalaxy } from './layers/galaxy';
import { createStars } from './layers/stars';
import { attachPointerPicking, pickWorld } from './picking';
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
  on: EventBus<MapEvents>['on'];
  /** Highlights a world and moves the camera to it, or clears the highlight when null. */
  select(slug: string | null, options?: { instant?: boolean }): void;
  dispose(): void;
}

/** Throws if WebGL is unavailable; the caller decides what to show instead. */
export function init(canvas: HTMLCanvasElement, data: MapData, options: MapOptions = {}): MapApp {
  const renderer = createRenderer(canvas);
  const mapCamera = createMapCamera(canvas);
  const { camera, controls } = mapCamera;
  const galaxy = createGalaxy();
  const positions = data.worlds.map((world) => world.position);
  const stars = createStars(positions);
  const events = createEventBus<MapEvents>();

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
      const flying = mapCamera.updateFly(performance.now());
      // While damping settles, this update emits 'change', which requests the next frame.
      controls.update();
      renderer.render(scene, camera);
      debug?.frame();
      if (flying) loop.request();
    },
    {
      requestAnimationFrame: (callback) => window.requestAnimationFrame(callback),
      cancelAnimationFrame: (handle) => window.cancelAnimationFrame(handle),
    },
  );

  let hoveredIndex: number | null = null;
  let selectedIndex: number | null = null;

  const showHighlight = () => {
    stars.setHighlight(hoveredIndex, selectedIndex);
    loop.request();
  };

  const picking = attachPointerPicking(
    canvas,
    (x, y, radius) =>
      pickWorld(
        x,
        y,
        positions,
        camera,
        { width: canvas.clientWidth, height: canvas.clientHeight },
        radius,
      ),
    {
      onHover(index, x, y) {
        hoveredIndex = index;
        showHighlight();
        const slug = index === null ? null : (data.worlds[index]?.slug ?? null);
        events.emit('hover', { slug, x, y });
      },
      onClick(index) {
        const slug = index === null ? null : (data.worlds[index]?.slug ?? null);
        events.emit('select', { slug });
      },
    },
  );

  const requestFrame = () => loop.request();
  const clearHover = () => picking.clearHover();
  controls.addEventListener('change', requestFrame);
  controls.addEventListener('start', clearHover);
  canvas.addEventListener('webglcontextrestored', requestFrame);

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    mapCamera.setAspect(width / height);
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
    on: events.on,
    select(slug, { instant = false } = {}) {
      const index = data.worlds.findIndex((world) => world.slug === slug);
      const world = data.worlds[index];
      selectedIndex = world ? index : null;
      if (world) {
        picking.clearHover();
        mapCamera.flyTo(world.position, { instant });
      }
      showHighlight();
    },
    dispose() {
      disposed = true;
      loop.stop();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', syncVisibility);
      canvas.removeEventListener('webglcontextrestored', requestFrame);
      controls.removeEventListener('change', requestFrame);
      controls.removeEventListener('start', clearHover);
      picking.dispose();
      events.clear();
      mapCamera.dispose();
      galaxy.dispose();
      stars.dispose();
      debug?.dispose();
      renderer.dispose();
    },
  };
}
