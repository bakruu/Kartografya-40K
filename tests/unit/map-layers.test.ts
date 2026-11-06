import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Points } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { fitDistance } from '../../src/map/camera';
import { createGalaxy, GALAXY_RADIUS } from '../../src/map/layers/galaxy';
import { BACKGROUND_STAR_COUNT, createStars } from '../../src/map/layers/stars';

const worlds = [
  { x: 1, y: 2, z: 3 },
  { x: -4, y: 0, z: 5 },
];

describe('stars layer', () => {
  it('is one Points object, so it costs one draw call', () => {
    const stars = createStars(worlds);
    expect(stars.object).toBeInstanceOf(Points);
    expect(stars.object.children).toHaveLength(0);
    expect(stars.object.geometry.getAttribute('position').count).toBe(
      worlds.length + BACKGROUND_STAR_COUNT,
    );
  });

  it('puts worlds first, in input order', () => {
    const stars = createStars(worlds);
    const position = stars.object.geometry.getAttribute('position');
    expect(stars.worldCount).toBe(2);
    expect([position.getX(0), position.getY(0), position.getZ(0)]).toEqual([1, 2, 3]);
    expect([position.getX(1), position.getY(1), position.getZ(1)]).toEqual([-4, 0, 5]);
  });

  it('generates the same galaxy every time', () => {
    const first = createStars(worlds).object.geometry.getAttribute('position').array;
    const second = createStars(worlds).object.geometry.getAttribute('position').array;
    expect(second).toEqual(first);
  });

  it('keeps background stars inside the galaxy and close to its plane', () => {
    const position = createStars([]).object.geometry.getAttribute('position');
    for (let i = 0; i < position.count; i++) {
      expect(Math.hypot(position.getX(i), position.getZ(i))).toBeLessThanOrEqual(GALAXY_RADIUS);
      expect(Math.abs(position.getY(i))).toBeLessThanOrEqual(2);
    }
  });

  it('frees its geometry and material on dispose', () => {
    const stars = createStars(worlds);
    const geometryDisposed = vi.fn();
    const material = stars.object.material;
    if (Array.isArray(material)) throw new Error('expected a single material');
    const materialDisposed = vi.fn();
    stars.object.geometry.addEventListener('dispose', geometryDisposed);
    material.addEventListener('dispose', materialDisposed);
    stars.dispose();
    expect(geometryDisposed).toHaveBeenCalledOnce();
    expect(materialDisposed).toHaveBeenCalledOnce();
  });
});

describe('galaxy layer', () => {
  it('lies flat on the XZ plane', () => {
    const { geometry } = createGalaxy().object;
    geometry.computeBoundingBox();
    expect(geometry.boundingBox?.max.y).toBeCloseTo(0);
    expect(geometry.boundingBox?.max.x).toBeGreaterThan(GALAXY_RADIUS);
    expect(geometry.boundingBox?.max.z).toBeGreaterThan(GALAXY_RADIUS);
  });

  it('frees its geometry and material on dispose', () => {
    const galaxy = createGalaxy();
    const geometryDisposed = vi.fn();
    const material = galaxy.object.material;
    if (Array.isArray(material)) throw new Error('expected a single material');
    const materialDisposed = vi.fn();
    galaxy.object.geometry.addEventListener('dispose', geometryDisposed);
    material.addEventListener('dispose', materialDisposed);
    galaxy.dispose();
    expect(geometryDisposed).toHaveBeenCalledOnce();
    expect(materialDisposed).toHaveBeenCalledOnce();
  });
});

describe('fitDistance', () => {
  it('backs the camera up further on portrait screens', () => {
    expect(fitDistance(0.5)).toBeGreaterThan(fitDistance(1));
  });

  it('does not change once the screen is wider than tall', () => {
    expect(fitDistance(2)).toBe(fitDistance(1));
  });
});

describe('src/map', () => {
  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return sourceFiles(path);
      return path.endsWith('.ts') ? [path] : [];
    });
  }

  it('does not import Astro or UI components', () => {
    for (const file of sourceFiles(join(process.cwd(), 'src/map'))) {
      const imports = [...readFileSync(file, 'utf8').matchAll(/from\s+'([^']+)'/g)].map(
        (match) => match[1],
      );
      for (const source of imports) {
        expect(source, file).not.toMatch(/astro|components|\.\.\/\.\.\/(i18n|content)/);
      }
    }
  });
});
