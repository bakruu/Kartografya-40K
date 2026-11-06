precision mediump float;

varying vec3 vColor;
varying float vSelected;

void main() {
  float distanceToCenter = length(gl_PointCoord - 0.5) * 2.0;
  if (distanceToCenter > 1.0) discard;
  float glow = pow(1.0 - distanceToCenter, 1.6);
  // The ring marks the selected world by shape, not only by brightness.
  float ring = vSelected * smoothstep(0.1, 0.0, abs(distanceToCenter - 0.82));
  gl_FragColor = vec4(vColor * glow + vec3(ring), 1.0);
}
