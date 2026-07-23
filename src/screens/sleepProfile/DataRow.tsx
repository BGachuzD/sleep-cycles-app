import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppTheme } from '../../theme/theme';

// ─────────────────────────────────────────────
// DataRow para cards de info
// ─────────────────────────────────────────────
export const DataRow: FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  theme: AppTheme;
  last?: boolean;
}> = ({ icon, label, value, theme, last }) => (
  <View
    style={[
      dataRowStyles.row,
      !last && {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
      },
    ]}
  >
    <View style={dataRowStyles.left}>
      <Ionicons name={icon} size={16} color={theme.colors.textMuted} />
      <Text
        style={[
          dataRowStyles.label,
          { color: theme.colors.textSecondary, fontSize: theme.type.body },
        ]}
      >
        {label}
      </Text>
    </View>
    <Text
      style={[
        dataRowStyles.value,
        { color: theme.colors.textPrimary, fontSize: theme.type.body },
      ]}
    >
      {value}
    </Text>
  </View>
);

const dataRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  label: { fontWeight: '500' },
  value: { fontWeight: '700', fontVariant: ['tabular-nums'] },
});
