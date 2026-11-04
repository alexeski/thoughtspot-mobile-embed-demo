import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

// Spotter narrates in Markdown. This tiny renderer covers what it uses most
// (headings, bullets, **bold**). Swap in a library for anything richer.
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <Text key={i} style={styles.bold}>{p.slice(2, -2)}</Text>
        ) : (
          p
        ),
      )}
    </>
  );
}

export default function Markdown({ text }: { text: string }) {
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  return (
    <View style={{ gap: 4 }}>
      {lines.map((line, i) => {
        const heading = line.match(/^#{1,6}\s+(.*)/);
        if (heading) return <Text key={i} style={styles.heading}><Inline text={heading[1]} /></Text>;
        const bullet = line.match(/^\s*[-*]\s+(.*)/);
        if (bullet) return <Text key={i} style={styles.body}>{'•  '}<Inline text={bullet[1]} /></Text>;
        return <Text key={i} style={styles.body}><Inline text={line} /></Text>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.text, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bold: { fontFamily: fonts.bold },
  heading: { color: colors.text, fontSize: 15, fontFamily: fonts.bold, marginTop: 6 },
});
