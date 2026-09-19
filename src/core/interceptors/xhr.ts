import { NetworkEvent } from '../../types/network';
import { getNetworkStore } from '../store/network-store';
import { parseQueryParams } from '../parser/query';
import { parseBody } from '../parser/body';

let isInstalled = false;
let originalOpen: typeof XMLHttpRequest.prototype.open | null = null;
let originalSend: typeof XMLHttpRequest.prototype.send | null = null;
let originalSetRequestHeader: typeof XMLHttpRequest.prototype.setRequestHeader | null = null;

function generateId(): string {
  return `xhr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function installXHRInterceptor(
  maxBodySize: number = 1_000_000,
  captureBodies: boolean = true,
  captureHeaders: boolean = true
): void {
  if (isInstalled) return;
  if (typeof window === 'undefined' || typeof XMLHttpRequest === 'undefined') return;

  isInstalled = true;
  originalOpen = XMLHttpRequest.prototype.open;
  originalSend = XMLHttpRequest.prototype.send;
  originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest & { _rndt?: { id: string; method: string; url: string; headers: Record<string, string> } },
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ) {
    this._rndt = {
      id: generateId(),
      method: method.toUpperCase(),
      url: url.toString(),
      headers: {},
    };
    return originalOpen!.apply(this, [method, url as string, ...rest] as Parameters<typeof XMLHttpRequest.prototype.open>);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (
    this: XMLHttpRequest & { _rndt?: { id: string; method: string; url: string; headers: Record<string, string> } },
    name: string,
    value: string
  ) {
    if (this._rndt && captureHeaders) {
      this._rndt.headers[name] = value;
    }
    return originalSetRequestHeader!.call(this, name, value);
  };

  XMLHttpRequest.prototype.send = function (
    this: XMLHttpRequest & { _rndt?: { id: string; method: string; url: string; headers: Record<string, string> } },
    body?: Document | XMLHttpRequestBodyInit | null
  ) {
    const store = getNetworkStore();
    const startTime = performance.now();
    const xhrData = this._rndt;

    if (!xhrData) {
      return originalSend!.call(this, body);
    }

    const { id, method, url, headers } = xhrData;
    const queryParams = parseQueryParams(url);
    let requestBody: unknown = undefined;

    if (captureBodies && body) {
      requestBody = parseBody(body);
    }

    const event: NetworkEvent = {
      id,
      method,
      url,
      type: 'xhr',
      state: 'pending',
      startTime,
      requestHeaders: captureHeaders ? headers : undefined,
      queryParams,
      requestBody: captureBodies ? requestBody : undefined,
    };

    store.add(event);

    this.addEventListener('load', function () {
      const endTime = performance.now();
      const duration = endTime - startTime;
      let responseBody: unknown = undefined;
      let responseSize: number | undefined;
      let contentType: string | undefined;

      if (captureBodies) {
        contentType = this.getResponseHeader('content-type') || undefined;
        try {
          const text = this.responseText;
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
        const allHeaders = this.getAllResponseHeaders();
        const headerLines = allHeaders.trim().split(/[\r\n]+/);
        headerLines.forEach((line) => {
          const parts = line.split(': ');
          const key = parts.shift();
          const value = parts.join(': ');
          if (key) responseHeaders[key] = value;
        });
      }

      store.update(id, {
        status: this.status,
        statusText: this.statusText,
        state: this.status >= 400 ? 'error' : 'success',
        endTime,
        duration,
        responseBody,
        responseSize,
        contentType,
        responseHeaders: captureHeaders ? responseHeaders : undefined,
      });
    });

    this.addEventListener('error', function () {
      const endTime = performance.now();
      const duration = endTime - startTime;
      store.update(id, {
        state: 'error',
        endTime,
        duration,
        error: { message: 'Network error' },
      });
    });

    this.addEventListener('abort', function () {
      const endTime = performance.now();
      const duration = endTime - startTime;
      store.update(id, {
        state: 'aborted',
        endTime,
        duration,
        error: { message: 'Request aborted' },
      });
    });

    this.addEventListener('timeout', function () {
      const endTime = performance.now();
      const duration = endTime - startTime;
      store.update(id, {
        state: 'error',
        endTime,
        duration,
        error: { message: 'Request timeout' },
      });
    });

    return originalSend!.call(this, body);
  };
}

export function uninstallXHRInterceptor(): void {
  if (!isInstalled) return;
  if (originalOpen) XMLHttpRequest.prototype.open = originalOpen;
  if (originalSend) XMLHttpRequest.prototype.send = originalSend;
  if (originalSetRequestHeader) XMLHttpRequest.prototype.setRequestHeader = originalSetRequestHeader;
  originalOpen = null;
  originalSend = null;
  originalSetRequestHeader = null;
  isInstalled = false;
}
