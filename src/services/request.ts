/**
 * Network layer with typed errors and "latest wins" sequencing (master-plan/04 §5.2).
 * POSTs are never retried here; ambiguity is handled by the caller (see cart service).
 */
export class NetworkError extends Error {
  override name = 'NetworkError';
}
export class TimeoutError extends Error {
  override name = 'TimeoutError';
}
export class HttpError extends Error {
  override name = 'HttpError';
  constructor(
    readonly status: number,
    readonly body: unknown,
    message = `HTTP ${status}`,
  ) {
    super(message);
  }
}
export class AbortedError extends Error {
  override name = 'AbortedError';
}

export interface RequestOptions extends Omit<RequestInit, 'signal'> {
  timeoutMs?: number;
  signal?: AbortSignal;
}

async function send(url: string, { timeoutMs = 15000, signal, ...init }: RequestOptions): Promise<Response> {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(new TimeoutError(`Timed out after ${timeoutMs}ms`)), timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout.signal]) : timeout.signal;
  try {
    return await fetch(url, { credentials: 'same-origin', ...init, signal: combined });
  } catch (error) {
    if (timeout.signal.aborted) throw new TimeoutError(`Timed out after ${timeoutMs}ms`);
    if (signal?.aborted) throw new AbortedError('Superseded');
    throw new NetworkError(error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timer);
  }
}

async function readBody(response: Response): Promise<unknown> {
  const type = response.headers.get('content-type') ?? '';
  if (type.includes('json')) return response.json().catch(() => null);
  return response.text().catch(() => null);
}

export async function fetchText(url: string, options: RequestOptions = {}): Promise<string> {
  const response = await send(url, options);
  if (!response.ok) throw new HttpError(response.status, await readBody(response));
  return response.text();
}

export async function fetchJSON<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(url, {
    ...options,
    headers: { Accept: 'application/json', ...(options.headers ?? {}) },
  });
  const body = await readBody(response);
  if (!response.ok) {
    const message =
      (body as { description?: string; message?: string } | null)?.description ??
      (body as { message?: string } | null)?.message;
    throw new HttpError(response.status, body, message ?? `HTTP ${response.status}`);
  }
  return body as T;
}

/**
 * One sequencer per logical stream (a search box, a variant picker, a filter form). Starting a
 * new request aborts the previous one; a response is only delivered if it is still the latest.
 */
export class Sequencer {
  #controller: AbortController | null = null;
  #counter = 0;

  async run<T>(task: (signal: AbortSignal) => Promise<T>): Promise<{ value: T; stale: false } | { stale: true }> {
    this.#controller?.abort();
    const controller = new AbortController();
    this.#controller = controller;
    const id = ++this.#counter;
    try {
      const value = await task(controller.signal);
      if (id !== this.#counter) return { stale: true };
      return { value, stale: false };
    } catch (error) {
      if (id !== this.#counter || error instanceof AbortedError) return { stale: true };
      throw error;
    }
  }

  cancel(): void {
    this.#controller?.abort();
    this.#counter++;
  }
}

/** Errors after which a POST may or may not have been applied by the server. */
export function isAmbiguous(error: unknown): boolean {
  return error instanceof TimeoutError || error instanceof NetworkError || (error instanceof HttpError && error.status >= 500);
}
