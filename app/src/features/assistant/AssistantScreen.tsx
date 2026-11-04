// ─────────────────────────────────────────────────────────────────────────────
// Assistant tab – headless Spotter via the Spotter MCP Server (options 4–5).
//
// Here ThoughtSpot is the analytics agent and the app owns the whole UI: this
// file is just a chat screen. The conversation flow is in useSpotterChat.ts;
// how each answer is shown is picked by the option toggle (AnswerCard.tsx).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ScrollViewInstance,
} from 'react-native';

import type { OptionKey } from '../../options';
import { colors, fonts } from '../../theme';
import Markdown from '../../ui/Markdown';
import OptionPicker, { BarButton } from '../../ui/OptionPicker';
import AnswerCard from './AnswerCard';
import { useSpotterChat } from './useSpotterChat';

const SUGGESTIONS = [
  'What are total sales by region?',
  'Monthly sales trend over the last 12 months',
  'What were total sales last year?',
];

export default function AssistantScreen({
  option,
  onOptionChange,
}: {
  option: OptionKey;
  onOptionChange: (key: OptionKey) => void;
}) {
  const { messages, busy, ask, reset } = useSpotterChat();
  const [input, setInput] = useState('');
  const scroll = useRef<ScrollViewInstance>(null);

  function send(text: string) {
    setInput('');
    ask(text);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Switching the option re-renders every answer already in the chat */}
      <OptionPicker
        tab="assistant"
        value={option}
        onChange={onOptionChange}
        right={<BarButton label="New chat" onPress={reset} disabled={busy} />}
      />

      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && (
          <View style={{ gap: 8 }}>
            <Text style={styles.intro}>Ask Northpeak's data a question:</Text>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity key={s} style={styles.chip} onPress={() => send(s)}>
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {messages.map((m, i) =>
          m.role === 'user' ? (
            <View key={i} style={[styles.bubble, styles.user]}>
              <Text style={styles.userText}>{m.text}</Text>
            </View>
          ) : (
            <View key={i} style={[styles.bubble, styles.spotter]}>
              {!m.done && (
                <View style={styles.step}>
                  <ActivityIndicator size="small" color={colors.brand} />
                  <Text style={styles.caption}>{m.step}</Text>
                </View>
              )}
              {m.answers.map((a) => <AnswerCard key={a.answer_id} answer={a} option={option} />)}
              {!!m.text && <Markdown text={m.text} />}
            </View>
          ),
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about sales, products, stores…"
            placeholderTextColor={colors.muted}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            editable={!busy}
          />
          <TouchableOpacity style={[styles.send, busy && { opacity: 0.4 }]} onPress={() => send(input)} disabled={busy}>
            <Text style={styles.sendText}>Ask</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  caption: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13 },
  // On tablets the conversation stays a readable column instead of spanning the screen
  list: { padding: 16, gap: 12, width: '100%', maxWidth: 820, alignSelf: 'center' },
  intro: { color: colors.text, fontSize: 16, fontFamily: fonts.semibold, marginBottom: 4 },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  chipText: { fontFamily: fonts.semibold, color: colors.brand },
  bubble: { borderRadius: 16, padding: 12, gap: 10, maxWidth: '92%' },
  user: { backgroundColor: colors.brand, alignSelf: 'flex-end' },
  userText: { color: '#fff', fontFamily: fonts.regular, fontSize: 15 },
  spotter: { backgroundColor: colors.surface, alignSelf: 'flex-start', width: '92%' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputBar: { padding: 12, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  // Same width as the conversation column above
  inputRow: { flexDirection: 'row', gap: 8, width: '100%', maxWidth: 820, alignSelf: 'center' },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  send: { backgroundColor: colors.accent, borderRadius: 20, paddingHorizontal: 18, justifyContent: 'center' },
  sendText: { color: '#fff', fontFamily: fonts.bold },
});
