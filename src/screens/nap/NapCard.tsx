import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../../hooks/usePressScale';
import type { AppTheme } from '../../theme/theme';
import { formatTime } from '../../utils/sleep';
import { type NapOption, resolveColor } from './napOptions';

// ─────────────────────────────────────────────
// NapCard: opción en la lista
// ─────────────────────────────────────────────
export const NapCard: FC<{
  option: NapOption;
  now: Date;
  scheduledWake?: string;
  onPress: () => void;
  theme: AppTheme;
}> = ({ option, now, scheduledWake, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();
  const color = resolveColor(theme, option.colorKey);
  const wakeEta = new Date(now.getTime() + option.durationMinutes * 60_000);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`Programar ${option.label} de ${option.durationMinutes} minutos`}
        style={[
          cardStyles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: scheduledWake
              ? theme.colors.accent[500]
              : option.highlight
                ? `${color}88`
                : theme.colors.border,
            borderWidth: scheduledWake || option.highlight ? 1.5 : 1,
            borderRadius: theme.radius.xl,
            padding: theme.spacing.lg,
          },
        ]}
      >
        <View
          style={[cardStyles.iconCircle, { backgroundColor: `${color}1F` }]}
        >
          <Ionicons name={option.icon} size={22} color={color} />
        </View>

        <View style={cardStyles.body}>
          <View style={cardStyles.titleRow}>
            <Text
              style={[
                cardStyles.label,
                {
                  color: theme.colors.textPrimary,
                  fontSize: theme.type.bodyLarge,
                },
              ]}
            >
              {option.label}
            </Text>
            <View
              style={[
                cardStyles.durationBadge,
                {
                  backgroundColor: `${color}1F`,
                  borderColor: `${color}55`,
                  borderRadius: 999,
                },
              ]}
            >
              <Text
                style={[
                  cardStyles.durationText,
                  { color, fontSize: theme.type.caption },
                ]}
              >
                {option.durationMinutes} min
              </Text>
            </View>
          </View>

          <Text
            style={[
              cardStyles.desc,
              { color: theme.colors.textSecondary, fontSize: theme.type.small },
            ]}
          >
            {option.shortDesc}
          </Text>

          {scheduledWake ? (
            <View
              style={[
                cardStyles.scheduledRow,
                {
                  backgroundColor: `${theme.colors.accent[500]}1F`,
                  borderColor: `${theme.colors.accent[500]}55`,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={theme.colors.accent[400]}
              />
              <Text
                style={[
                  cardStyles.scheduledText,
                  {
                    color: theme.colors.accent[300],
                    fontSize: theme.type.caption,
                  },
                ]}
              >
                Alarma activa para las {scheduledWake}
              </Text>
            </View>
          ) : (
            <Text
              style={[
                cardStyles.eta,
                { color: theme.colors.textMuted, fontSize: theme.type.caption },
              ]}
            >
              Despertarías a las {formatTime(wakeEta)}
            </Text>
          )}
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.textMuted}
        />
      </Pressable>
    </Animated.View>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: { fontWeight: '700', flex: 1 },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  durationText: {
    fontWeight: '700',
    letterSpacing: 0.3,
    fontVariant: ['tabular-nums'],
  },
  desc: { lineHeight: 17 },
  eta: { fontWeight: '600', marginTop: 2 },
  scheduledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  scheduledText: { fontWeight: '700' },
});
