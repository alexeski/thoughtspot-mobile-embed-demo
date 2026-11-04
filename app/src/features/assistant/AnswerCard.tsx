// Shows one Spotter answer, using whichever option is selected in the Assistant tab:
//   option 5 → EmbeddedAnswer: Spotter's own interactive chart
//   option 6 → NativeAnswer:   the answer's rows, drawn with React Native views
import React from 'react';

import type { OptionKey } from '../../options';
import EmbeddedAnswer from './EmbeddedAnswer';
import NativeAnswer from './NativeAnswer';
import type { SpotterAnswer } from './types';

export default function AnswerCard({ answer, option }: { answer: SpotterAnswer; option: OptionKey }) {
  return option === 'mcpNativeCharts' ? <NativeAnswer answer={answer} /> : <EmbeddedAnswer answer={answer} />;
}
