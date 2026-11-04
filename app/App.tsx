// ─────────────────────────────────────────────────────────────────────────────
// Northpeak Insights – a teaching app for embedding ThoughtSpot in mobile apps.
//
// The app shell: brand header + four tabs. Each tab lives in src/features/<tab>/,
// and each embedding option in one self-contained file (see src/options.ts):
//
//   Guide      overview of all options               features/guide/
//   Dashboard  options 1–2  Liveboard                features/dashboard/
//   Spotter    option 3     Spotter UI               features/spotter/
//   Assistant  options 4–5  headless Spotter (MCP)   features/assistant/
//
// Plain state-driven tabs keep the shell easy to read; a real app would use
// Expo Router or React Navigation.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts } from '@expo-google-fonts/inter';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import AssistantScreen from './src/features/assistant/AssistantScreen';
import DashboardScreen from './src/features/dashboard/DashboardScreen';
import GuideScreen from './src/features/guide/GuideScreen';
import SpotterScreen from './src/features/spotter/SpotterScreen';
import { PRERENDER_DASHBOARD } from './src/config';
import { OPTIONS, OptionKey, TabKey } from './src/options';
import { colors, fonts } from './src/theme';
import PrefetchWarmup from './src/thoughtspot/PrefetchWarmup';
import { useLayout } from './src/ui/useLayout';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'guide', label: 'Guide' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'spotter', label: 'Spotter' },
  { key: 'assistant', label: 'Assistant' },
];

export default function App() {
  const [tab, setTab] = useState<TabKey>('guide');
  const { isShort } = useLayout(); // landscape: one-line header, more room for embeds
  // The brand font (see fonts in theme.ts); ThoughtSpot gets the same one
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  // Selected option per tab (lifted here so the Guide can open a specific one)
  const [dashboardOption, setDashboardOption] = useState<OptionKey>('liveboardWebSdk');
  const [assistantOption, setAssistantOption] = useState<OptionKey>('mcpEmbeddedCharts');
  // Tabs are mounted on first visit, then kept alive so embeds and chats keep their state.
  // The Dashboard is pre-rendered at launch (see PRERENDER_DASHBOARD in config.ts).
  const [visited, setVisited] = useState<Set<TabKey>>(
    new Set(PRERENDER_DASHBOARD ? ['guide', 'dashboard'] : ['guide']),
  );

  function show(next: TabKey) {
    setVisited((v) => new Set(v).add(next));
    setTab(next);
  }

  // Guide → open a given option in its tab
  function open(key: OptionKey) {
    const { tab: target } = OPTIONS[key];
    if (target === 'dashboard') setDashboardOption(key);
    if (target === 'assistant') setAssistantOption(key);
    show(target);
  }

  const screens: Record<TabKey, React.ReactNode> = {
    guide: <GuideScreen onOpen={open} />,
    dashboard: <DashboardScreen option={dashboardOption} onOptionChange={setDashboardOption} />,
    spotter: <SpotterScreen />,
    assistant: <AssistantScreen option={assistantOption} onOptionChange={setAssistantOption} />,
  };

  if (!fontsLoaded) return null; // fonts are bundled, so this takes a moment

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <StatusBar style="light" />
        <View style={[styles.header, isShort && styles.headerShort]}>
          <Text style={[styles.brand, isShort && styles.brandShort]}>▲ Northpeak Outfitters</Text>
          <Text style={styles.subtitle}>ThoughtSpot mobile embedding · {TABS.find((t) => t.key === tab)!.label}</Text>
        </View>

        {/* Prefetch ThoughtSpot's static files right away (options 1, 3 and 4) */}
        <PrefetchWarmup />

        <View style={styles.screens}>
          {TABS.filter((t) => visited.has(t.key)).map((t) => (
            // Hidden tabs stay laid out at full size (not display: none), so a
            // pre-rendered Liveboard keeps loading in the background.
            <View
              key={t.key}
              style={[styles.screen, t.key !== tab && styles.hidden]}
              pointerEvents={t.key === tab ? 'auto' : 'none'}
            >
              {screens[t.key]}
            </View>
          ))}
        </View>

        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity key={t.key} style={styles.tab} onPress={() => show(t.key)}>
              <Text style={[styles.tabLabel, t.key === tab && styles.tabActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.brandDark },
  header: { backgroundColor: colors.brandDark, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  brand: { color: '#fff', fontSize: 20, fontFamily: fonts.extrabold, letterSpacing: 0.3 },
  subtitle: { color: '#BFD8CF', fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  headerShort: { flexDirection: 'row', alignItems: 'baseline', gap: 12, paddingTop: 4, paddingBottom: 6 },
  brandShort: { fontFamily: fonts.regular, fontSize: 16 },
  screens: { flex: 1 },
  screen: { ...StyleSheet.absoluteFill, backgroundColor: colors.background },
  hidden: { opacity: 0, zIndex: -1 },
  tabBar: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { color: colors.muted, fontFamily: fonts.semibold },
  tabActive: { color: colors.brand },
});
