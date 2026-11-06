precision mediump float;

varying vec3 vColor;

void main() {
  float distanceToCenter = length(gl_PointCoord - 0.5) * 2.0;
  if (distanceToCenter > 1.0) discard;
  float glow = pow(1.0 - distanceToCenter, 1.6);
  gl_FragColor = vec4(vColor * glow, 1.0);
}
