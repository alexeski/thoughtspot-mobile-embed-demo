// Dashboard tab – the same Liveboard, two ways (options 1 and 2).
import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import type { OptionKey } from '../../options';
import { colors } from '../../theme';
import OptionPicker, { BarButton } from '../../ui/OptionPicker';
import LiveboardNativeSdk from './LiveboardNativeSdk';
import LiveboardWebSdk from './LiveboardWebSdk';
import type { LiveboardHandle } from './types';

export default function DashboardScreen({
  option,
  onOptionChange,
}: {
  option: OptionKey;
  onOptionChange: (key: OptionKey) => void;
}) {
  // Either option exposes reload(), so one button works for both
  const liveboard = useRef<LiveboardHandle>(null);

  return (
    <View style={styles.container}>
      <OptionPicker
        tab="dashboard"
        value={option}
        onChange={onOptionChange}
        right={<BarButton label="Reload" onPress={() => liveboard.current?.reload()} />}
      />
      {/* Only the selected option is mounted, so switching shows a fresh load */}
      {option === 'liveboardWebSdk' ? <LiveboardWebSdk ref={liveboard} /> : <LiveboardNativeSdk ref={liveboard} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
