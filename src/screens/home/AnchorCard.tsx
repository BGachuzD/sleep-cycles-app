import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../../hooks/usePressScale';
import type { AppTheme } from '../../theme/theme';

// ─────────────────────────────────────────────
// AnchorCard reutilizable
// ─────────────────────────────────────────────
export const AnchorCard: FC<{
  theme: AppTheme;
  eyebrow: string;
  headline: string;
  subline: string;
  cta: string;
  onPress: () => void;
}> = ({ theme, eyebrow, headline, subline, cta, onPress }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          anchorStyles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.xl,
            padding: theme.spacing.xl,
          },
        ]}
      >
        <Text
          style={[
            anchorStyles.eyebrow,
            { color: theme.colors.textMuted, fontSize: theme.type.micro },
          ]}
        >
          {eyebrow.toUpperCase()}
        </Text>
        <Text
          style={[
            anchorStyles.headline,
            { color: theme.colors.textPrimary, fontSize: theme.type.title1 },
          ]}
        >
          {headline}
        </Text>
        <Text
          style={[
            anchorStyles.subline,
            { color: theme.colors.textSecondary, fontSize: theme.type.body },
          ]}
        >
          {subline}
        </Text>
        <View style={anchorStyles.ctaRow}>
          <Text
            style={[
              anchorStyles.ctaText,
              { color: theme.colors.accent[400], fontSize: theme.type.small },
            ]}
          >
            {cta}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.colors.accent[400]}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const anchorStyles = StyleSheet.create({
  card: { borderWidth: 1, gap: 6 },
  eyebrow: { fontWeight: '700', letterSpacing: 1 },
  headline: { fontWeight: '700', marginTop: 4 },
  subline: { marginTop: 2 },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  ctaText: { fontWeight: '700' },
});
