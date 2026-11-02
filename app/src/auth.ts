import { BACKEND_URL } from './config';

// Mobile embedding only supports cookieless trusted auth: every embed asks
// for a token, and the token comes from *our* backend – never from a secret
// stored in the app bundle.
export async function getAuthToken(): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/token`);
  if (!res.ok) {
    throw new Error(`Token request failed (${res.status}). Is the backend running at ${BACKEND_URL}?`);
  }
  const { token } = await res.json();
  return token;
}
