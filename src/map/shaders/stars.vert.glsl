attribute vec3 aColor;
attribute float aSize;
attribute float aMinPixels;

// Pixels covered by one world unit at distance 1.
uniform float uPixelScale;
uniform float uPixelRatio;

varying vec3 vColor;

void main() {
  vColor = aColor;
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  float size = aSize * uPixelScale / max(-viewPosition.z, 0.001);
  gl_PointSize = clamp(size, aMinPixels * uPixelRatio, 48.0 * uPixelRatio);
  gl_Position = projectionMatrix * viewPosition;
}
