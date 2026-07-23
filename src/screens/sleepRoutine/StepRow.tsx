import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { type RoutineStep } from '../../domain/sleepRoutine';
import { usePressScale } from '../../hooks/usePressScale';
import type { AppTheme } from '../../theme/theme';
import { formatTime } from '../../utils/sleep';

// ─────────────────────────────────────────────
// StepRow (uno por paso del timeline)
// ─────────────────────────────────────────────
export const StepRow: FC<{
  step: RoutineStep;
  time: Date;
  isScheduled: boolean;
  isPast: boolean;
  isLast: boolean;
  editMode: boolean;
  onToggle: () => void;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  theme: AppTheme;
}> = ({
  step,
  time,
  isScheduled,
  isPast,
  isLast,
  editMode,
  onToggle,
  onPress,
  onEdit,
  onDelete,
  theme,
}) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.98);

  return (
    <View style={rowStyles.row}>
      {/* Timeline visual */}
      {!editMode && (
        <View style={rowStyles.timelineCol}>
          <View style={[rowStyles.dot, { backgroundColor: step.color }]} />
          {!isLast && (
            <View
              style={[rowStyles.line, { backgroundColor: `${step.color}40` }]}
            />
          )}
        </View>
      )}

      <Animated.View style={[rowStyles.cardWrapper, animatedStyle]}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={[
            rowStyles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: isScheduled
                ? theme.colors.accent[500]
                : theme.colors.border,
              borderWidth: isScheduled ? 1.5 : 1,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
              opacity:
                !step.enabled && editMode
                  ? 0.55
                  : isPast && !editMode
                    ? 0.55
                    : 1,
              marginLeft: editMode ? 0 : 10,
            },
          ]}
        >
          <View style={rowStyles.top}>
            {editMode && (
              <Switch
                value={step.enabled}
                onValueChange={onToggle}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.accent[500],
                }}
                thumbColor={theme.colors.white}
                style={{
                  marginRight: 8,
                  transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
                }}
              />
            )}

            <View
              style={[
                rowStyles.iconCircle,
                { backgroundColor: `${step.color}24` },
              ]}
            >
              <Ionicons name={step.icon} size={18} color={step.color} />
            </View>

            <View style={rowStyles.textCol}>
              {!editMode && (
                <Text
                  style={[
                    rowStyles.timeText,
                    {
                      color: theme.colors.textMuted,
                      fontSize: theme.type.micro,
                    },
                  ]}
                >
                  {formatTime(time)}
                </Text>
              )}
              <Text
                style={[
                  rowStyles.titleText,
                  {
                    color: !step.enabled
                      ? theme.colors.textMuted
                      : theme.colors.textPrimary,
                    fontSize: theme.type.bodyLarge,
                  },
                ]}
              >
                {step.title}
              </Text>
            </View>

            {editMode ? (
              <View style={rowStyles.editActions}>
                <Pressable hitSlop={8} onPress={onEdit}>
                  <Ionicons
                    name="pencil-outline"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
                {!step.isDefault && (
                  <Pressable hitSlop={8} onPress={onDelete}>
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={theme.colors.danger}
                    />
                  </Pressable>
                )}
              </View>
            ) : isScheduled ? (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.colors.accent[400]}
              />
            ) : (
              <Ionicons
                name="alarm-outline"
                size={18}
                color={theme.colors.textMuted}
              />
            )}
          </View>

          {!editMode ? (
            <>
              <Text
                style={[
                  rowStyles.descText,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.type.small,
                  },
                ]}
              >
                {step.description}
              </Text>
              {step.minutesBefore === 0 && (
                <View
                  style={[
                    rowStyles.bedtimeBadge,
                    {
                      backgroundColor: `${theme.colors.accent[500]}1F`,
                      borderColor: `${theme.colors.accent[500]}55`,
                    },
                  ]}
                >
                  <Ionicons
                    name="star"
                    size={10}
                    color={theme.colors.accent[300]}
                  />
                  <Text
                    style={[
                      rowStyles.bedtimeBadgeText,
                      { color: theme.colors.accent[300] },
                    ]}
                  >
                    Hora óptima
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Text
              style={[
                rowStyles.descText,
                {
                  color: theme.colors.textMuted,
                  fontSize: theme.type.small,
                  marginTop: 4,
                },
              ]}
            >
              {step.minutesBefore === 0
                ? 'Al acostarse'
                : `${step.minutesBefore} min antes`}
              {step.isDefault ? '' : ' · personalizado'}
            </Text>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
};

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 10 },
  timelineCol: {
    width: 24,
    alignItems: 'center',
    paddingTop: 18,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  line: { width: 2, flex: 1, marginTop: 4 },
  cardWrapper: { flex: 1 },
  card: { borderStyle: 'solid' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textCol: { flex: 1 },
  timeText: {
    fontWeight: '700',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  titleText: { fontWeight: '700' },
  descText: { lineHeight: 18, marginTop: 8 },
  editActions: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  bedtimeBadge: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bedtimeBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
});
