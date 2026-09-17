// HighlightText — <mark>-style query highlighting (inverted ink pill).
// Port of SearchView segments() + mark CSS (light + dark invert handled by
// theme: ink100 bg, paper text in both modes).
import { Text } from 'react-native';
import { highlightSegments } from '@shared/search';
import { fonts } from '../theme/tokens';
import { useThemeColors } from './ThemeProvider';

export function HighlightText({
  text,
  query,
  fontSize = 17,
}: {
  text: string;
  query: string;
  fontSize?: number;
}) {
  const c = useThemeColors();
  const segs = highlightSegments(text, query);
  return (
    <Text style={{ fontSize, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
      {segs.map((s, i) =>
        s.hit ? (
          <Text key={i} style={{ backgroundColor: c.ink100, color: c.paper }}>
            {s.text}
          </Text>
        ) : (
          <Text key={i}>{s.text}</Text>
        ),
      )}
    </Text>
  );
}
