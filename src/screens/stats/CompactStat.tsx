import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppTheme } from '../../theme/theme';

// ─────────────────────────────────────────────
// CompactStat: pill horizontal con icono+valor+label
// ─────────────────────────────────────────────
export const CompactStat: FC<{
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  highlight?: boolean;
  theme: AppTheme;
}> = ({ icon, value, label, highlight, theme }) => (
  <View
    style={[
      compactStyles.card,
      {
        backgroundColor: highlight
          ? `${theme.colors.accent[500]}0D`
          : theme.colors.surfaceElevated,
        borderRadius: theme.radius.lg,
      },
    ]}
  >
    <Ionicons
      name={icon}
      size={16}
      color={highlight ? theme.colors.accent[400] : theme.colors.textMuted}
    />
    <Text
      style={[
        compactStyles.value,
        { color: theme.colors.textPrimary, fontSize: theme.type.subhead },
      ]}
    >
      {value}
    </Text>
    <Text
      style={[
        compactStyles.label,
        { color: theme.colors.textMuted, fontSize: theme.type.caption },
      ]}
    >
      {label}
    </Text>
  </View>
);

const compactStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 4,
  },
  value: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
