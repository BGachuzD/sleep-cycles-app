import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../../hooks/usePressScale';
import type { AppTheme } from '../../theme/theme';
import { formatTime } from '../../utils/sleep';
import {
  formatRelativeDate,
  getTriggerDate,
  type NotificationRequest,
} from './helpers';

// ─────────────────────────────────────────────
// NotificationCard
// ─────────────────────────────────────────────
export const NotificationCard: FC<{
  request: NotificationRequest;
  onCancel: () => void;
  theme: AppTheme;
}> = ({ request, onCancel, theme }) => {
  const trash = usePressScale(0.85);
  const triggerDate = getTriggerDate(request.trigger);
  const timeString = triggerDate ? formatTime(triggerDate) : 'Sin hora';
  const relativeString = triggerDate
    ? formatRelativeDate(triggerDate)
    : 'sin fecha';
  const isPast = triggerDate ? triggerDate.getTime() < Date.now() : false;

  const title = request.content?.title ?? 'Recordatorio';
  const body = request.content?.body ?? 'Sin descripción';

  return (
    <View
      style={[
        cardStyles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.xl,
          padding: theme.spacing.lg,
          opacity: isPast ? 0.6 : 1,
        },
      ]}
    >
      <View style={cardStyles.row}>
        <View
          style={[
            cardStyles.iconCircle,
            { backgroundColor: `${theme.colors.accent[500]}1F` },
          ]}
        >
          <Ionicons
            name="alarm-outline"
            size={20}
            color={theme.colors.accent[400]}
          />
        </View>

        <View style={cardStyles.titleCol}>
          <Text
            style={[
              cardStyles.title,
              {
                color: theme.colors.textPrimary,
                fontSize: theme.type.bodyLarge,
              },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text
            style={[
              cardStyles.body,
              { color: theme.colors.textSecondary, fontSize: theme.type.small },
            ]}
            numberOfLines={2}
          >
            {body}
          </Text>
        </View>

        <Animated.View style={trash.animatedStyle}>
          <Pressable
            onPress={onCancel}
            onPressIn={trash.onPressIn}
            onPressOut={trash.onPressOut}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cancelar alerta"
            style={[
              cardStyles.trashBtn,
              {
                backgroundColor: `${theme.colors.danger}14`,
                borderColor: `${theme.colors.danger}33`,
              },
            ]}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={theme.colors.danger}
            />
          </Pressable>
        </Animated.View>
      </View>

      <View
        style={[
          cardStyles.timeRow,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <View style={cardStyles.timeLeft}>
          <Text
            style={[
              cardStyles.timeLabel,
              { color: theme.colors.textMuted, fontSize: theme.type.micro },
            ]}
          >
            HORA
          </Text>
          <Text
            style={[
              cardStyles.timeValue,
              { color: theme.colors.heroText, fontSize: theme.type.title3 },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {timeString}
          </Text>
        </View>
        <View
          style={[
            cardStyles.dateChip,
            {
              backgroundColor: `${theme.colors.accent[500]}1F`,
              borderColor: `${theme.colors.accent[500]}55`,
              borderRadius: 999,
            },
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={12}
            color={theme.colors.accent[400]}
          />
          <Text
            style={[
              cardStyles.dateChipText,
              { color: theme.colors.accent[300], fontSize: theme.type.caption },
            ]}
          >
            {relativeString}
          </Text>
        </View>
      </View>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: { borderWidth: 1, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleCol: { flex: 1, gap: 2 },
  title: { fontWeight: '700' },
  body: { lineHeight: 18 },
  trashBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  timeLeft: { flex: 1, gap: 2 },
  timeLabel: {
    fontWeight: '700',
    letterSpacing: 1,
  },
  timeValue: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  dateChipText: {
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'lowercase',
  },
});
