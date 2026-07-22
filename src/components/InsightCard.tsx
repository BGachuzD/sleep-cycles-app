import React, { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../hooks/usePressScale';
import { usePremium } from '../context/EntitlementsContext';
import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import type { Insight, InsightSeverity } from '../domain/sleepInsights';

function severityColor(severity: InsightSeverity, theme: AppTheme): string {
  switch (severity) {
    case 'positive':
      return theme.colors.success;
    case 'warning':
      return theme.colors.warning;
    default:
      return theme.colors.accent[400];
  }
}

/**
 * Tarjeta de un insight del motor `computeInsights`. Es la superficie visible
 * del "coach". Si el insight es `premium` y el usuario no lo tiene, la tarjeta
 * se muestra bloqueada y al tocarla presenta el paywall.
 */
export const InsightCard: FC<{
  insight: Insight;
  onCtaPress?: (screen: string) => void;
}> = ({ insight, onCtaPress }) => {
  const { theme } = useAppTheme();
  const { isPremium, presentPaywall } = usePremium();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.98);

  const locked = !!insight.premium && !isPremium;
  const color = severityColor(insight.severity, theme);
  const interactive = locked || !!insight.cta;

  const handlePress = () => {
    if (locked) {
      presentPaywall('Este análisis forma parte de Mimebien Premium.');
      return;
    }
    if (insight.cta && onCtaPress) onCtaPress(insight.cta.screen);
  };

  const iconName = (
    locked ? 'lock-closed' : insight.icon
  ) as keyof typeof Ionicons.glyphMap;

  const progressPct = insight.progress
    ? Math.min(100, (insight.progress.current / insight.progress.total) * 100)
    : 0;

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: locked
            ? `${theme.colors.accent[500]}55`
            : theme.colors.border,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}1F` }]}>
          <Ionicons name={iconName} size={16} color={color} />
        </View>
        <Text
          style={[
            styles.title,
            { color: theme.colors.textPrimary, fontSize: theme.type.body },
          ]}
          numberOfLines={2}
        >
          {insight.title}
        </Text>
        {insight.premium && (
          <View
            style={[
              styles.premiumTag,
              {
                backgroundColor: `${theme.colors.accent[500]}14`,
                borderColor: `${theme.colors.accent[500]}55`,
              },
            ]}
          >
            <Ionicons
              name="sparkles"
              size={9}
              color={theme.colors.accent[400]}
            />
          </View>
        )}
      </View>

      <Text
        style={[
          styles.body,
          { color: theme.colors.textSecondary, fontSize: theme.type.small },
        ]}
      >
        {locked
          ? 'Desbloquea este análisis personalizado con Mimebien Premium.'
          : insight.body}
      </Text>

      {insight.progress && !locked && (
        <View style={styles.progressRow}>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: theme.colors.border },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                { backgroundColor: color, width: `${progressPct}%` },
              ]}
            />
          </View>
          <Text
            style={[styles.progressLabel, { color: theme.colors.textMuted }]}
          >
            {insight.progress.current}/{insight.progress.total}
          </Text>
        </View>
      )}

      {(locked || insight.cta) && (
        <View style={styles.ctaRow}>
          <Text style={[styles.ctaText, { color: theme.colors.accent[400] }]}>
            {locked ? 'Desbloquear con Premium' : insight.cta?.label}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={theme.colors.accent[400]}
          />
        </View>
      )}
    </View>
  );

  if (!interactive) return content;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={insight.title}
      >
        {content}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 14, gap: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontWeight: '700', letterSpacing: -0.2 },
  premiumTag: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { lineHeight: 18 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ctaText: { fontSize: 13, fontWeight: '700' },
});
