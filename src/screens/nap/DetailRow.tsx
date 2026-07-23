import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppTheme } from '../../theme/theme';

// ─────────────────────────────────────────────
// DetailRow para el sheet
// ─────────────────────────────────────────────
export const DetailRow: FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  theme: AppTheme;
}> = ({ icon, label, value, theme }) => (
  <View style={detailStyles.row}>
    <Ionicons name={icon} size={16} color={theme.colors.textMuted} />
    <Text
      style={[
        detailStyles.label,
        { color: theme.colors.textSecondary, fontSize: theme.type.body },
      ]}
    >
      {label}
    </Text>
    <Text
      style={[
        detailStyles.value,
        { color: theme.colors.textPrimary, fontSize: theme.type.body },
      ]}
    >
      {value}
    </Text>
  </View>
);

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  label: { flex: 1, fontWeight: '500' },
  value: { fontWeight: '700', fontVariant: ['tabular-nums'] },
});
