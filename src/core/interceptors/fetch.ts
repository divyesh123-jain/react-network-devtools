import { NetworkEvent } from '../../types/network';
import { getNetworkStore } from '../store/network-store';
import { parseQueryParams } from '../parser/query';
import { parseBody } from '../parser/body';
import { parseHeaders } from '../parser/headers';

let originalFetch: typeof window.fetch | null = null;
let isInstalled = false;

function generateId(): string {
  return `fetch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function installFetchInterceptor(
  maxBodySize: number = 1_000_000,
  captureBodies: boolean = true,
  captureHeaders: boolean = true
): void {
  if (isInstalled) return;
  if (typeof window === 'undefined') return;

  originalFetch = window.fetch;
  const capturedFetch = originalFetch; // Capture reference to prevent race condition
  isInstalled = true;

  window.fetch = async function (...args: Parameters<typeof window.fetch>): Promise<Response> {
    const store = getNetworkStore();
    const id = generateId();
    const startTime = performance.now();

    // Parse request info
    const [input, init] = args;
    let url = '';
    let method = 'GET';
    let requestHeaders: Record<string, string> = {};
    let requestBody: unknown = undefined;

    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input instanceof Request) {
      url = input.url;
      method = input.method;
      if (captureHeaders) {
        requestHeaders = parseHeaders(input.headers);
      }
    }

    if (init) {
      if (init.method) method = init.method;
      if (captureHeaders && init.headers) {
        if (init.headers instanceof Headers) {
          requestHeaders = { ...requestHeaders, ...parseHeaders(init.headers) };
        } else if (Array.isArray(init.headers)) {
          const h: Record<string, string> = {};
          init.headers.forEach(([k, v]) => { h[k] = v; });
          requestHeaders = { ...requestHeaders, ...h };
        } else if (typeof init.headers === 'object') {
          requestHeaders = { ...requestHeaders, ...(init.headers as Record<string, string>) };
        }
      }
      if (captureBodies && init.body) {
        requestBody = parseBody(init.body);
      }
    }

    const queryParams = parseQueryParams(url);

    const event: NetworkEvent = {
      id,
      method: method.toUpperCase(),
      url,
      type: 'fetch',
      state: 'pending',
      startTime,
      requestHeaders: captureHeaders ? requestHeaders : undefined,
      queryParams,
      requestBody: captureBodies ? requestBody : undefined,
    };

    store.add(event);

    try {
      const response = await capturedFetch.apply(window, args);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Clone response to read body without consuming it
      const clonedResponse = response.clone();
      let responseBody: unknown = undefined;
      let responseSize: number | undefined;
      let contentType: string | undefined;

      if (captureBodies) {
        contentType = response.headers.get('content-type') || undefined;
        try {
          const text = await clonedResponse.text();
          responseSize = new Blob([text]).size;
          if (responseSize <= maxBodySize) {
            try {
              responseBody = JSON.parse(text);
            } catch {
              responseBody = text.length > 0 ? text.substring(0, maxBodySize) : undefined;
            }
          }
        } catch {
          // Failed to read body
        }
      }

      const responseHeaders: Record<string, string> = {};
      if (captureHeaders) {
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
      }

      store.update(id, {
        status: response.status,
        statusText: response.statusText,
        state: response.ok ? 'success' : 'error',
        endTime,
        duration,
        responseBody,
        responseSize,
        contentType,
        responseHeaders: captureHeaders ? responseHeaders : undefined,
      });

      return response;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      store.update(id, {
        state: 'error',
        endTime,
        duration,
        error: {
          message: error instanceof Error ? error.message : 'Network error',
        },
      });

      throw error;
    }
  };
}

export function uninstallFetchInterceptor(): void {
  if (!isInstalled || !originalFetch) return;
  window.fetch = originalFetch;
  originalFetch = null;
  isInstalled = false;
}
