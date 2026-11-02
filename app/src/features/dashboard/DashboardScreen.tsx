// Dashboard tab – the same Liveboard, two ways (options 1 and 2).
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { OptionKey } from '../../options';
import { colors } from '../../theme';
import OptionPicker, { BarButton } from '../../ui/OptionPicker';
import LiveboardNativeSdk from './LiveboardNativeSdk';
import LiveboardWebSdk from './LiveboardWebSdk';
import type { LiveboardHandle } from './types';

const OPTIONS = {
  liveboardNativeSdk: LiveboardNativeSdk,
  liveboardWebSdk: LiveboardWebSdk,
} as const;
type DashboardOption = keyof typeof OPTIONS;

export default function DashboardScreen({
  option,
  onOptionChange,
}: {
  option: OptionKey;
  onOptionChange: (key: OptionKey) => void;
}) {
  // Either option exposes reload(), so one button works for both
  const refs = {
    liveboardNativeSdk: useRef<LiveboardHandle>(null),
    liveboardWebSdk: useRef<LiveboardHandle>(null),
  };

  // Keep every option alive once it has been shown, so switching back and
  // forth is instant after the first load (the Liveboard stays rendered).
  const [mounted, setMounted] = useState<Set<DashboardOption>>(new Set([option as DashboardOption]));
  useEffect(() => setMounted((m) => new Set(m).add(option as DashboardOption)), [option]);

  return (
    <View style={styles.container}>
      <OptionPicker
        tab="dashboard"
        value={option}
        onChange={onOptionChange}
        right={<BarButton label="Reload" onPress={() => refs[option as DashboardOption].current?.reload()} />}
      />
      <View style={styles.container}>
        {[...mounted].map((key) => {
          const Liveboard = OPTIONS[key];
          const visible = key === option;
          return (
            // Hidden options stay laid out at full size (not display: none),
            // so they keep rendering in the background.
            <View
              key={key}
              style={[StyleSheet.absoluteFill, !visible && styles.hidden]}
              pointerEvents={visible ? 'auto' : 'none'}
            >
              <Liveboard ref={refs[key]} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hidden: { opacity: 0 },
});
