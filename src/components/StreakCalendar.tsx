import React, {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { useSleepGoalsContext } from '../context/SleepGoalsContext';
import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import {
  computeCompleteCycles,
  computeSleepMinutes,
  localDateString,
  type SleepLogEntry,
} from '../domain/sleepLog';
import { formatDuration, formatTime } from '../utils/sleep';
import {
  AppBottomSheetModal,
  Badge,
  CircularIconButton,
  RoundedCard,
} from './ui';

type Status = 'none' | 'under' | 'met';

type CalendarCell = {
  key: string;
  status: Status;
  dayNum: number;
  entry?: SleepLogEntry;
};

const LegendItem: FC<{ color: string; label: string; theme: AppTheme }> = ({
  color,
  label,
  theme,
}) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={[styles.legendText, { color: theme.colors.textMuted }]}>
      {label}
    </Text>
  </View>
);

function feelingLabel(feeling: SleepLogEntry['feeling']): string {
  if (feeling === 3) return 'Excelente';
  if (feeling === 2) return 'Regular';
  return 'Cansado';
}

function detailCopy(entry: SleepLogEntry, targetMinutes: number) {
  const minutes = computeSleepMinutes(entry);
  const delta = minutes - targetMinutes;
  const met = delta >= 0;

  if (met && entry.feeling === 3) {
    return {
      title: 'Objetivo cumplido con buen descanso',
      reason:
        delta === 0
          ? 'Alcanzaste exactamente tu objetivo y marcaste una sensación excelente al despertar.'
          : `Dormiste ${formatDuration(delta)} por encima de tu objetivo y marcaste una sensación excelente al despertar.`,
      advice:
        'La duración y tu percepción coinciden. Intenta repetir horarios parecidos para reforzar esta constancia.',
    };
  }
  if (met) {
    return {
      title: 'Cumpliste la duración',
      reason:
        delta === 0
          ? 'Alcanzaste exactamente tu objetivo, aunque tu sensación al despertar todavía puede mejorar.'
          : `Superaste tu objetivo por ${formatDuration(delta)}, aunque tu sensación al despertar todavía puede mejorar.`,
      advice:
        'Prueba mantener una hora estable, reducir luz y pantallas antes de dormir y observar si tu sensación mejora.',
    };
  }

  const deficit = Math.abs(delta);
  return {
    title: 'La duración quedó corta',
    reason: `Te faltaron ${formatDuration(deficit)} para alcanzar tu objetivo de ${formatDuration(targetMinutes)}.`,
    advice:
      deficit <= 30
        ? 'Estás cerca. Adelantar 15–30 minutos la hora de acostarte puede ser suficiente para alcanzar la meta.'
        : 'Ajusta la hora de acostarte gradualmente, en bloques de 15–20 minutos, para evitar un cambio difícil de sostener.',
  };
}

