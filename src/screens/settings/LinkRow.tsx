import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../../hooks/usePressScale';
import type { AppTheme } from '../../theme/theme';

// ─────────────────────────────────────────────
// LinkRow para legal y externos
// ─────────────────────────────────────────────
export const LinkRow: FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  external?: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ icon, label, hint, external, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          linkStyles.row,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <View
          style={[
            linkStyles.iconCircle,
            { backgroundColor: `${theme.colors.accent[500]}1A` },
          ]}
        >
          <Ionicons name={icon} size={16} color={theme.colors.accent[400]} />
        </View>
        <View style={linkStyles.textCol}>
          <Text
            style={[
              linkStyles.label,
              { color: theme.colors.textPrimary, fontSize: theme.type.body },
            ]}
          >
            {label}
          </Text>
          {hint && (
            <Text
              style={[
                linkStyles.hint,
                { color: theme.colors.textMuted, fontSize: theme.type.caption },
              ]}
            >
              {hint}
            </Text>
          )}
        </View>
        <Ionicons
          name={external ? 'open-outline' : 'chevron-forward'}
          size={16}
          color={theme.colors.textMuted}
        />
      </Pressable>
    </Animated.View>
  );
};

const linkStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 2 },
  label: { fontWeight: '700' },
  hint: { fontWeight: '600' },
});
