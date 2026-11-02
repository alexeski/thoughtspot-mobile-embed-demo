import { BACKEND_URL } from './config';

// One place for every call to our backend, so failures read as English
// instead of "JSON Parse error: Unexpected character: <".
export async function backend<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  });
  const text = await res.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    // Typically an HTML error page: an old backend without this route, or a proxy in the way
    throw new Error(`Backend answered ${res.status} with non-JSON for ${path}. Is it running the latest code? Restart it with npm start.`);
  }
  if (!res.ok) throw new Error(body.error ?? res.statusText);
  return body;
}
