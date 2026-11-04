// The Northpeak logo: a ridge line under a rising sun, on a brand-green tile.
//
// The same shapes live in assets/brand/northpeak-icon-sprite.svg, which
// replaces Spotter's icon inside ThoughtSpot (see SpotterScreen.tsx). Change
// both together.
import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../theme';

export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="Northpeak logo">
      <Rect width={64} height={64} rx={16} fill={colors.brand} />
      <Circle cx={45} cy={19} r={6} fill={colors.accent} />
      <Path
        d="M10 46 L26 22 L35 35 L42 27 L54 46"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
