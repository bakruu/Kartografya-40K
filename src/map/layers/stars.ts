import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial } from 'three';
import fragmentShader from '../shaders/stars.frag.glsl?raw';
import vertexShader from '../shaders/stars.vert.glsl?raw';
import { GALAXY_ARM_SCALE, GALAXY_ARMS, GALAXY_RADIUS, GALAXY_TWIST } from './galaxy';

// Phase 7 ties this to the quality tiers.
export const BACKGROUND_STAR_COUNT = 6000;

const ARM_STAR_SHARE = 0.75;
const ARM_SPREAD = 0.32;
// Above 1 on purpose: the center saturates, so worlds read as bright beacons among the stars.
const WORLD_COLOR = [2.6, 2.0, 1.0] as const;
const WORLD_SIZE = 0.9;
const WORLD_MIN_PIXELS = 11;
const STAR_MIN_PIXELS = 1.4;

export interface StarPosition {
  x: number;
  y: number;
  z: number;
}

export interface StarsLayer {
  object: Points;
  /** Worlds occupy the first vertices, in input order; background stars follow. */
  worldCount: number;
  setViewport(drawingBufferHeight: number, fovRadians: number, pixelRatio: number): void;
  dispose(): void;
}

/** Small seeded generator, so the galaxy looks the same on every visit and in every test. */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function backgroundStar(random: () => number): StarPosition {
  const gaussian = () => (random() + random() + random() - 1.5) / 1.5;
  const r = GALAXY_RADIUS * random() ** 1.5;
  const angle =
    random() < ARM_STAR_SHARE
      ? (Math.floor(random() * GALAXY_ARMS) * 2 * Math.PI) / GALAXY_ARMS +
        GALAXY_TWIST * Math.log(1 + r / GALAXY_ARM_SCALE) +
        gaussian() * ARM_SPREAD
      : random() * 2 * Math.PI;
  return {
    x: r * Math.cos(angle),
    y: gaussian() * (0.3 + 1.6 * (1 - r / GALAXY_RADIUS)),
    z: r * Math.sin(angle),
  };
}

export function createStars(worlds: readonly StarPosition[]): StarsLayer {
  const count = worlds.length + BACKGROUND_STAR_COUNT;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const minPixels = new Float32Array(count);
  const random = createRandom(40000);

  for (let i = 0; i < count; i++) {
    const world = worlds[i];
    const position = world ?? backgroundStar(random);
    positions.set([position.x, position.y, position.z], i * 3);

    if (world) {
      colors.set(WORLD_COLOR, i * 3);
      sizes[i] = WORLD_SIZE;
      minPixels[i] = WORLD_MIN_PIXELS;
    } else {
      const warmth = random();
      const brightness = 0.45 + 0.55 * random();
      colors.set(
        [brightness * (0.75 + 0.25 * warmth), brightness * 0.85, brightness * (1 - 0.3 * warmth)],
        i * 3,
      );
      sizes[i] = 0.12 + 0.28 * random() ** 3;
      minPixels[i] = STAR_MIN_PIXELS;
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1));
  geometry.setAttribute('aMinPixels', new BufferAttribute(minPixels, 1));

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uPixelScale: { value: 1 },
      uPixelRatio: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  const object = new Points(geometry, material);
  object.frustumCulled = false;
  object.renderOrder = 1;

  return {
    object,
    worldCount: worlds.length,
    setViewport(drawingBufferHeight, fovRadians, pixelRatio) {
      const { uPixelScale, uPixelRatio } = material.uniforms;
      if (uPixelScale) uPixelScale.value = drawingBufferHeight / (2 * Math.tan(fovRadians / 2));
      if (uPixelRatio) uPixelRatio.value = pixelRatio;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
