// ─────────────────────────────────────────────────────────────────────────────
// Option 3 – option 2, with filters made for phones
//
// The same React Native SDK Liveboard as option 2, with two changes to how
// its filters behave on a small screen:
//
// 1. The filter chips sit on one row that scrolls sideways, instead of
//    wrapping onto several rows and pushing the tiles down. ThoughtSpot has no
//    variable or view-config option for this, so it takes CSS rules with
//    selectors (rules_UNSTABLE) – on this embed only, through its own
//    `customizations` prop, which the SDK merges over init()'s.
//    Unsupported by design: the selectors target ThoughtSpot's internal markup
//    and can stop matching after any upgrade. Re-test on every release.
//
// 2. Tapping a chip opens that filter only, as in option 1, instead of the
//    "Apply filters and parameters" dialog that lists every filter. This one
//    is a setting, isCentralizedLiveboardFilterUXEnabled: false. The web SDK
//    (1.46+) sends it by default, but the React Native SDK 1.0 runs the embed
//    in a shell page with web SDK 1.41, which predates the setting and drops
//    it, so ThoughtSpot uses the instance default (dialog on). We pass it
//    through additionalFlags instead, which the old shell does forward.
//
// Tested on 26.10.0.cl (see CLIENT_CSS_FINDINGS.md).
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';

import LiveboardNativeSdk from './LiveboardNativeSdk';
import type { LiveboardHandle } from './types';

// ① One row that scrolls sideways: the chip containers stop wrapping and
//   scroll, and the chips keep their width instead of shrinking.
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

export default function LiveboardMobileFilters({ ref }: { ref?: React.Ref<LiveboardHandle> }) {
  return (
    <LiveboardNativeSdk
      ref={ref}
      customizations={ONE_ROW_CHIPS}
      centralizedFilters={false} // ② one filter per dialog
    />
  );
}
