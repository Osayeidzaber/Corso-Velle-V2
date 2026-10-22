import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchJSON, HttpError, isAmbiguous, NetworkError, ParseError, Sequencer, TimeoutError } from '../../src/services/request';

afterEach(() => { vi.unstubAllGlobals(); });

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
    expect(isAmbiguous(new ParseError('truncated successful POST'))).toBe(true);
    expect(isAmbiguous(new HttpError(502, null))).toBe(true);
    expect(isAmbiguous(new HttpError(422, null))).toBe(false);
    expect(isAmbiguous(new HttpError(429, null))).toBe(false);
  });
});

describe('response consumption', () => {
  it('keeps the timeout active until the response body has arrived', async () => {
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => ({
      ok: true,
      text: () => new Promise<string>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      }),
    }));
    await expect(fetchJSON('/slow-body', { timeoutMs: 10 })).rejects.toBeInstanceOf(TimeoutError);
  });

  it('rejects a malformed or empty successful JSON response', async () => {
    vi.stubGlobal('fetch', async () => new Response(''));
    await expect(fetchJSON('/cart.js')).rejects.toBeInstanceOf(ParseError);
  });

  it('preserves Headers instances and adds the JSON Accept header', async () => {
    const fetch = vi.fn(async () => new Response('{}'));
    vi.stubGlobal('fetch', fetch);
    await fetchJSON('/cart.js', { headers: new Headers({ 'X-Test': 'value' }) });
    const headers = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Headers;
    expect(headers.get('X-Test')).toBe('value');
    expect(headers.get('Accept')).toBe('application/json');
  });
});
