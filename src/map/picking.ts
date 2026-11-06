import { type Camera, Vector3 } from 'three';

const MOUSE_PICK_RADIUS = 14;
const TOUCH_PICK_RADIUS = 28;
/** A press that moves further than this is a drag, not a click. */
const CLICK_SLOP = 5;

const projected = new Vector3();

export interface PickablePosition {
  x: number;
  y: number;
  z: number;
}

export interface Viewport {
  width: number;
  height: number;
}

/**
 * Finds the world nearest to a point on screen, in screen space. Worlds keep a minimum on-screen
 * size at any distance, so distance in pixels matches what the user sees better than a ray does.
 */
export function pickWorld(
  x: number,
  y: number,
  worlds: readonly PickablePosition[],
  camera: Camera,
  viewport: Viewport,
  radius: number,
): number | null {
  let nearest: number | null = null;
  let nearestDistance = radius;

  worlds.forEach((world, index) => {
    projected.set(world.x, world.y, world.z).project(camera);
    if (Math.abs(projected.z) > 1) return;
    const screenX = ((projected.x + 1) / 2) * viewport.width;
    const screenY = ((1 - projected.y) / 2) * viewport.height;
    const distance = Math.hypot(screenX - x, screenY - y);
    if (distance <= nearestDistance) {
      nearest = index;
      nearestDistance = distance;
    }
  });

  return nearest;
}

export interface PointerPicking {
  /** Forgets the hovered world, for when the camera moves it out from under the pointer. */
  clearHover(): void;
  dispose(): void;
}

/** `pick` receives CSS pixels relative to the canvas and returns the world index, if any. */
export function attachPointerPicking(
  canvas: HTMLCanvasElement,
  pick: (x: number, y: number, radius: number) => number | null,
  callbacks: {
    onHover(index: number | null, x: number, y: number): void;
    onClick(index: number | null): void;
  },
): PointerPicking {
  let hovered: number | null = null;
  let press: { x: number; y: number } | null = null;

  const setHover = (index: number | null, x: number, y: number) => {
    if (index === hovered) return;
    hovered = index;
    canvas.style.cursor = index === null ? '' : 'pointer';
    callbacks.onHover(index, x, y);
  };

  const onPointerMove = (event: PointerEvent) => {
    // Touch has no hover, and a pressed button means the user is dragging the map.
    if (event.pointerType === 'touch' || event.buttons !== 0) return;
    setHover(pick(event.offsetX, event.offsetY, MOUSE_PICK_RADIUS), event.offsetX, event.offsetY);
  };

  const onPointerDown = (event: PointerEvent) => {
    press = event.isPrimary && event.button === 0 ? { x: event.clientX, y: event.clientY } : null;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!press || !event.isPrimary) return;
    const moved = Math.hypot(event.clientX - press.x, event.clientY - press.y);
    press = null;
    if (moved > CLICK_SLOP) return;
    const radius = event.pointerType === 'touch' ? TOUCH_PICK_RADIUS : MOUSE_PICK_RADIUS;
    callbacks.onClick(pick(event.offsetX, event.offsetY, radius));
  };

  const onPointerCancel = () => {
    press = null;
  };

  const onPointerLeave = (event: PointerEvent) => {
    setHover(null, event.offsetX, event.offsetY);
  };

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('pointerleave', onPointerLeave);

  return {
    clearHover() {
      setHover(null, 0, 0);
    },
    dispose() {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.style.cursor = '';
    },
  };
}
