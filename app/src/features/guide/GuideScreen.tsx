// Guide tab – an overview of every embedding option in this app, generated
// from the catalog in src/options.ts. Tap an option to open it.
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { OPTIONS, OptionKey, optionsForTab } from '../../options';
import { colors } from '../../theme';
import { useLayout } from '../../ui/useLayout';

const SECTIONS = [
  { tab: 'dashboard', title: 'Dashboards', intro: 'Embed an existing Liveboard.' },
  { tab: 'spotter', title: 'Spotter, ready-made', intro: "ThoughtSpot's own conversational UI." },
  { tab: 'assistant', title: 'Spotter, headless', intro: 'Your own chat UI; Spotter is the agent behind it, via MCP.' },
] as const;

export default function GuideScreen({ onOpen }: { onOpen: (key: OptionKey) => void }) {
  const { isWide } = useLayout(); // tablets / landscape: option cards side by side

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.h1}>Five ways to put ThoughtSpot in a mobile app</Text>
      <Text style={styles.p}>
        Every option uses the same foundation: the app never holds ThoughtSpot credentials. It asks its own
        backend for a short-lived token (cookieless trusted auth), and every option uses the same data model.
      </Text>

      {SECTIONS.map((section) => (
        <View key={section.tab} style={styles.section}>
          <Text style={styles.h2}>{section.title}</Text>
          <Text style={styles.sectionIntro}>{section.intro}</Text>
          <View style={[styles.cardList, isWide && styles.columns]}>
            {optionsForTab(section.tab).map((key) => {
              const o = OPTIONS[key];
              return (
                <TouchableOpacity key={key} style={[styles.card, isWide && styles.cardHalf]} onPress={() => onOpen(key)}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.badge}>{o.number}</Text>
                    <Text style={styles.cardTitle}>{o.title}</Text>
                  </View>
                  <Text style={styles.label}>How</Text>
                  <Text style={styles.p}>{o.how}</Text>
                  <Text style={styles.label}>When to use it</Text>
                  <Text style={styles.p}>{o.when}</Text>
                  <Text style={styles.file}>{o.file}</Text>
                  <Text style={styles.open}>Open →</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 8, backgroundColor: colors.background },
  h1: { fontSize: 20, fontWeight: '800', color: colors.text },
  h2: { fontSize: 16, fontWeight: '700', color: colors.brand },
  p: { fontSize: 13, lineHeight: 19, color: colors.text },
  section: { marginTop: 12, gap: 8 },
  cardList: { gap: 8 },
  columns: { flexDirection: 'row', flexWrap: 'wrap' },
  cardHalf: { flexBasis: '48%', flexGrow: 1 },
  sectionIntro: { fontSize: 13, color: colors.muted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.brand,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '800',
    overflow: 'hidden',
  },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  label: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', marginTop: 6 },
  file: { fontSize: 11, color: colors.muted, fontFamily: 'monospace', marginTop: 8 },
  open: { color: colors.brand, fontWeight: '700', alignSelf: 'flex-end' },
});
