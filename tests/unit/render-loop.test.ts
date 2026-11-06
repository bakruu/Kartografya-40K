import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRenderLoop, type RenderLoop } from '../../src/map/renderer';

describe('createRenderLoop', () => {
  let queued: Map<number, () => void>;
  let render: ReturnType<typeof vi.fn<() => void>>;
  let loop: RenderLoop;

  /** Runs one display refresh: every frame queued so far, but not ones they queue. */
  function flushFrame() {
    const callbacks = [...queued.values()];
    queued.clear();
    for (const callback of callbacks) callback();
  }

  beforeEach(() => {
    queued = new Map();
    let nextHandle = 1;
    render = vi.fn<() => void>();
    loop = createRenderLoop(render, {
      requestAnimationFrame(callback) {
        const handle = nextHandle++;
        queued.set(handle, callback);
        return handle;
      },
      cancelAnimationFrame(handle) {
        queued.delete(handle);
      },
    });
  });

  it('schedules nothing until a frame is requested', () => {
    expect(queued.size).toBe(0);
    flushFrame();
    expect(render).not.toHaveBeenCalled();
  });

  it('goes back to idle after a requested frame', () => {
    loop.request();
    flushFrame();
    expect(render).toHaveBeenCalledTimes(1);
    expect(queued.size).toBe(0);
  });

  it('merges requests made before the frame runs', () => {
    loop.request();
    loop.request();
    loop.request();
    expect(queued.size).toBe(1);
    flushFrame();
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('lets a render request the next frame, for as long as it keeps asking', () => {
    let framesLeft = 3;
    render.mockImplementation(() => {
      framesLeft -= 1;
      if (framesLeft > 0) loop.request();
    });
    loop.request();
    for (let i = 0; i < 10; i++) flushFrame();
    expect(render).toHaveBeenCalledTimes(3);
    expect(queued.size).toBe(0);
  });

  it('runs nothing while paused, and one frame on resume', () => {
    loop.pause();
    loop.request();
    loop.request();
    expect(queued.size).toBe(0);
    loop.resume();
    flushFrame();
    expect(render).toHaveBeenCalledTimes(1);
    expect(queued.size).toBe(0);
  });

  it('keeps a frame that was already queued when paused', () => {
    loop.request();
    loop.pause();
    expect(queued.size).toBe(0);
    loop.resume();
    flushFrame();
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('stays idle on resume when nothing was requested', () => {
    loop.pause();
    loop.resume();
    expect(queued.size).toBe(0);
  });

  it('ignores everything after stop', () => {
    loop.request();
    loop.stop();
    expect(queued.size).toBe(0);
    loop.request();
    loop.resume();
    expect(queued.size).toBe(0);
  });
});
