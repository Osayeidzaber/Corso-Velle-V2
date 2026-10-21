import { describe, expect, it } from 'vitest';
import { HttpError, isAmbiguous, NetworkError, Sequencer, TimeoutError } from '../../src/services/request';

describe('Sequencer', () => {
  it('delivers only the latest response, even when an older one resolves last', async () => {
    const sequencer = new Sequencer();
    const slow = sequencer.run(() => new Promise<string>((resolve) => setTimeout(() => resolve('lin'), 30)));
    const fast = sequencer.run(() => new Promise<string>((resolve) => setTimeout(() => resolve('linen'), 5)));
    const [first, second] = await Promise.all([slow, fast]);
    expect(first.stale).toBe(true);
    expect(second).toEqual({ value: 'linen', stale: false });
  });

  it('aborts the previous request signal when a new one starts', async () => {
    const sequencer = new Sequencer();
    let firstSignal: AbortSignal | null = null;
    const first = sequencer.run((signal) => {
      firstSignal = signal;
      return new Promise((resolve) => setTimeout(() => resolve('a'), 20));
    });
    void sequencer.run(() => Promise.resolve('b'));
    expect(firstSignal!.aborted).toBe(true);
    expect((await first).stale).toBe(true);
  });
});

describe('isAmbiguous', () => {
  it('flags only outcomes where the server may have applied a POST', () => {
    expect(isAmbiguous(new TimeoutError('t'))).toBe(true);
    expect(isAmbiguous(new NetworkError('n'))).toBe(true);
    expect(isAmbiguous(new HttpError(502, null))).toBe(true);
    expect(isAmbiguous(new HttpError(422, null))).toBe(false);
    expect(isAmbiguous(new HttpError(429, null))).toBe(false);
  });
});
