// Shapes of the Spotter MCP Server's get_session_updates response
// (default format – see the "MCP tool reference (Spotter 3)" docs).

// One answer = one chart Spotter generated.
export type SpotterAnswer = {
  answer_id: string; // '{"session_id":"…","gen_no":2}' – identifies this exact answer (option 5)
  answer_title: string;
  answer_query: string; // ThoughtSpot search tokens, e.g. "[sales] [region]"
  answer_data_source_id: string;
  iframe_url: string; // https://<host>/?tsmcp=true#/embed/conv-assist-answer?sessionId=… (option 4)
};

// One item in session_updates.
export type SessionUpdate =
  | { type: 'step_notification'; is_thinking: boolean; text: string } // "Fetching data from dataset"
  | { type: 'text_chunk'; is_thinking: boolean; text: string } // narration, streamed in fragments
  | ({ type: 'answer'; is_thinking: boolean } & SpotterAnswer);

// What the chat screen renders.
export type ChatMessage =
  | { role: 'user'; text: string }
  | { role: 'spotter'; step: string; text: string; answers: SpotterAnswer[]; done: boolean };
