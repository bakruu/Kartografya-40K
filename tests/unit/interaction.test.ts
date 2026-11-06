import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { matchesSearch, normalizeForSearch } from '../../src/i18n/search';
import { easeInOutCubic, flyEndpoints } from '../../src/map/camera';
import { createEventBus, type MapEvents } from '../../src/map/events';
import { pickWorld } from '../../src/map/picking';

describe('createEventBus', () => {
  it('delivers a payload to every handler of that event only', () => {
    const bus = createEventBus<MapEvents>();
    const select = vi.fn();
    const hover = vi.fn();
    bus.on('select', select);
    bus.on('hover', hover);
    bus.emit('select', { slug: 'cadia' });
    expect(select).toHaveBeenCalledWith({ slug: 'cadia' });
    expect(hover).not.toHaveBeenCalled();
  });

  it('stops delivering after unsubscribing or clearing', () => {
    const bus = createEventBus<MapEvents>();
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribe = bus.on('select', first);
    bus.on('select', second);

    unsubscribe();
    bus.emit('select', { slug: null });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();

    bus.clear();
    bus.emit('select', { slug: null });
    expect(second).toHaveBeenCalledOnce();
  });
});

describe('pickWorld', () => {
  const viewport = { width: 800, height: 600 };

  function cameraLookingAtOrigin() {
    const camera = new PerspectiveCamera(50, viewport.width / viewport.height, 0.1, 1000);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    return camera;
  }

  const center = { x: 0, y: 0, z: 0 };
  const beside = { x: 1, y: 0, z: 0 };

  it('finds a world under the pointer', () => {
    expect(pickWorld(400, 300, [beside, center], cameraLookingAtOrigin(), viewport, 14)).toBe(1);
  });

  it('finds nothing outside the radius', () => {
    expect(pickWorld(450, 300, [center], cameraLookingAtOrigin(), viewport, 14)).toBeNull();
  });

  it('prefers the nearest of several candidates', () => {
    const near = { x: 0.01, y: 0, z: 0 };
    const far = { x: 0.05, y: 0, z: 0 };
    expect(pickWorld(400, 300, [far, near], cameraLookingAtOrigin(), viewport, 100)).toBe(1);
  });

  it('ignores worlds behind the camera', () => {
    const behind = { x: 0, y: 0, z: 20 };
    expect(pickWorld(400, 300, [behind], cameraLookingAtOrigin(), viewport, 100)).toBeNull();
  });
});

describe('camera flight', () => {
  it('eases from start to end', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it('arrives close to the destination at the same viewing angle', () => {
    const position = new Vector3(0, 80, 60);
    const target = new Vector3(0, 0, 0);
    const { toPosition, toTarget } = flyEndpoints(position, target, { x: 10, y: 0, z: -5 });

    expect(toTarget.toArray()).toEqual([10, 0, -5]);
    const offset = toPosition.clone().sub(toTarget);
    expect(offset.length()).toBeCloseTo(20);
    expect(offset.normalize().dot(position.clone().normalize())).toBeCloseTo(1);
  });

  it('does not pull back a camera that is already close', () => {
    const { toPosition, toTarget } = flyEndpoints(new Vector3(0, 3, 4), new Vector3(0, 0, 0), {
      x: 1,
      y: 0,
      z: 0,
    });
    expect(toPosition.distanceTo(toTarget)).toBeCloseTo(5);
  });
});

describe('search', () => {
  it('ignores case and surrounding spaces', () => {
    expect(matchesSearch('Cadia', '  CADIA ')).toBe(true);
  });

  it('treats dotted and dotless i as the same letter', () => {
    expect(normalizeForSearch('İchar ıv')).toBe(normalizeForSearch('Ichar IV'));
    expect(matchesSearch('Ichar IV', 'ichar')).toBe(true);
    expect(matchesSearch('Cadia', 'CADİA')).toBe(true);
    expect(matchesSearch('Cadia', 'cadıa')).toBe(true);
  });

  it('matches every name for an empty query', () => {
    expect(matchesSearch('Terra', '')).toBe(true);
  });

  it('rejects names without the query', () => {
    expect(matchesSearch('Terra', 'mars')).toBe(false);
  });
});
