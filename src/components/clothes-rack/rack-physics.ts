/**
 * The rail's physics, free of the DOM so it can be tested and reasoned about alone.
 *
 * Every garment is a handful of springs: where it sits on the rail, how far it has turned, how
 * far it is swinging on its hook. Sliding a hanger accelerates it, and acceleration is what makes
 * it swing, so the swing is never a canned animation: flick one and it swings harder.
 */

export type Feel = 'soft' | 'balanced' | 'snappy' | 'custom';

export interface Spring {
  stiffness: number;
  damping: number;
}

export interface RackTuning {
  turn: Spring;
  slide: Spring;
  /** Multiplies how hard acceleration kicks a hanger; 0 stops all swinging. */
  swing: number;
  /** Seconds for a swing to die away. */
  swingSeconds: number;
  /** 0..1, how far the cloth trails its hanger. */
  drape: number;
}

const FEELS: Record<Exclude<Feel, 'custom'>, { turn: [number, number]; slide: [number, number] }> = {
  soft: { turn: [70, 0.86], slide: [70, 0.96] },
  balanced: { turn: [140, 0.8], slide: [130, 0.88] },
  snappy: { turn: [260, 0.72], slide: [240, 0.82] },
};

const spring = (stiffness: number, ratio: number): Spring => ({
  stiffness,
  damping: 2 * Math.sqrt(stiffness) * ratio,
});

/** Theme editor sliders (speed 1..100, bounce 0..100) to a spring. */
export function springFromSliders(speed: number, bounce: number): Spring {
  const s = clamp(speed, 1, 100) / 100;
  return spring(30 + s * s * 370, 1 - (clamp(bounce, 0, 100) / 100) * 0.6);
}

