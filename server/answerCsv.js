// Turns ThoughtSpot's answer CSV export into { columns, rows, filters } (option 5).
//
// The export starts with a small preamble before the table:
//   "Data extract produced by ..."
//   "Filters applied on data :"
//   "date :  Last 12 Months (...)"
//   ""
//   "Monthly date","Total sales"      ← header
//   "Jan 2026","1.30745312E7"         ← rows (numbers arrive as strings)

export function parseAnswerCsv(csv) {
  const lines = csv.trim().split(/\r?\n/).map(parseCsvLine);
  const blank = lines.findIndex((l) => l.length === 1 && l[0] === '');
  const preamble = blank >= 0 ? lines.slice(0, blank) : [];
  const [columns, ...rows] = blank >= 0 ? lines.slice(blank + 1) : lines;
  const filtersAt = preamble.findIndex((l) => l[0].startsWith('Filters applied'));
  return {
    columns,
    rows: rows.slice(0, 500).map((r) => r.map((v) => (v !== '' && Number.isFinite(Number(v)) ? Number(v) : v))),
    filters: filtersAt >= 0 ? preamble.slice(filtersAt + 1).map((l) => l[0].replace(/\s+/g, ' ').trim()) : [],
  };
}

// Splits one CSV line, honouring quotes and "" escapes.
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted && c === '"' && line[i + 1] === '"') (cur += '"'), i++;
    else if (c === '"') quoted = !quoted;
    else if (c === ',' && !quoted) out.push(cur), (cur = '');
    else cur += c;
  }
  out.push(cur);
  return out;
}
