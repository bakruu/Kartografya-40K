import type { WebGLRenderer } from 'three';

export interface DebugOverlay {
  /** Call once per rendered frame. */
  frame(): void;
  dispose(): void;
}

/**
 * Developer-only readout. Counts rendered frames rather than display refreshes, so an idle
 * map reads FPS 0. It updates the DOM on a timer and never requests a frame itself.
 */
export function createDebugOverlay(renderer: WebGLRenderer, parent: HTMLElement): DebugOverlay {
  const element = document.createElement('output');
  element.dataset.mapDebug = '';
  element.style.cssText =
    'position:absolute;top:0.5rem;right:0.5rem;padding:0.25rem 0.5rem;font:12px monospace;' +
    'color:#9fe8a8;background:rgb(0 0 0 / 0.7);pointer-events:none;';
  parent.append(element);

  let frames = 0;
  let lastCalls = 0;
  const show = () => {
    element.textContent = `FPS ${frames} | draw calls ${lastCalls}`;
    frames = 0;
  };
  show();
  const timer = window.setInterval(show, 1000);

  return {
    frame() {
      frames += 1;
      lastCalls = renderer.info.render.calls;
    },
    dispose() {
      window.clearInterval(timer);
      element.remove();
    },
  };
}
