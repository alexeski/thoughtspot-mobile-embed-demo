// ─────────────────────────────────────────────────────────────────────────────
// Option 5 – Spotter MCP answer, drawn with native React Native views
//
// As soon as an `answer` update arrives, we fetch that exact answer's rows
// (the backend exports it by session_id + gen_no, see server/thoughtspot.js)
// and pick a native visual from the shape of the data – the MCP response
// doesn't say which chart type Spotter chose:
//   1 row of numbers            → KPI tile
//   time attribute + 1 measure  → column chart, in time order
//   attribute + 1 measure       → ranked horizontal bars
//   anything else               → table
//
// No WebView at all: your design system, your fonts, very light.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { backend } from '../../backend';
import { colors } from '../../theme';
import type { SpotterAnswer } from './types';

type Cell = string | number;
type AnswerData = { columns: string[]; rows: Cell[][]; filters: string[] };
type Visual = 'kpi' | 'columns' | 'bars' | 'table';

const TIME_COLUMN = /date|day|week|month|quarter|year/i;

function chooseVisual({ columns, rows }: AnswerData): { visual: Visual; label: number; value: number } {
  const isNumeric = (c: number) => rows.length > 0 && rows.every((r) => typeof r[c] === 'number');
  const measures = columns.map((_, c) => c).filter(isNumeric);
  const attributes = columns.map((_, c) => c).filter((c) => !isNumeric(c));

  if (rows.length === 1 && attributes.length === 0) return { visual: 'kpi', label: -1, value: measures[0] };
  if (attributes.length === 1 && measures.length === 1 && rows.length > 1) {
    const [label, value] = [attributes[0], measures[0]];
    return { visual: TIME_COLUMN.test(columns[label]) ? 'columns' : 'bars', label, value };
  }
  return { visual: 'table', label: -1, value: -1 };
}

// The export doesn't guarantee row order, so time series are put back in
// chronological order. Handles ThoughtSpot's period labels: "Jan 2026",
// "Q1 2026", "2026" and plain dates. Unknown formats keep their order.
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function periodKey(label: Cell): number | null {
  const s = String(label).trim().toLowerCase();
  let m = s.match(/^([a-z]{3})[a-z]* (\d{4})$/);
  if (m && MONTHS.includes(m[1])) return Number(m[2]) * 12 + MONTHS.indexOf(m[1]);
  m = s.match(/^q([1-4]) (\d{4})$/);
  if (m) return Number(m[2]) * 12 + (Number(m[1]) - 1) * 3;
  if (/^\d{4}$/.test(s)) return Number(s) * 12;
  const t = Date.parse(String(label));
  return Number.isNaN(t) ? null : t;
}

function chronological(rows: Cell[][], col: number) {
  const keys = rows.map((r) => periodKey(r[col]));
  if (keys.some((k) => k === null)) return rows;
  return rows.map((r, i) => ({ r, k: keys[i]! })).sort((a, b) => a.k - b.k).map(({ r }) => r);
}

// 335890000 → "335.9M"
function compact(v: Cell) {
  if (typeof v !== 'number') return String(v);
  const abs = Math.abs(v);
  for (const [n, s] of [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']] as const) {
    if (abs >= n) return `${(v / n).toFixed(1).replace(/\.0$/, '')}${s}`;
  }
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function NativeAnswer({ answer }: { answer: SpotterAnswer }) {
  const [data, setData] = useState<AnswerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    backend<AnswerData>('/api/answer-data', {
      method: 'POST',
      body: JSON.stringify({ answerId: answer.answer_id }),
    })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [answer.answer_id]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{answer.answer_title}</Text>
      {data?.filters.map((f) => (
        <Text key={f} style={styles.filter}>Filter · {f}</Text>
      ))}
      {!data && !error && <ActivityIndicator color={colors.brand} style={{ marginVertical: 12 }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {data && <Visualization data={data} />}
    </View>
  );
}

function Visualization({ data }: { data: AnswerData }) {
  const { visual, label, value } = chooseVisual(data);
  const { columns } = data;
  let { rows } = data;

  if (visual === 'kpi') {
    return (
      <View style={styles.kpi}>
        <Text style={styles.kpiValue}>{compact(rows[0][value])}</Text>
        <Text style={styles.kpiLabel}>{columns[value]}</Text>
      </View>
    );
  }

  if (visual === 'columns') {
    rows = chronological(rows, label);
    const max = Math.max(...rows.map((r) => Number(r[value])));
    return (
      <View>
        <Text style={styles.axis}>{columns[value]} · max {compact(max)}</Text>
        <View style={styles.columns}>
          {rows.map((r, i) => (
            <View key={i} style={styles.columnSlot}>
              <View style={[styles.column, { height: `${(Number(r[value]) / max) * 100}%` }]} />
            </View>
          ))}
        </View>
        {/* first and last period only – phone screens are too narrow for every tick */}
        <View style={styles.ticks}>
          <Text style={styles.tick}>{String(rows[0][label])}</Text>
          <Text style={styles.tick}>{String(rows[rows.length - 1][label])}</Text>
        </View>
      </View>
    );
  }

  if (visual === 'bars') {
    const sorted = [...rows].sort((a, b) => Number(b[value]) - Number(a[value])).slice(0, 12);
    const max = Number(sorted[0][value]);
    return (
      <View style={{ gap: 6 }}>
        {sorted.map((r, i) => (
          <View key={i} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>{String(r[label])}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { width: `${(Number(r[value]) / max) * 100}%` }]} />
            </View>
            <Text style={styles.barValue}>{compact(r[value])}</Text>
          </View>
        ))}
      </View>
    );
  }

  // Table: biggest values first when the last column is a measure
  const last = columns.length - 1;
  if (rows.every((r) => typeof r[last] === 'number')) {
    rows = [...rows].sort((a, b) => Number(b[last]) - Number(a[last]));
  }
  return (
    <View>
      <View style={styles.tr}>
        {columns.map((c) => <Text key={c} style={[styles.td, styles.th]} numberOfLines={1}>{c}</Text>)}
      </View>
      {rows.slice(0, 12).map((r, i) => (
        <View key={i} style={styles.tr}>
          {r.map((v, j) => <Text key={j} style={styles.td} numberOfLines={1}>{compact(v)}</Text>)}
        </View>
      ))}
      {rows.length > 12 && <Text style={styles.axis}>Showing 12 of {rows.length} rows</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
  },
  title: { fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  filter: { fontSize: 11, color: colors.muted },
  error: { color: '#B3261E', fontSize: 12 },

  kpi: { alignItems: 'center', paddingVertical: 8 },
  kpiValue: { fontSize: 34, fontWeight: '800', color: colors.brand },
  kpiLabel: { fontSize: 12, color: colors.muted },

  axis: { fontSize: 11, color: colors.muted, marginBottom: 4 },
  columns: { height: 120, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  columnSlot: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  column: { backgroundColor: colors.brand, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  ticks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  tick: { fontSize: 10, color: colors.muted },

  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 90, fontSize: 12, color: colors.text },
  barTrack: { flex: 1, height: 14, backgroundColor: colors.background, borderRadius: 4, overflow: 'hidden' },
  bar: { height: '100%', backgroundColor: colors.brand, borderRadius: 4 },
  barValue: { width: 56, fontSize: 12, textAlign: 'right', color: colors.text, fontVariant: ['tabular-nums'] },

  tr: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  td: { flex: 1, fontSize: 12, paddingVertical: 4, color: colors.text },
  th: { fontWeight: '700' },
});
