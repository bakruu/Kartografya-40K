import { WebGLRenderer } from 'three';

const MAX_PIXEL_RATIO = 2;

export function createRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
  // The scene is soft shaders and round points, so MSAA would cost without visible gain.
  const renderer = new WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.setClearColor(0x05060b);
  return renderer;
}

export interface FrameScheduler {
  requestAnimationFrame(callback: () => void): number;
  cancelAnimationFrame(handle: number): void;
}

export interface RenderLoop {
  /** Asks for one frame. Calls made before that frame runs share it. */
  request(): void;
  /** Stops rendering. Requests made while paused run as a single frame on resume. */
  pause(): void;
  resume(): void;
  /** Stops for good. Later requests are ignored. */
  stop(): void;
}

/**
 * Render-on-demand loop: a frame only runs when something asked for one, so an idle map
 * schedules nothing at all. A render callback may call request() to keep animating.
 */
export function createRenderLoop(render: () => void, scheduler: FrameScheduler): RenderLoop {
  let handle: number | null = null;
  let paused = false;
  let stopped = false;
  let pending = false;

  function schedule() {
    if (handle !== null) return;
    handle = scheduler.requestAnimationFrame(() => {
      handle = null;
      render();
    });
  }

  function cancel() {
    if (handle === null) return;
    scheduler.cancelAnimationFrame(handle);
    handle = null;
  }

  return {
    request() {
      if (stopped) return;
      if (paused) {
        pending = true;
        return;
      }
      schedule();
    },
    pause() {
      if (handle !== null) pending = true;
      paused = true;
      cancel();
    },
    resume() {
      paused = false;
      if (stopped || !pending) return;
      pending = false;
      schedule();
    },
    stop() {
      stopped = true;
      cancel();
    },
  };
}
