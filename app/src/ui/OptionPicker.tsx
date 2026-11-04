import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { OPTIONS, Option, OptionKey, optionsForTab } from '../options';
import { colors, fonts } from '../theme';
import { useLayout } from './useLayout';

// The bar at the top of each screen: a toggle between the options that solve
// the same problem, plus a caption saying which technique is on screen and
// which file implements it – handy when presenting. On short screens
// (landscape) the caption moves onto the toggle's line to save height.
export default function OptionPicker({
  tab,
  value,
  onChange,
  right,
}: {
  tab: Option['tab'];
  value: OptionKey;
  onChange?: (key: OptionKey) => void;
  right?: React.ReactNode; // e.g. a Reload or New chat button
}) {
  const keys = optionsForTab(tab);
  const current = OPTIONS[value];
  const { isShort } = useLayout();
  const caption = (
    <View style={isShort && styles.inlineCaption}>
      <Text style={styles.how} numberOfLines={isShort ? 1 : 2}>{current.how}</Text>
      <Text style={styles.file} numberOfLines={1}>{current.file}</Text>
    </View>
  );

  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        {keys.length > 1 ? (
          <View style={styles.toggle}>
            {keys.map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.option, key === value && styles.optionActive]}
                onPress={() => onChange?.(key)}
              >
                <Text style={[styles.optionText, key === value && styles.optionTextActive]}>
                  {OPTIONS[key].number}. {OPTIONS[key].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.single}>{current.number}. {current.label}</Text>
        )}
        {isShort && caption}
        {right}
      </View>
      {!isShort && caption}
    </View>
  );
}

// A text button for the `right` slot.
export function BarButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <Text style={[styles.button, disabled && { opacity: 0.4 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 2,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 12 },
  inlineCaption: { flex: 1 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
  },
  option: { paddingVertical: 5, paddingHorizontal: 8, borderRadius: 14 },
  optionActive: { backgroundColor: colors.brand },
  optionText: { fontSize: 12, color: colors.muted, fontFamily: fonts.semibold },
  optionTextActive: { color: '#fff' },
  single: { fontSize: 13, color: colors.brand, fontFamily: fonts.bold },
  how: { fontFamily: fonts.regular, fontSize: 11, color: colors.text },
  file: { fontSize: 10, color: colors.muted, fontFamily: 'monospace' },
  button: { color: colors.brand, fontFamily: fonts.semibold },
});
