import { describe, expect, it } from 'vitest';
import { angleForSide, faceAt, makeGarment, RackSim, springFromSliders, stepAngle, tuningFor } from '../../src/components/clothes-rack/rack-physics';

const SLOT = 80;
const WIDE = 220;

function rack(count = 5, feel: 'soft' | 'balanced' | 'snappy' = 'balanced', swing = 1) {
  const sim = new RackSim(tuningFor({ feel, swing }));
  sim.slot = SLOT;
  sim.wide = WIDE;
  sim.garments = Array.from({ length: count }, (_, i) => makeGarment(i * SLOT, 68));
  return sim;
}

/** Runs at 60fps from time `start` until settled; returns the simulated seconds it took. */
function settle(sim: RackSim, start = 1000, limit = 30): number {
  let now = start;
  while (now - start < limit * 1000) {
    now += 1000 / 60;
    if (!sim.step(1 / 60, now)) return (now - start) / 1000;
  }
  throw new Error('never settled');
}

/** Faces garment `front` the way the element does: neighbours stand aside by half the difference. */
function face(sim: RackSim, front: number) {
  const gap = (sim.wide - sim.slot) / 2;
  sim.garments.forEach((g, i) => {
    g.tx = Math.sign(i - front) * gap;
    g.tturn = i === front ? 0 : g.rest;
  });
}

describe('RackSim', () => {
  it('sleeps straight away when nothing is asked of it', () => {
    expect(rack().step(1 / 60, 1000)).toBe(false);
  });

  it.each(['soft', 'balanced', 'snappy'] as const)('%s: turns a garment to the front and stops', (feel) => {
    const sim = rack(5, feel);
    face(sim, 2);
    settle(sim);
    const [left, middle, right] = [sim.garments[1]!, sim.garments[2]!, sim.garments[3]!];
    expect(middle.turn).toBeCloseTo(0, 0);
    expect(left.x).toBeCloseTo(-70, 0);
    expect(right.x).toBeCloseTo(70, 0);
  });

  it('does not treat settled neighbours as touching, so targets and collisions never fight', () => {
    const sim = rack();
    face(sim, 2);
    settle(sim);
    const before = sim.garments.map((g) => g.x);
    sim.step(1 / 60, 40_000);
    sim.garments.forEach((g, i) => expect(g.x).toBeCloseTo(before[i]!, 1));
  });

  it('swings garments when they accelerate, harder with a higher setting, not at all at zero', () => {
    const peak = (swing: number) => {
      const sim = rack(5, 'balanced', swing);
      face(sim, 0);
      let max = 0;
      let now = 1000;
      for (let i = 0; i < 120; i++) {
        now += 1000 / 60;
        sim.step(1 / 60, now);
        max = Math.max(max, Math.abs(sim.garments[3]!.swing));
      }
      return max;
    };
    expect(peak(0)).toBe(0);
    expect(peak(1)).toBeGreaterThan(0.1);
    expect(peak(2)).toBeGreaterThan(peak(1));
  });

  it('pushes neighbours out of the way of a dragged hanger', () => {
    const sim = rack();
    sim.drag = 1;
    sim.free = 5000;
    sim.garments[1]!.x = 120;
    sim.step(1 / 60, 1000);
    expect(sim.garments[1]!.x).toBe(120); // the pointer owns it
    expect(sim.garments[2]!.base + sim.garments[2]!.x).toBeGreaterThan(sim.garments[1]!.base + 120);
    expect(sim.garments[0]!.x).toBeCloseTo(0, 0);
  });

  it('coasts on the rail after a throw, then returns home', () => {
    const sim = rack();
    const g = sim.garments[2]!;
    g.vx = 800;
    sim.free = 1500;
    sim.step(1 / 60, 1100);
    expect(g.x).toBeGreaterThan(0);
    settle(sim, 1100);
    sim.garments.forEach((other) => expect(other.x).toBeCloseTo(0, 0));
  });

  it('keeps a thrown garment on the rail', () => {
    const sim = rack();
    sim.min = -10;
    sim.max = 330;
    const last = sim.garments[4]!;
    last.vx = 5000;
    sim.free = 3000;
    let now = 1000;
    for (let i = 0; i < 60; i++) {
      now += 1000 / 60;
      sim.step(1 / 60, now);
      expect(last.base + last.x).toBeLessThanOrEqual(330.001);
    }
  });

  it('holds a staggered garment still and invisible to collisions until its time', () => {
    const sim = rack(2);
    const held = sim.garments[1]!;
    held.x = -300;
    held.tx = 0;
    held.hold = 2000;
    expect(sim.step(1 / 60, 1000)).toBe(true);
    expect(held.x).toBe(-300);
    expect(sim.garments[0]!.x).toBe(0);
    settle(sim, 2000);
    expect(held.x).toBeCloseTo(0, 0);
  });

  it('ends in the same place on a slow device as a fast one, in the same time', () => {
    const run = (fps: number) => {
      const sim = rack();
      face(sim, 2);
      let now = 1000;
      for (let t = 0; t < 0.35; t += 1 / fps) {
        now += 1000 / fps;
        sim.step(1 / fps, now);
      }
      return sim.garments[2]!.turn;
    };
    expect(Math.abs(run(15) - run(120))).toBeLessThan(6);
  });

  it('stays stable through a very long frame', () => {
    const sim = rack(5, 'snappy');
    face(sim, 2);
    sim.step(5, 1000);
    sim.garments.forEach((g) => {
      expect(Number.isFinite(g.x)).toBe(true);
      expect(Math.abs(g.turn)).toBeLessThan(120);
    });
  });

  it('settle() lands everything on its target and stills it', () => {
    const sim = rack();
    face(sim, 1);
    sim.garments[3]!.vswing = 50;
    sim.garments[3]!.hold = Infinity;
    sim.settle();
    expect(sim.garments[1]!.turn).toBe(0);
    expect(sim.garments[3]!.swing).toBe(0);
    expect(sim.step(1 / 60, 1000)).toBe(false);
  });
});

