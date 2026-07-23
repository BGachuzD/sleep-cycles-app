import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { StyleSheet, View } from 'react-native';

import type { AppTheme } from '../../theme/theme';

// ─────────────────────────────────────────────
// ScoreStars
// ─────────────────────────────────────────────
export const ScoreStars: FC<{ stars: number; theme: AppTheme }> = ({
  stars,
  theme,
}) => (
  <View style={starStyles.row} accessibilityLabel={`${stars} de 5 estrellas`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Ionicons
        key={i}
        name={i <= stars ? 'star' : 'star-outline'}
        size={12}
        color={i <= stars ? theme.colors.accent[400] : theme.colors.textMuted}
      />
    ))}
  </View>
);

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});
