// ─────────────────────────────────────────────────────────────────────────────
// useSpotterChat – the Spotter MCP conversation flow, with no UI (options 5–6).
//
// Our backend exposes the Spotter MCP Server's three tools 1:1:
//   ① create_analysis_session → POST /api/chat/sessions
//   ② send_session_message    → POST /api/chat/sessions/:id/messages
//   ③ get_session_updates     → GET  /api/chat/sessions/:id/updates   (poll)
//
// Spotter answers asynchronously and streams its response across many polls,
// so we keep polling and fold each batch of updates into the last message
// until is_done = true.
// ─────────────────────────────────────────────────────────────────────────────
import { useRef, useState } from 'react';

import { backend } from '../../backend';
import type { ChatMessage, SessionUpdate } from './types';

type SpotterMessage = Extract<ChatMessage, { role: 'spotter' }>;

const POLL_INTERVAL_MS = 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useSpotterChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const sessionId = useRef<string | null>(null);

  // Applies a change to the Spotter message currently being streamed
  const updateLast = (fn: (m: SpotterMessage) => void) =>
    setMessages((prev) => {
      const last = { ...(prev[prev.length - 1] as SpotterMessage) };
      fn(last);
      return [...prev.slice(0, -1), last];
    });

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setBusy(true);
    setMessages((m) => [
      ...m,
      { role: 'user', text: question },
      { role: 'spotter', step: 'Thinking…', text: '', answers: [], done: false },
    ]);

    try {
      // ① One analytical session per conversation, so follow-ups keep context
      if (!sessionId.current) {
        sessionId.current = (await backend('/api/chat/sessions', { method: 'POST' })).sessionId;
      }
      const id = sessionId.current;

      // ② Send the question. Returns right away; Spotter works in the background.
      await backend(`/api/chat/sessions/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: question }),
      });

      // ③ Poll and accumulate until Spotter is done
      let done = false;
      while (!done) {
        await sleep(POLL_INTERVAL_MS);
        const { is_done, session_updates } = await backend<{ is_done: boolean; session_updates: SessionUpdate[] }>(
          `/api/chat/sessions/${id}/updates`,
        );
        done = is_done;
        updateLast((m) => {
          for (const u of session_updates) {
            // Step headings: show live progress
            if (u.type === 'step_notification') m.step = u.text;
            // Narration: thinking chunks are Spotter's reasoning; final chunks are the answer text
            if (u.type === 'text_chunk' && !u.is_thinking) m.text += u.text;
            // Answers: the same answer can arrive twice (thinking, then final) – keep one
            if (u.type === 'answer' && !m.answers.some((a) => a.answer_id === u.answer_id)) {
              m.answers = [...m.answers, u];
            }
          }
          m.done = is_done;
        });
      }
    } catch (e) {
      updateLast((m) => {
        m.text = `⚠️ ${e instanceof Error ? e.message : String(e)}`;
        m.done = true;
      });
    } finally {
      setBusy(false);
    }
  }

  // Forget the session: the next question starts a new conversation
  function reset() {
    sessionId.current = null;
    setMessages([]);
  }

  return { messages, busy, ask, reset };
}
