// Card and liquid-lens shaders adapted from the supplied FlexCarousel. Center emphasis is theme-owned.

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
uniform sampler2D tAvailability;
uniform float uAvailability;
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
uniform float uHoverStyle;
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
  if (uReveal > 0.001) {
    vec2 uv2 = imageUv(local, uImage2);
    if (uHoverStyle > 1.5 && uHoverStyle < 2.5) uv2 = (uv2 - .5) / (1.0 + .06 * (1.0 - uReveal)) + .5;
    if (uHoverStyle > 2.5 && uHoverStyle < 3.5) uv2.x -= .06 * (1.0 - uReveal);
    vec3 second = texture(tSecond, uv2).rgb;
    if (uHoverStyle < .5) {
      // Small bounded blur kernel; no extra render targets or continuous idle work.
      vec2 d = vec2(5.0 * (1.0 - uReveal)) / max(uImage2, vec2(1.0));
      second = (second * 4.0 + texture(tSecond, uv2 + d).rgb
        + texture(tSecond, uv2 - d).rgb
        + texture(tSecond, uv2 + vec2(d.x, -d.y)).rgb
        + texture(tSecond, uv2 + vec2(-d.x, d.y)).rgb) / 8.0;
    }
    float blend = uReveal;
    if (uHoverStyle > 3.5) {
      float edge = 1.0 - uReveal;
      blend = smoothstep(edge - .004, edge + .004, local.y);
    }
    image = mix(image, second, blend);
  }
  vec3 color = mix(uPlaceholder, image, uReady);
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  // Sold out is fully grey; products away from the centre lose a little colour and presence.
  color = mix(color, vec3(luma), clamp(uGray + (1.0 - uFocus) * 0.35, 0.0, 1.0));
  vec4 availability = vec4(0.0);
  if (uGray > .5 && uAvailability > .5) {
    vec2 badgeSize = vec2(min(uSize.x * .68, 180.0), 34.0);
    vec2 badgeUv = vLocal / badgeSize + .5;
    if (all(greaterThanEqual(badgeUv, vec2(0.0))) && all(lessThanEqual(badgeUv, vec2(1.0)))) {
      availability = texture(tAvailability, vec2(badgeUv.x, 1.0 - badgeUv.y));
    }
    color = mix(color, availability.rgb, availability.a);
  }
  float alpha = mask * uAlpha * mix(mix(0.42, 1.0, uFocus), 1.0, availability.a);
  fragColor = vec4(color * alpha, alpha);
}
`;

export const lensVertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const lensFragment = `#version 300 es
precision highp float;
uniform sampler2D tScene;
uniform vec2 uResolution;
uniform float uDpr;
uniform vec2 uCenter;
uniform vec2 uHalf;
uniform float uAngle;
uniform float uExponent;
uniform float uInner;
uniform float uOuter;
uniform float uFlow;
uniform float uCurl;
uniform float uDispersion;
uniform float uStrength;
uniform float uSceneAlpha;
out vec4 fragColor;

void main() {
  vec2 frag = gl_FragCoord.xy / uDpr;
  vec2 uv = frag / uResolution;
  vec2 rel = frag - vec2(uCenter.x, uResolution.y - uCenter.y);
  float ca = cos(uAngle);
  float sa = sin(uAngle);
  vec2 local = vec2(ca * rel.x + sa * rel.y, -sa * rel.x + ca * rel.y);
  vec2 k = max(abs(local) / uHalf, vec2(1e-5));
  float nd = pow(pow(k.x, uExponent) + pow(k.y, uExponent), 1.0 / uExponent);
  vec2 grad = pow(k, vec2(uExponent - 1.0)) * sign(local) / uHalf * pow(nd, 1.0 - uExponent);
  float glen = max(length(grad), 1e-6);
  float edge = (nd - 1.0) / glen;
  vec2 outward = grad / glen;
  vec2 normal = vec2(ca * outward.x - sa * outward.y, sa * outward.x + ca * outward.y);
  vec2 along = vec2(-normal.y, normal.x);

  float t = clamp((edge + uInner) / (uInner + uOuter), 0.0, 1.0);
  float ramp = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  float slope = 16.0 * t * t * (1.0 - t) * (1.0 - t);
  float reachX = rel.x / (uResolution.x * 0.5);
  float side = smoothstep(0.02, 0.3, abs(reachX)) * (uCurl == 0.0 ? sign(reachX) : uCurl);
  float lift = ramp * side * uFlow * uStrength;
  vec2 swirl = along * along.y * side * slope * uFlow * uStrength * 0.35;
  vec2 drift = vec2(0.0, -lift) - swirl;
  vec2 shifted = uv + drift / uResolution;

  vec2 texels = uResolution * uDpr;
  vec2 gx = dFdx(shifted);
  vec2 gy = dFdy(shifted);
  gx *= min(1.0, 3.0 / max(length(gx * texels), 1e-4));
  gy *= min(1.0, 3.0 / max(length(gy * texels), 1e-4));

  vec4 color = textureGrad(tScene, shifted, gx, gy);
  vec2 spread = vec2(0.0, side * slope * uFlow * uStrength) / uResolution * uDispersion;
  float spreadPx = length(spread * texels);
  if (color.a > 0.002 && spreadPx > 0.25) {
    vec3 base = color.rgb / color.a;
    vec3 sumColor = vec3(0.0);
    vec3 sumWeight = vec3(0.0);
    for (int i = 0; i < 12; i++) {
      float s = (float(i) + 0.5) / float(12);
      vec4 c = textureGrad(tScene, shifted + spread * (s - 0.5), gx, gy);
      vec3 w = max(1.0 - abs(vec3(s) - vec3(0.15, 0.5, 0.85)) * 2.6, 0.0) * c.a;
      sumColor += c.rgb * (w / max(c.a, 0.002));
      sumWeight += w;
    }
    vec3 split = mix(base, sumColor / max(sumWeight, vec3(1e-4)), clamp(sumWeight * 2.0, 0.0, 1.0));
    color.rgb = mix(color.rgb, clamp(split, 0.0, 1.0) * color.a, smoothstep(0.25, 1.5, spreadPx));
  }

  fragColor = color * uSceneAlpha;
}
`;
