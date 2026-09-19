// AmbientGrain — paper-grain whisper (port of .book-cover::after 3px radial).
// Non-functional decor, alpha 0.04, pointer-transparent, motion-independent.
// Screens opt in sparingly (Home hero); never over scrolling lists.
import { View } from 'react-native';

export function AmbientGrain() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#23201c',
        opacity: 0.04,
        pointerEvents: 'none',
      }}
    />
  );
}
