import { AdditiveBlending, Mesh, PlaneGeometry, ShaderMaterial } from 'three';
import fragmentShader from '../shaders/galaxy.frag.glsl?raw';
import vertexShader from '../shaders/galaxy.vert.glsl?raw';

/** Galactic units; see CLAUDE.md §5. */
export const GALAXY_RADIUS = 50;
export const GALAXY_ARMS = 4;
export const GALAXY_TWIST = 2.4;
/** Radius scale of the logarithmic spiral. Shared with the stars so both follow the same arms. */
export const GALAXY_ARM_SCALE = 8;

export interface GalaxyLayer {
  object: Mesh;
  dispose(): void;
}

export function createGalaxy(): GalaxyLayer {
  const size = GALAXY_RADIUS * 2.2;
  const geometry = new PlaneGeometry(size, size);
  geometry.rotateX(-Math.PI / 2);

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uRadius: { value: GALAXY_RADIUS },
      uArms: { value: GALAXY_ARMS },
      uTwist: { value: GALAXY_TWIST },
      uArmScale: { value: GALAXY_ARM_SCALE },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  return {
    object: new Mesh(geometry, material),
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
