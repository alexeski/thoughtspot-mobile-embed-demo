import { useWindowDimensions } from 'react-native';

// Screen-size helpers, in density-independent pixels (dp).
//   isWide   – the current width has room for two columns (tablets, or a phone in landscape).
//   isShort  – little height (landscape). The app's own header and option bar
//              shrink to one line each, so embeds get more height.
export function useLayout() {
  const { width, height } = useWindowDimensions();
  return {
    isWide: width >= 700,
    isShort: height < 700,
  };
}
