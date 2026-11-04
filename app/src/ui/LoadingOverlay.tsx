import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

// Native spinner shown over an embed until it reports that it has loaded
// (driven by ThoughtSpot embed events), or the error it reported.
export default function LoadingOverlay({ loading, error, label }: { loading: boolean; error: string | null; label: string }) {
  if (error) return <Text style={styles.error}>Embed error: {error}</Text>;
  if (!loading) return null;
  return (
    <View style={styles.overlay} pointerEvents="none">
      <ActivityIndicator size="large" color={colors.brand} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 12 },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13 },
  error: { position: 'absolute', top: 0, left: 0, right: 0, fontFamily: fonts.regular, color: '#B3261E', backgroundColor: '#FDECEA', padding: 12 },
});
