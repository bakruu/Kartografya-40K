attribute vec3 aColor;
attribute float aSize;
attribute float aMinPixels;

// Pixels covered by one world unit at distance 1.
uniform float uPixelScale;
uniform float uPixelRatio;
// Vertex index of the hovered and selected worlds, or -1.
uniform float uHovered;
uniform float uSelected;

varying vec3 vColor;
varying float vSelected;

void main() {
  float index = float(gl_VertexID);
  bool isSelected = index == uSelected;
  bool isHovered = index == uHovered;
  float emphasis = isSelected ? 2.0 : (isHovered ? 1.5 : 1.0);

  vColor = aColor;
  vSelected = isSelected ? 1.0 : 0.0;

  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  float size = emphasis * aSize * uPixelScale / max(-viewPosition.z, 0.001);
  gl_PointSize = clamp(size, emphasis * aMinPixels * uPixelRatio, 48.0 * uPixelRatio);
  gl_Position = projectionMatrix * viewPosition;
}
