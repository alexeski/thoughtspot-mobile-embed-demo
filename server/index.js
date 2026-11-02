// Northpeak backend – the HTTP routes the mobile app calls.
//
//   GET  /api/token                      → ThoughtSpot token for the embeds   (options 1–4)
//   POST /api/chat/sessions              → Spotter MCP step 1                 (options 4–5)
//   POST /api/chat/sessions/:id/messages → Spotter MCP step 2
//   GET  /api/chat/sessions/:id/updates  → Spotter MCP step 3
//   POST /api/answer-data                → an answer's exact rows             (option 5)
//
// Files:  config.js (settings) · thoughtspot.js (REST API) · spotterMcp.js (MCP client)
//         answerCsv.js (CSV → JSON)
//
// Run with:  npm start   (reads ./.env – see .env.example)

import express from 'express';
import cors from 'cors';

import { MODEL_ID, PORT, TS_HOST, TS_USERNAME } from './config.js';
import { exportAnswerCsv, getToken } from './thoughtspot.js';
import { callSpotter } from './spotterMcp.js';
import { parseAnswerCsv } from './answerCsv.js';

const app = express();
app.use(cors());
app.use(express.json());

// Express 5 forwards errors thrown in async routes to the error handler below,
// so the routes need no try/catch.

// ── Tokens ───────────────────────────────────────────────────────────────────
app.get('/api/token', async (_req, res) => {
  res.json({ token: await getToken() });
});

// ── Spotter MCP: the three-step Spotter 3 workflow, exposed 1:1 ──────────────

// Step 1 – create_analysis_session, pinned to the same model as the Liveboard.
// One session per conversation, so follow-up questions keep their context.
app.post('/api/chat/sessions', async (_req, res) => {
  const { analytical_session_id } = await callSpotter('create_analysis_session', { data_source_id: MODEL_ID });
  res.json({ sessionId: analytical_session_id });
});

// Step 2 – send_session_message. Returns immediately; Spotter works asynchronously.
// additional_context tells Spotter things it can't know from the data.
app.post('/api/chat/sessions/:id/messages', async (req, res) => {
  await callSpotter('send_session_message', {
    analytical_session_id: req.params.id,
    message: req.body.message,
    additional_context: 'The user is a Northpeak Outfitters store manager using the mobile app. Keep answers short.',
  });
  res.json({ ok: true });
});

// Step 3 – get_session_updates. The app polls this until is_done = true.
app.get('/api/chat/sessions/:id/updates', async (req, res) => {
  res.json(await callSpotter('get_session_updates', { analytical_session_id: req.params.id }));
});

// ── Answer data (option 5 – native charts) ───────────────────────────────────
// An MCP answer's answer_id is '{"session_id": "...", "gen_no": 2}' – exactly
// what the export API needs to return that answer's rows.
app.post('/api/answer-data', async (req, res) => {
  const { session_id, gen_no } = JSON.parse(req.body.answerId);
  res.json(parseAnswerCsv(await exportAnswerCsv(session_id, gen_no)));
});

// ── Errors: always JSON, so the app can show a readable message ──────────────
app.use((req, res) => {
  // Usually means the app is newer than the backend that's running
  res.status(404).json({ error: `Backend has no ${req.method} ${req.path}. Restart it (npm start) to pick up the latest code.` });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: String(err.message ?? err) });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Northpeak backend on http://0.0.0.0:${PORT} → ${TS_HOST} as ${TS_USERNAME}`);
});