export function tuningFor(options: {
  feel: Feel;
  turnSpeed?: number;
  turnBounce?: number;
  slideSpeed?: number;
  slideBounce?: number;
  swing?: number;
  swingSeconds?: number;
  drape?: number;
}): RackTuning {
  const preset = options.feel === 'custom' ? null : FEELS[options.feel] ?? FEELS.balanced;
  return {
    turn: preset ? spring(...preset.turn) : springFromSliders(options.turnSpeed ?? 50, options.turnBounce ?? 30),
    slide: preset ? spring(...preset.slide) : springFromSliders(options.slideSpeed ?? 50, options.slideBounce ?? 15),
    swing: Math.max(0, options.swing ?? 1),
    swingSeconds: Math.max(0.2, options.swingSeconds ?? 3),
    drape: clamp(options.drape ?? 0.5, 0, 1),
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export interface Garment {
  /** Slot centre along the rail (px). Fixed by layout. */
  base: number;
  /** Offset from the slot (px), and where it wants to be. */
  x: number;
  vx: number;
  tx: number;
  /** Lift above the rail (px); only the entrance uses it. */
  y: number;
  vy: number;
  /** Rotation about the hook (deg), and where it wants to be. */
  turn: number;
  vturn: number;
  tturn: number;
  /** The angle it hangs at when nothing is asking it to face the visitor. */
  rest: number;
  /** Pendulum angle on the hook (deg). */
  swing: number;
  vswing: number;
  /** The hang tag's own smaller pendulum (deg). */
  tag: number;
  vtag: number;
  /** Opacity multiplier and its target. */
  fade: number;
  tfade: number;
  /** Timestamp the garment waits for before moving; the entrance staggers with this. */
  hold: number;
  lastVx: number;
}

const SUBSTEPS = 2;
const MAX_FRAME = 0.1;
const MAX_STEP = 1 / 120;
const TURN_SWING_LIMIT = 12;
const TAG_LIMIT = 30;

export function makeGarment(base: number, rest: number): Garment {
  return {
    base, x: 0, vx: 0, tx: 0, y: 0, vy: 0,
    turn: rest, vturn: 0, tturn: rest, rest,
    swing: 0, vswing: 0, tag: 0, vtag: 0,
    fade: 1, tfade: 1, hold: 0, lastVx: 0,
  };
}

export class RackSim {
  garments: Garment[] = [];
  tuning: RackTuning;
  /** Spacing at rest (px) and the width of a garment facing the visitor (px). */
  slot = 0;
  wide = 0;
  /** Index held by the pointer, or -1. */
  drag = -1;
  /** Until this time, garments coast on the rail instead of springing back to their slots. */
  free = 0;
  /** Rail ends in `base` coordinates, enforced only while garments coast. */
  min = -Infinity;
  max = Infinity;

  constructor(tuning: RackTuning) {
    this.tuning = tuning;
  }

  /** Room a garment takes on the rail at its current angle. */
  footprint(g: Garment): number {
    const e = g.rest === 0 ? 1 : clamp(1 - g.turn / g.rest, 0, 1);
    return this.slot + (this.wide - this.slot) * (e * e * (3 - 2 * e));
  }

  /** Advances by dt seconds of real time. Returns true while anything is still moving. */
  step(dtSeconds: number, now: number): boolean {
    // A slow frame takes more small steps, not one big one: slow devices drop frames, not speed,
    // and the springs stay stable. Capped so a tab coming back from the background doesn't lurch.
    const elapsed = Math.min(MAX_FRAME, dtSeconds);
    const steps = Math.max(SUBSTEPS, Math.ceil(elapsed / MAX_STEP));
    const dt = elapsed / steps;
    for (let k = 0; k < steps; k++) {
      this.garments.forEach((g, i) => this.#integrate(g, i, dt, now));
      this.#collide(now);
    }
    const coasting = now < this.free;
    const busy = this.garments.some((g) => this.#moving(g, now, coasting));
    return busy || this.drag >= 0 || coasting;
  }

  #integrate(g: Garment, index: number, dt: number, now: number): void {
    const { turn, slide, swing, swingSeconds } = this.tuning;
    const held = now < g.hold;
    if (index !== this.drag && !held) {
      // While coasting a garment only feels friction; afterwards it springs home.
      const home = now >= this.free;
      const ax = (home ? -slide.stiffness * (g.x - g.tx) : 0) - (home ? slide.damping : 3.2) * g.vx;
      g.vx += ax * dt;
      g.x += g.vx * dt;
      const ay = -slide.stiffness * g.y - slide.damping * 0.55 * g.vy;
      g.vy += ay * dt;
      g.y += g.vy * dt;
    }

    const accel = clamp((g.vx - g.lastVx) / dt, -6000, 6000);
    g.lastVx = g.vx;

    const at = -turn.stiffness * (g.turn - g.tturn) - turn.damping * g.vturn;
    g.vturn += at * dt;
    g.turn += g.vturn * dt;

    // Dies to about 2% in swingSeconds: e^(-c·t/2) = 0.02.
    const c = 7.8 / swingSeconds;
    const as = -24 * g.swing - c * g.vswing - accel * 0.0045 * swing;
    g.vswing += as * dt;
    g.swing = clamp(g.swing + g.vswing * dt, -TURN_SWING_LIMIT, TURN_SWING_LIMIT);

    const atag = -46 * (g.tag - g.swing * 0.6) - 3.4 * g.vtag - g.vswing * 0.9;
    g.vtag += atag * dt;
    g.tag = clamp(g.tag + g.vtag * dt, -TAG_LIMIT, TAG_LIMIT);

    g.fade += (g.tfade - g.fade) * (1 - Math.exp(-dt * 9));
  }

  /** Hangers can't pass through each other: an overlap shoves both, and they share momentum. */
  #collide(now: number): void {
    const list = this.garments;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < list.length - 1; i++) {
        const a = list[i]!;
        const b = list[i + 1]!;
        if (now < a.hold || now < b.hold) continue;
        // 0.96: settled neighbours sit exactly footprint-apart, and must not count as touching.
        const gap = ((this.footprint(a) + this.footprint(b)) / 2) * 0.96;
        const overlap = gap - (b.base + b.x - a.base - a.x);
        if (overlap <= 0) continue;
        if (i === this.drag) b.x += overlap;
        else if (i + 1 === this.drag) a.x -= overlap;
        else {
          a.x -= overlap / 2;
          b.x += overlap / 2;
        }
        if (a.vx > b.vx) {
          const shared = (a.vx + b.vx) / 2;
          if (i !== this.drag) a.vx = shared;
          if (i + 1 !== this.drag) b.vx = shared;
        }
      }
    }
    if (now < this.free && list.length) {
      const first = list[0]!;
      const last = list[list.length - 1]!;
      if (first.base + first.x < this.min) {
        first.x = this.min - first.base;
        first.vx = Math.abs(first.vx) * 0.3;
      }
      if (last.base + last.x > this.max) {
        last.x = this.max - last.base;
        last.vx = -Math.abs(last.vx) * 0.3;
      }
    }
  }

  #moving(g: Garment, now: number, coasting: boolean): boolean {
    return (
      now < g.hold ||
      Math.abs(g.vx) > 0.4 ||
      (!coasting && Math.abs(g.x - g.tx) > 0.25) ||
      Math.abs(g.y) > 0.25 ||
      Math.abs(g.vy) > 0.4 ||
      Math.abs(g.turn - g.tturn) > 0.05 ||
      Math.abs(g.vturn) > 0.05 ||
      Math.abs(g.swing) > 0.02 ||
      Math.abs(g.vswing) > 0.05 ||
      Math.abs(g.tag) > 0.05 ||
      Math.abs(g.vtag) > 0.08 ||
      Math.abs(g.fade - g.tfade) > 0.002
    );
  }

  /** Puts everything exactly where it is heading: reduced motion, the editor, or a settled frame. */
  settle(): void {
    for (const g of this.garments) {
      g.x = g.tx;
      g.vx = 0;
      g.lastVx = 0;
      g.y = 0;
      g.vy = 0;
      g.turn = g.tturn;
      g.vturn = 0;
      g.swing = 0;
      g.vswing = 0;
      g.tag = 0;
      g.vtag = 0;
      g.fade = g.tfade;
      g.hold = 0;
    }
  }
}

/** A 1D spring for the focused view's spin; returns true while still moving. */
export function stepAngle(state: { value: number; velocity: number; target: number }, dtSeconds: number, s: Spring): boolean {
  const elapsed = Math.min(MAX_FRAME, dtSeconds);
  const steps = Math.max(1, Math.ceil(elapsed / MAX_STEP));
  for (let k = 0; k < steps; k++) {
    const dt = elapsed / steps;
    state.velocity += (-s.stiffness * (state.value - state.target) - s.damping * state.velocity) * dt;
    state.value += state.velocity * dt;
  }
  if (Math.abs(state.value - state.target) < 0.05 && Math.abs(state.velocity) < 0.05) {
    state.value = state.target;
    state.velocity = 0;
    return false;
  }
  return true;
}

/** Which side of the hero faces the visitor at an angle, and the rotation that draws it unmirrored. */
export function faceAt(angle: number): { side: 'front' | 'back'; shown: number } {
  const turned = ((angle % 360) + 360) % 360;
  return turned > 90 && turned < 270 ? { side: 'back', shown: angle - 180 } : { side: 'front', shown: angle };
}

/** The nearest whole turn that lands on a side, so the hero never unwinds the long way round. */
export function angleForSide(current: number, side: 'front' | 'back'): number {
  const offset = side === 'back' ? 180 : 0;
  return Math.round((current - offset) / 360) * 360 + offset;
}
