precision highp float;

uniform float uRadius;
uniform float uArms;
uniform float uTwist;
uniform float uArmScale;

varying vec2 vPlane;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(cell), hash(cell + vec2(1.0, 0.0)), u.x),
    mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amplitude * valueNoise(p);
    p = p * 2.03 + vec2(17.0, 9.0);
    amplitude *= 0.5;
  }
  return sum;
}

void main() {
  float r = length(vPlane);
  float angle = atan(vPlane.y, vPlane.x);

  // Same logarithmic spiral as the star distribution in layers/stars.ts.
  float armPhase = uArms * (angle - uTwist * log(1.0 + r / uArmScale));
  float clouds = fbm(vPlane * 0.14);
  float wisps = fbm(vPlane * 0.5 + clouds * 3.0);
  float arm = pow(0.5 + 0.5 * cos(armPhase + (clouds - 0.5) * 2.5), 2.0);

  float edge = smoothstep(uRadius, uRadius * 0.45, r);
  float core = exp(-r * r / 90.0);
  float haze = exp(-r / (uRadius * 0.4));

  float dust = mix(0.45, 1.0, wisps);
  float armLight = arm * edge * dust * 0.62;
  float diskLight = haze * edge * dust * 0.32;

  vec3 armColor = mix(vec3(0.62, 0.42, 0.72), vec3(0.28, 0.42, 0.78), clamp(r / uRadius, 0.0, 1.0));
  vec3 coreColor = vec3(1.0, 0.8, 0.56);

  vec3 color = armColor * (armLight + diskLight) + coreColor * core * 0.95;
  gl_FragColor = vec4(color, 1.0);
}
