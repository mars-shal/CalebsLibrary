// PaperCard — BookCover + 2-line title + type·▲upvotes meta.
// Port of src/components/PaperCard.vue (hover -2px → press 0.97).
// First-viewport stagger: entering fade-up, delay capped at 6 items.
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { BookCover, type CoverSize } from './BookCover';
import { formatCount, type Paper } from '@shared/design';
import { Icon } from '../icons/icons';
import { fonts } from '../theme/tokens';
import { useThemeColors } from './ThemeProvider';
import { useReducedMotion } from '../motion/motion';

export interface PaperCardProps {
  paper: Paper;
  size?: Extract<CoverSize, 'sm' | 'md'>;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Position in list — drives capped stagger delay. */
  index?: number;
}

export function PaperCard({ paper, size = 'md', onPress, style, index = 0 }: PaperCardProps) {
  const c = useThemeColors();
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View
      entering={
        reduceMotion
          ? undefined
          : FadeInUp.delay(Math.min(index, 5) * 40).duration(260)
      }
    >
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${paper.title}, ${paper.type}, ${paper.upvotes} upvotes`}
      style={[{ flexDirection: 'column', gap: 12 }, style]}
    >
      <BookCover paper={paper} size={size} />
      <View>
        <Text
          numberOfLines={2}
          style={{
            fontSize: 14.5,
            lineHeight: 19,
            fontWeight: '500',
            color: c.textPrimary,
            fontFamily: fonts.sansMedium,
            marginBottom: 4,
          }}
        >
          {paper.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 11, color: c.textTertiary, fontFamily: fonts.mono }}>
            {paper.type}
          </Text>
          <Text style={{ fontSize: 11, color: c.textTertiary, opacity: 0.4 }}>·</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Icon name="arrow-up" size={11} color={c.textTertiary} />
            <Text style={{ fontSize: 11, color: c.textTertiary, fontFamily: fonts.mono }}>
              {formatCount(paper.upvotes)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
    </Animated.View>
  );
}
