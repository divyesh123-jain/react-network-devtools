const SENSITIVE_KEYS = [
  'authorization',
  'cookie',
  'set-cookie',
  'password',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'apikey',
  'secret',
];

export function maskSensitiveHeaders(
  headers: Record<string, string>,
  maskEnabled: boolean = true
): Record<string, string> {
  if (!maskEnabled) return headers;

  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      masked[key] = maskValue(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export function maskSensitiveBody(
  body: unknown,
  maskEnabled: boolean = true
): unknown {
  if (!maskEnabled || typeof body !== 'object' || body === null) return body;

  if (Array.isArray(body)) {
    return body.map((item) => maskSensitiveBody(item, maskEnabled));
  }

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      masked[key] = '••••••••';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveBody(value, maskEnabled);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

function maskValue(value: string): string {
  if (value.length <= 8) return '••••••••';
  const prefix = value.substring(0, Math.min(8, value.indexOf(' ') + 1 || 8));
  return `${prefix}${'•'.repeat(Math.min(20, value.length - prefix.length))}`;
}