/** Calendario interactivo: sólo las noches con datos abren un detalle. */
export const StreakCalendar: FC<{
  entries: SleepLogEntry[];
  cycleMins: number;
  weeks?: number;
}> = ({ entries, cycleMins, weeks = 5 }) => {
  const { theme } = useAppTheme();
  const { goals } = useSleepGoalsContext();
  const [selectedEntry, setSelectedEntry] = useState<SleepLogEntry | null>(
    null,
  );
  const sheetRef = useRef<BottomSheetModal>(null);
  const configuredGoal = goals.find((goal) => goal.type === 'duration');
  const target = configuredGoal?.targetMinutes ?? 5 * cycleMins;
  const totalDays = weeks * 7;

  useEffect(() => {
    if (!selectedEntry) return;
    const frame = requestAnimationFrame(() => sheetRef.current?.present());
    return () => cancelAnimationFrame(frame);
  }, [selectedEntry]);

  const closeSheet = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const rows = useMemo(() => {
    const byDate = new Map(entries.map((entry) => [entry.date, entry]));
    const cells: CalendarCell[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = localDateString(date);
      const entry = byDate.get(dateString);
      const status: Status = !entry
        ? 'none'
        : computeSleepMinutes(entry) >= target
          ? 'met'
          : 'under';
      cells.push({
        key: dateString,
        status,
        dayNum: date.getDate(),
        entry,
      });
    }
    const chunked: CalendarCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      chunked.push(cells.slice(i, i + 7));
    }
    return chunked;
  }, [entries, target, totalDays]);

  const colorFor = (status: Status) =>
    status === 'met'
      ? theme.colors.accent[500]
      : status === 'under'
        ? `${theme.colors.warning}66`
        : theme.colors.surfaceElevated;

  const selectedMinutes = selectedEntry
    ? computeSleepMinutes(selectedEntry)
    : 0;
  const selectedCycles = selectedEntry
    ? computeCompleteCycles(selectedMinutes, cycleMins)
    : 0;
  const selectedMet = selectedMinutes >= target;
  const selectedCopy = selectedEntry ? detailCopy(selectedEntry, target) : null;
  const selectedDate = selectedEntry
    ? new Date(`${selectedEntry.date}T12:00:00`).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        weekday: 'long',
      })
    : '';

  return (
    <>
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
        <View style={styles.grid}>
          {rows.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((cell) => {
                const cellContent = (
                  <>
                    <Text
                      style={[
                        styles.dayNum,
                        {
                          color:
                            cell.status === 'met'
                              ? theme.colors.white
                              : cell.status === 'under'
                                ? theme.colors.textPrimary
                                : theme.colors.textMuted,
                        },
                      ]}
                    >
                      {cell.dayNum}
                    </Text>
                    {cell.entry ? (
                      <Ionicons
                        name="information-circle"
                        size={10}
                        color={
                          cell.status === 'met'
                            ? theme.colors.white
                            : theme.colors.textSecondary
                        }
                        style={styles.infoIcon}
                      />
                    ) : null}
                  </>
                );
                const cellStyle = [
                  styles.cell,
                  {
                    backgroundColor: colorFor(cell.status),
                    borderColor:
                      cell.status === 'none'
                        ? theme.colors.border
                        : 'transparent',
                  },
                ];

                return cell.entry ? (
                  <Pressable
                    key={cell.key}
                    accessibilityRole="button"
                    accessibilityLabel={`${cell.key}, ${cell.status === 'met' ? 'objetivo cumplido' : 'debajo del objetivo'}. Toca para ver detalles.`}
                    hitSlop={4}
                    onPress={() => setSelectedEntry(cell.entry ?? null)}
                    style={({ pressed }) => [
                      cellStyle,
                      { opacity: pressed ? 0.72 : 1 },
                    ]}
                  >
                    {cellContent}
                  </Pressable>
                ) : (
                  <View key={cell.key} style={cellStyle}>
                    {cellContent}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.legend}>
          <LegendItem
            color={theme.colors.accent[500]}
            label="En objetivo"
            theme={theme}
          />
          <LegendItem
            color={`${theme.colors.warning}66`}
            label="Bajo objetivo"
            theme={theme}
          />
          <LegendItem
            color={theme.colors.surfaceElevated}
            label="Sin registro"
            theme={theme}
          />
        </View>
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
          Toca una noche con registro para entender el resultado.
        </Text>
      </View>

      <AppBottomSheetModal
        ref={sheetRef}
        snapPoints={['74%']}
        enableDynamicSizing={false}
        onDismiss={() => setSelectedEntry(null)}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            gap: theme.spacing.lg,
            paddingBottom: theme.spacing.huge,
            paddingHorizontal: theme.spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
          {selectedEntry && selectedCopy ? (
            <>
              <View style={styles.sheetHeader}>
                <Text
                  style={[
                    styles.sheetTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {selectedDate}
                </Text>
                <CircularIconButton
                  icon="close"
                  label="Cerrar"
                  onPress={closeSheet}
                  size={44}
                />
              </View>
              <Badge
                label={
                  selectedMet ? 'Objetivo cumplido' : 'Debajo del objetivo'
                }
                tone={selectedMet ? 'success' : 'warning'}
              />

              <View style={styles.detailStats}>
                <View style={styles.detailStat}>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {formatDuration(selectedMinutes)}
                  </Text>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    duración
                  </Text>
                </View>
                <View
                  style={[
                    styles.detailDivider,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
                <View style={styles.detailStat}>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {selectedCycles}
                  </Text>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    ciclos
                  </Text>
                </View>
                <View
                  style={[
                    styles.detailDivider,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
                <View style={styles.detailStat}>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {feelingLabel(selectedEntry.feeling)}
                  </Text>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    sensación
                  </Text>
                </View>
              </View>

              <RoundedCard elevated={false} style={{ gap: theme.spacing.sm }}>
                <Text
                  style={[
                    styles.detailTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {selectedCopy.title}
                </Text>
                <Text
                  style={[
                    styles.detailBody,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {selectedCopy.reason}
                </Text>
              </RoundedCard>

              <View style={styles.scheduleRow}>
                <Ionicons
                  name="moon-outline"
                  size={18}
                  color={theme.colors.accent[400]}
                />
                <Text
                  style={[
                    styles.scheduleText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {formatTime(new Date(selectedEntry.bedTimeISO))} →{' '}
                  {formatTime(new Date(selectedEntry.wakeTimeISO))} · Meta{' '}
                  {formatDuration(target)}
                </Text>
              </View>

              <View
                style={[
                  styles.advice,
                  {
                    backgroundColor: `${theme.colors.info}12`,
                    borderColor: `${theme.colors.info}30`,
                  },
                ]}
              >
                <Ionicons
                  name="bulb-outline"
                  size={18}
                  color={theme.colors.info}
                />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text
                    style={[
                      styles.adviceTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Siguiente paso
                  </Text>
                  <Text
                    style={[
                      styles.detailBody,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {selectedCopy.advice}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </BottomSheetScrollView>
      </AppBottomSheetModal>
    </>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 14, gap: 12 },
  grid: { gap: 6 },
  weekRow: { flexDirection: 'row', gap: 6 },
  cell: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: 9,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 32,
  },
  infoIcon: { position: 'absolute', right: 2, top: 2 },
  dayNum: { fontSize: 10, fontWeight: '700', fontVariant: ['tabular-nums'] },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 11, fontWeight: '600' },
  hint: { fontSize: 11, lineHeight: 16, textAlign: 'center' },
  detailStats: { flexDirection: 'row', alignItems: 'center' },
  detailStat: { flex: 1, alignItems: 'center', gap: 3 },
  detailDivider: { width: 1, height: 32 },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  detailLabel: { fontSize: 11 },
  detailTitle: { fontSize: 16, fontWeight: '600' },
  detailBody: { fontSize: 13, lineHeight: 19 },
  scheduleRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  scheduleText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
  advice: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 14,
  },
  adviceTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
