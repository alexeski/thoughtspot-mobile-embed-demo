// ─────────────────────────────────────────────────────────────────────────────
// Option 6 – option 2, with the filter chips on one scrollable row
//
// The same React Native SDK Liveboard as option 2. On a phone, the Liveboard's
// filter chips wrap onto several rows and push the tiles down. ThoughtSpot has
// no variable or view-config option for a single row, so this option adds CSS
// rules with selectors (rules_UNSTABLE) – to this embed only, through its own
// `customizations` prop, which the SDK merges over init()'s.
//
// Unsupported by design: these selectors target ThoughtSpot's internal markup
// and can stop matching after any ThoughtSpot upgrade. Re-test on every
// release. Tested on 26.10.0.cl (see CLIENT_CSS_FINDINGS.md).
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';

import LiveboardNativeSdk from './LiveboardNativeSdk';
import type { LiveboardHandle } from './types';

// One row that scrolls sideways: the chip containers stop wrapping and scroll,
// and the chips keep their width instead of shrinking.
const ONE_ROW_CHIPS = {
  style: {
    customCSS: {
      rules_UNSTABLE: {
        '[data-testid="filter-panel-chip-container"]': { 'flex-wrap': 'nowrap !important', 'overflow-x': 'auto !important' },
        '[class*="filter-panel-module__filterPanel"]': { 'flex-wrap': 'nowrap !important', 'overflow-x': 'auto !important' },
        '[class*="filter-panel-module__droppableFilterList"]': {
          'flex-wrap': 'nowrap !important',
          'overflow-x': 'auto !important',
        },
        '[data-testid="filter-panel-chip"]': { 'flex-shrink': '0 !important' },
        ':has(> [data-testid="filter-panel-chip-container"])': { 'min-width': '0 !important', overflow: 'hidden !important' },
      },
    },
  },
};

export default function LiveboardOneRowChips({ ref }: { ref?: React.Ref<LiveboardHandle> }) {
  return <LiveboardNativeSdk ref={ref} customizations={ONE_ROW_CHIPS} />;
}
