import { Ionicons } from '@expo/vector-icons';
import React, { FC, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useSleepGoalsContext } from '../context/SleepGoalsContext';
import { useSleepLogContext } from '../context/SleepLogContext';
import {
  computeGoalProgress,
  formatGoalTarget,
  GOAL_DURATION_PRESETS,
} from '../domain/sleepGoal';
import { usePressScale } from '../hooks/usePressScale';
import type { AppTheme } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeProvider';

const PresetChip: FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ label, active, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.94);
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`Meta ${label}`}
        style={[
          styles.presetChip,
          {
            backgroundColor: active
              ? `${theme.colors.accent[500]}1F`
              : theme.colors.surfaceElevated,
            borderColor: active
              ? theme.colors.accent[500]
              : theme.colors.border,
            borderWidth: active ? 1.5 : 1,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <Text
          style={[
            styles.presetText,
            {
              color: active
                ? theme.colors.accent[300]
                : theme.colors.textSecondary,
            },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

/**
 * Tarjeta "Tu meta": el usuario fija una duración objetivo de sueño y la app
 * muestra su adherencia de la semana. Superficie de las metas (Sprint 3).
 */
export const GoalCard: FC = () => {
  const { theme } = useAppTheme();
  const { goals, saveGoal } = useSleepGoalsContext();
  const { entries } = useSleepLogContext();

  const goal = goals.find((g) => g.type === 'duration') ?? null;
  const [editing, setEditing] = useState(false);
  const showPicker = editing || !goal;

  const progress = goal ? computeGoalProgress(goal, entries) : null;

  const pick = (targetMinutes: number) => {
    saveGoal('duration', targetMinutes);
    setEditing(false);
  };

  const todayLine =
    progress?.metToday === true
      ? ' Hoy ya la cumpliste.'
      : progress?.metToday === false
        ? ' Hoy aún no la cumples.'
        : '';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.xl,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${theme.colors.accent[500]}1F` },
          ]}
        >
          <Ionicons name="flag" size={16} color={theme.colors.accent[400]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>
            TU META
          </Text>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {goal
              ? `Dormir ${formatGoalTarget(goal.targetMinutes)} por noche`
              : 'Define tu meta de sueño'}
          </Text>
        </View>
        {goal && !editing && (
          <Pressable
            hitSlop={8}
            onPress={() => setEditing(true)}
            accessibilityRole="button"
            accessibilityLabel="Cambiar meta"
          >
            <Ionicons
              name="pencil-outline"
              size={16}
              color={theme.colors.textMuted}
            />
          </Pressable>
        )}
      </View>

      {showPicker ? (
        <>
          <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
            Elige cuántas horas quieres dormir por noche.
          </Text>
          <View style={styles.presetRow}>
            {GOAL_DURATION_PRESETS.map((min) => (
              <PresetChip
                key={min}
                label={formatGoalTarget(min)}
                active={goal?.targetMinutes === min}
                onPress={() => pick(min)}
                theme={theme}
              />
            ))}
          </View>
        </>
      ) : (
        progress && (
          <>
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
                    {
                      backgroundColor: theme.colors.accent[500],
                      width: `${progress.adherencePct}%`,
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.progressPct, { color: theme.colors.heroText }]}
              >
                {progress.adherencePct}%
              </Text>
            </View>
            <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
              {progress.totalNights > 0
                ? `Cumpliste tu meta ${progress.metNights} de ${progress.totalNights} noches esta semana.`
                : 'Registra tus noches para ver tu adherencia.'}
              {todayLine}
            </Text>
          </>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  title: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2, marginTop: 2 },
  hint: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  presetRow: { flexDirection: 'row', gap: 8 },
  presetChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPct: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
