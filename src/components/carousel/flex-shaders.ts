// Card shaders from the user's supplied FlexCarousel, adapted for the theme. The lens pass that bent
// the strip is not used: cards are drawn straight, at their own proportions.

export const cardVertex = `#version 300 es
in vec3 position;
in vec2 uv;
uniform vec4 uRect;
uniform vec2 uResolution;
out vec2 vUv;
out vec2 vLocal;
void main() {
  vUv = uv;
  vLocal = vec2(position.x, -position.y) * uRect.zw;
  vec2 px = uRect.xy + vLocal;
  gl_Position = vec4(px.x / uResolution.x * 2.0 - 1.0, 1.0 - px.y / uResolution.y * 2.0, 0.0, 1.0);
}
`;

export const cardFragment = `#version 300 es
precision highp float;
uniform sampler2D tMap;
uniform sampler2D tSecond;
uniform vec2 uSize;
uniform vec2 uImage;
uniform vec2 uImage2;
uniform float uRadius;
uniform float uAlpha;
uniform float uReady;
uniform float uShift;
uniform float uDpr;
uniform vec3 uPlaceholder;
uniform float uReveal;
uniform float uFocus;
uniform float uGray;
in vec2 vUv;
in vec2 vLocal;
out vec4 fragColor;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec2 imageUv(vec2 local, vec2 image) {
  float cardAspect = uSize.x / uSize.y;
  float imageAspect = image.x / max(image.y, 1.0);
  vec2 scale = imageAspect > cardAspect ? vec2(cardAspect / imageAspect, 1.0) : vec2(1.0, imageAspect / cardAspect);
  scale /= 1.08;
  vec2 uv = vec2(local.x, 1.0 - local.y);
  uv = (uv - 0.5) * scale + 0.5;
  uv.x += uShift * (1.0 - scale.x) * 0.5;
  return uv;
}

void main() {
  float sd = roundedBox(vLocal, uSize * 0.5, min(uRadius, min(uSize.x, uSize.y) * 0.5));
  float mask = clamp(0.5 - sd * uDpr, 0.0, 1.0);
  vec2 local = vLocal / uSize + 0.5;
  vec3 image = texture(tMap, imageUv(local, uImage)).rgb;
  // The product card hover: the second photograph rises like a curtain from the bottom edge.
  if (uReveal > 0.001) {
    vec3 second = texture(tSecond, imageUv(local, uImage2)).rgb;
    float edge = 1.0 - uReveal;
    image = mix(image, second, smoothstep(edge - 0.004, edge + 0.004, local.y));
  }
  vec3 color = mix(uPlaceholder, image, uReady);
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  // Sold out is fully grey; products away from the centre lose a little colour and presence.
  color = mix(color, vec3(luma), clamp(uGray + (1.0 - uFocus) * 0.35, 0.0, 1.0));
  float alpha = mask * uAlpha * mix(0.42, 1.0, uFocus);
  fragColor = vec4(color * alpha, alpha);
}
`;