describe('editor sliders', () => {
  it('map to stiffer and less damped springs in the expected direction', () => {
    expect(springFromSliders(100, 0).stiffness).toBeGreaterThan(springFromSliders(1, 0).stiffness);
    const calm = springFromSliders(50, 0);
    const lively = springFromSliders(50, 100);
    expect(lively.damping).toBeLessThan(calm.damping);
  });

  it('never produce an unstable spring, whatever is typed in', () => {
    const wild = springFromSliders(9000, 9000);
    expect(wild.damping).toBeGreaterThan(0);
    expect(wild.stiffness).toBeLessThanOrEqual(400);
  });

  it('custom feel uses the sliders; presets ignore them', () => {
    expect(tuningFor({ feel: 'custom', turnSpeed: 100 }).turn.stiffness).toBe(400);
    expect(tuningFor({ feel: 'soft', turnSpeed: 100 }).turn.stiffness).toBe(70);
  });
});

describe('focused view spin', () => {
  it('shows the side facing the visitor, never mirrored', () => {
    expect(faceAt(0)).toEqual({ side: 'front', shown: 0 });
    expect(faceAt(89).side).toBe('front');
    expect(faceAt(91)).toEqual({ side: 'back', shown: -89 });
    expect(faceAt(180)).toEqual({ side: 'back', shown: 0 });
    expect(faceAt(-180).side).toBe('back');
    expect(faceAt(360)).toEqual({ side: 'front', shown: 360 });
  });

  it('takes the short way round to a side', () => {
    expect(angleForSide(10, 'back')).toBe(180);
    expect(angleForSide(350, 'back')).toBe(180);
    expect(angleForSide(350, 'front')).toBe(360);
    expect(angleForSide(-170, 'back')).toBe(-180);
    expect(Math.abs(angleForSide(-10, 'front'))).toBe(0);
  });

  it('stepAngle settles exactly on target and reports it', () => {
    const state = { value: 0, velocity: 0, target: 180 };
    const s = springFromSliders(50, 30);
    let moving = true;
    for (let i = 0; i < 2000 && moving; i++) moving = stepAngle(state, 1 / 60, s);
    expect(moving).toBe(false);
    expect(state.value).toBe(180);
  });
});
