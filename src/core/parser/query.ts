export function parseQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  try {
    const urlObj = new URL(url, 'http://localhost');
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
  } catch {
    // Invalid URL
  }
  return params;
}
