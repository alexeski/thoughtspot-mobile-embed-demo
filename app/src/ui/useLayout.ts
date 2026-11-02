import { useWindowDimensions } from 'react-native';

// Screen-size helpers, in density-independent pixels (dp).
//   isTablet – Android's own rule: smallest side ≥ 600dp. Doesn't change on rotation.
//   isWide   – the current width has room for two columns (tablets, or a phone in landscape).
//   isShort  – little height (landscape). The app's own header and option bar
//              shrink to one line each, so embeds get the height they need –
//              Spotter's welcome screen needs about 420dp.
export function useLayout() {
  const { width, height } = useWindowDimensions();
  return {
    isTablet: Math.min(width, height) >= 600,
    isWide: width >= 700,
    isShort: height < 700,
  };
}
