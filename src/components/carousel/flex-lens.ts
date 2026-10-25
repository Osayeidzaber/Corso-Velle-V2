import { Mesh, Program, RenderTarget, Triangle, type Renderer } from 'ogl';
import { lensFragment, lensVertex } from './flex-shaders';

const ANGLE = 62 * Math.PI / 180;
const CA = Math.cos(ANGLE); const SA = Math.sin(ANGLE);
const clamp = (n: number) => Math.min(1, Math.max(0, n));
// A wide, flat centre with edges that curl sharply, so the centred product stays undistorted.
const LENS_WIDTH = .84; const LENS_HEIGHT = 1.28; const REACH = .34; const BEND = .42;

/** The source component's default liquid preset. Map displayed points back to the scene for
 * accurate product clicks, using the same displacement as lensFragment (WebGL Y points upward).
 */
export function lensScenePoint(x: number, y: number, width: number, height: number, strength: number): [number, number] {
  const rx = x - width / 2; const ry = height / 2 - y;
  const halfW = Math.max(1, LENS_WIDTH * width / 2); const halfH = Math.max(1, LENS_HEIGHT * width / 2);
  const lx = CA * rx + SA * ry; const ly = -SA * rx + CA * ry;
  const kx = Math.max(Math.abs(lx) / halfW, .00001); const ky = Math.max(Math.abs(ly) / halfH, .00001);
  const nd = Math.hypot(kx, ky);
  const gx = kx * Math.sign(lx) / halfW / nd; const gy = ky * Math.sign(ly) / halfH / nd;
  const length = Math.max(Math.hypot(gx, gy), .000001);
  const edge = (nd - 1) / length;
  const nx = CA * gx / length - SA * gy / length; const ny = SA * gx / length + CA * gy / length;
  const inner = REACH * (halfW + halfH) * .5;
  const t = clamp((edge + inner) / (inner * 2.6));
  const ramp = t * t * t * (t * (t * 6 - 15) + 10);
  const sideT = clamp((Math.abs(rx / (width * .5)) - .02) / .28);
  const side = sideT * sideT * (3 - 2 * sideT) * Math.sign(rx);
  const flow = BEND * (halfW + halfH) * .45;
  const lift = ramp * side * flow * strength;
  const swirl = 16 * t * t * (1 - t) * (1 - t) * side * flow * strength * .35;
  return [x + ny * nx * swirl, y + lift + nx * nx * swirl];
}

/** OGL two-pass lens (shader and preset from the original FlexCarousel), with a bounded pixel budget. */
export function createFlexLens(renderer: Renderer) {
  const gl = renderer.gl;
  const target = new RenderTarget(gl, { width: 2, height: 2, depth: false, minFilter: gl.LINEAR_MIPMAP_LINEAR, magFilter: gl.LINEAR });
  const uniforms = {
    tScene: { value: target.texture }, uResolution: { value: [1, 1] }, uDpr: { value: 1 },
    uCenter: { value: [0, 0] }, uHalf: { value: [1, 1] }, uAngle: { value: ANGLE },
    uExponent: { value: 2 }, uInner: { value: 60 }, uOuter: { value: 80 },
    uFlow: { value: 0 }, uCurl: { value: 0 }, uDispersion: { value: .45 * .12 },
    uStrength: { value: 0 }, uSceneAlpha: { value: 0 },
  };
  const program = new Program(gl, { vertex: lensVertex, fragment: lensFragment, uniforms, depthTest: false, depthWrite: false });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  return {
    target,
    linked: gl.getProgramParameter(program.program, gl.LINK_STATUS) as boolean,
    resize(width: number, height: number) {
      target.setSize(Math.max(2, Math.round(width * renderer.dpr)), Math.max(2, Math.round(height * renderer.dpr)));
    },
    render(width: number, height: number, strength: number, alpha: number) {
      renderer.bindFramebuffer(); target.texture.bind(); gl.generateMipmap(gl.TEXTURE_2D);
      const halfW = Math.max(1, LENS_WIDTH * width / 2); const halfH = Math.max(1, LENS_HEIGHT * width / 2);
      const inner = REACH * (halfW + halfH) * .5;
      uniforms.tScene.value = target.texture;
      uniforms.uResolution.value = [width, height]; uniforms.uDpr.value = renderer.dpr;
      uniforms.uCenter.value = [width / 2, height / 2]; uniforms.uHalf.value = [halfW, halfH];
      uniforms.uInner.value = inner; uniforms.uOuter.value = inner * 1.6;
      uniforms.uFlow.value = BEND * (halfW + halfH) * .45;
      uniforms.uStrength.value = strength; uniforms.uSceneAlpha.value = alpha;
      renderer.render({ scene: mesh });
    },
    dispose() {
      mesh.geometry.remove(); program.remove(); gl.deleteTexture(target.texture.texture); gl.deleteFramebuffer(target.buffer);
    },
  };
}
