export function parseBody(body: unknown): unknown {
  if (!body) return undefined;

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  if (body instanceof FormData) {
    const obj: Record<string, string> = {};
    body.forEach((value, key) => {
      obj[key] = typeof value === 'string' ? value : '[File]';
    });
    return obj;
  }

  if (body instanceof URLSearchParams) {
    const obj: Record<string, string> = {};
    body.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  if (body instanceof Blob) {
    return `[Blob: ${body.size} bytes]`;
  }

  if (body instanceof ArrayBuffer) {
    return `[ArrayBuffer: ${body.byteLength} bytes]`;
  }

  if (typeof body === 'object') {
    return body;
  }

  return String(body);
}
