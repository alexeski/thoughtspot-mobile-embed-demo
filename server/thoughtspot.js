// ThoughtSpot REST API v2 calls made by the backend.

import { TS_HOST, TS_ORG_ID, TS_PASSWORD, TS_SECRET_KEY, TS_USERNAME } from './config.js';

// ── Tokens (used by every option) ────────────────────────────────────────────
// Mobile embeds only support cookieless trusted auth: the app asks for a token,
// and this is where it comes from. In a real app you'd look up the signed-in
// user and mint a token for *them* (trusted auth + secret key), so row-level
// security follows the user. For the demo every request uses TS_USERNAME.
let cached = { token: null, expiresAt: 0 };

export async function getToken() {
  if (cached.token && Date.now() < cached.expiresAt - 60_000) return cached.token;

  const res = await fetch(`${TS_HOST}/api/rest/2.0/auth/token/full`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      username: TS_USERNAME,
      ...(TS_SECRET_KEY ? { secret_key: TS_SECRET_KEY } : { password: TS_PASSWORD }),
      ...(TS_ORG_ID ? { org_id: Number(TS_ORG_ID) } : {}),
      validity_time_in_sec: 3600,
    }),
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  cached = { token: body.token, expiresAt: body.expiration_time_in_millis };
  return cached.token;
}

// ── Answer export (option 5 – native charts) ─────────────────────────────────
// Every Spotter answer is identified by a session id + generation number.
// Exporting it returns *that* answer's rows, with the filters Spotter applied.
export async function exportAnswerCsv(sessionId, genNo) {
  const res = await fetch(`${TS_HOST}/api/rest/2.0/report/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` },
    body: JSON.stringify({ session_identifier: sessionId, generation_number: genNo, file_format: 'CSV' }),
  });
  if (!res.ok) throw new Error(`Answer export failed: ${res.status} ${await res.text()}`);
  return res.text();
}
