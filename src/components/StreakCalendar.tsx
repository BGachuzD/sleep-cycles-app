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
import type { DreamEntry } from '../domain/dreamEntry';
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
  inMonth: boolean;
  isFuture: boolean;
  isToday: boolean;
  entry?: SleepLogEntry;
  dreams?: DreamEntry[];
};

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function monthLabel(date: Date) {
  const label = date.toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

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
  dreams?: DreamEntry[];
  cycleMins: number;
}> = ({ entries, dreams = [], cycleMins }) => {
  const { theme } = useAppTheme();
  const { goals } = useSleepGoalsContext();
  const [selectedEntry, setSelectedEntry] = useState<SleepLogEntry | null>(
    null,
  );
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const sheetRef = useRef<BottomSheetModal>(null);
  const configuredGoal = goals.find((goal) => goal.type === 'duration');
  const target = configuredGoal?.targetMinutes ?? 5 * cycleMins;
  const underGoalColor = '#F7E950';
  const underGoalForeground = '#57470F';
  const underGoalIcon = '#79631B';
  const today = new Date();
  const todayKey = localDateString(today);
  const isCurrentMonth = sameMonth(visibleMonth, today);

  useEffect(() => {
    if (!selectedEntry) return;
    const frame = requestAnimationFrame(() => sheetRef.current?.present());
    return () => cancelAnimationFrame(frame);
  }, [selectedEntry]);

  const closeSheet = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const calendar = useMemo(() => {
    const byDate = new Map(entries.map((entry) => [entry.date, entry]));
    const dreamsByDate = new Map<string, DreamEntry[]>();
    for (const dream of dreams) {
      const dateDreams = dreamsByDate.get(dream.date) ?? [];
      dateDreams.push(dream);
      dreamsByDate.set(dream.date, dateDreams);
    }

    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1, 12);
    const lastDay = new Date(year, month + 1, 0, 12);
    const leadingDays = (firstDay.getDay() + 6) % 7;
    const trailingDays = 6 - ((lastDay.getDay() + 6) % 7);
    const gridStart = new Date(year, month, 1 - leadingDays, 12);
    const gridLength = lastDay.getDate() + leadingDays + trailingDays;
    const cells: CalendarCell[] = [];

    let registered = 0;
    let met = 0;
    let dreamCount = 0;

    for (let i = 0; i < gridLength; i++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      const dateString = localDateString(date);
      const inMonth = date.getFullYear() === year && date.getMonth() === month;
      const entry = inMonth ? byDate.get(dateString) : undefined;
      const dateDreams = inMonth ? dreamsByDate.get(dateString) : undefined;
      const status: Status = !entry
        ? 'none'
        : computeSleepMinutes(entry) >= target
          ? 'met'
          : 'under';

      if (entry) {
        registered += 1;
        if (status === 'met') met += 1;
      }
      dreamCount += dateDreams?.length ?? 0;

      cells.push({
        key: dateString,
        status,
        dayNum: date.getDate(),
        inMonth,
        isFuture: dateString > todayKey,
        isToday: dateString === todayKey,
        entry,
        dreams: dateDreams,
      });
    }

    const chunked: CalendarCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      chunked.push(cells.slice(i, i + 7));
    }
    return { rows: chunked, registered, met, dreamCount };
  }, [dreams, entries, target, todayKey, visibleMonth]);

  const changeMonth = useCallback((offset: number) => {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1, 12),
    );
  }, []);

  const colorFor = (status: Status) =>
    status === 'met'
      ? theme.colors.accent[500]
      : status === 'under'
        ? underGoalColor
        : theme.colors.surfaceElevated;

  const selectedMinutes = selectedEntry
    ? computeSleepMinutes(selectedEntry)
    : 0;
  const selectedCycles = selectedEntry
    ? computeCompleteCycles(selectedMinutes, cycleMins)
    : 0;
  const selectedMet = selectedMinutes >= target;
  const selectedCopy = selectedEntry ? detailCopy(selectedEntry, target) : null;
  const selectedDreams = selectedEntry
    ? dreams.filter((dream) => dream.date === selectedEntry.date)
    : [];
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
        <View style={styles.monthHeader}>
          <CircularIconButton
            icon="chevron-back"
            label="Ver mes anterior"
            onPress={() => changeMonth(-1)}
            size={40}
          />
          <View style={styles.monthHeading}>
            <Text
              accessibilityRole="header"
              style={[styles.monthTitle, { color: theme.colors.textPrimary }]}
            >
              {monthLabel(visibleMonth)}
            </Text>
            <Text
              style={[styles.monthSubtitle, { color: theme.colors.textMuted }]}
            >
              Resumen de tus noches
            </Text>
          </View>
          <CircularIconButton
            disabled={isCurrentMonth}
            icon="chevron-forward"
            label="Ver mes siguiente"
            onPress={() => changeMonth(1)}
            size={40}
          />
        </View>

        <View
          style={[
            styles.monthStats,
            { backgroundColor: theme.colors.surfaceElevated },
          ]}
        >
          {[
            {
              icon: 'moon-outline' as const,
              value: calendar.registered,
              label: 'registradas',
              color: theme.colors.primary,
            },
            {
              icon: 'checkmark-circle-outline' as const,
              value: calendar.met,
              label: 'en meta',
              color: theme.colors.success,
            },
            {
              icon: 'cloudy-night-outline' as const,
              value: calendar.dreamCount,
              label: 'sueños',
              color: theme.colors.violet,
            },
          ].map((stat, index) => (
            <React.Fragment key={stat.label}>
              {index > 0 ? (
                <View
                  style={[
                    styles.monthStatDivider,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
              ) : null}
              <View style={styles.monthStat}>
                <Ionicons name={stat.icon} size={16} color={stat.color} />
                <Text
                  style={[
                    styles.monthStatValue,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {stat.value}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.monthStatLabel,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  {stat.label}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.weekdayRow} accessibilityRole="header">
          {WEEKDAYS.map((day, index) => (
            <Text
              key={`${day}-${index}`}
              style={[styles.weekdayLabel, { color: theme.colors.textMuted }]}
            >
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {calendar.rows.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((cell) => {
                const cellContent = (
                  <>
                    <Text
                      style={[
                        styles.dayNum,
                        {
                          color: !cell.inMonth
                            ? theme.colors.textMuted
                            : cell.status === 'met'
                              ? theme.colors.white
                              : cell.status === 'under'
                                ? underGoalForeground
                                : theme.colors.textMuted,
                        },
                      ]}
                    >
                      {cell.dayNum}
                    </Text>
                    {cell.entry ? (
                      <Ionicons
                        name={
                          cell.dreams?.length
                            ? 'cloudy-night'
                            : 'information-circle'
                        }
                        size={10}
                        color={
                          cell.status === 'met'
                            ? theme.colors.white
                            : underGoalIcon
                        }
                        style={styles.infoIcon}
                      />
                    ) : null}
                  </>
                );
                const cellStyle = [
                  styles.cell,
                  {
                    backgroundColor: cell.inMonth
                      ? colorFor(cell.status)
                      : 'transparent',
                    borderColor: cell.isToday
                      ? theme.colors.primary
                      : cell.inMonth && cell.status === 'none'
                        ? theme.colors.border
                        : 'transparent',
                    borderWidth: cell.isToday ? 2 : 1,
                    opacity: !cell.inMonth ? 0.38 : cell.isFuture ? 0.5 : 1,
                  },
                ];

                return cell.entry ? (
                  <Pressable
                    key={cell.key}
                    accessibilityRole="button"
                    accessibilityLabel={`${cell.key}, ${cell.status === 'met' ? 'objetivo cumplido' : 'debajo del objetivo'}${cell.dreams?.length ? ', con sueño registrado' : ''}. Toca para ver detalles.`}
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
            color={underGoalColor}
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
          Toca una noche con datos para ver el detalle. La luna indica un sueño
          registrado y el contorno azul marca hoy.
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

              {selectedDreams.length > 0 ? (
                <RoundedCard elevated={false} style={{ gap: theme.spacing.sm }}>
                  <View style={styles.dreamHeader}>
                    <Ionicons
                      name="cloudy-night"
                      size={18}
                      color={theme.colors.violet}
                    />
                    <Text
                      style={[
                        styles.detailTitle,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {selectedDreams.length === 1
                        ? 'Sueño de esta noche'
                        : `${selectedDreams.length} sueños de esta noche`}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.detailBody,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {selectedDreams[0]?.mood === 2
                      ? 'Lo marcaste como un sueño agradable.'
                      : selectedDreams[0]?.mood === 1
                        ? 'Lo marcaste como un sueño difícil.'
                        : 'Registraste un recuerdo de esta noche.'}
                    {selectedDreams[0]?.tags?.length
                      ? ` Temas: ${selectedDreams[0].tags.join(', ')}.`
                      : ''}
                  </Text>
                  {selectedDreams[0]?.note ? (
                    <Text
                      numberOfLines={3}
                      style={[
                        styles.dreamNote,
                        { color: theme.colors.textMuted },
                      ]}
                    >
                      “{selectedDreams[0].note}”
                    </Text>
                  ) : null}
                </RoundedCard>
              ) : null}

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
  monthHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  monthHeading: { alignItems: 'center', flex: 1, gap: 2 },
  monthTitle: { fontSize: 18, fontWeight: '700' },
  monthSubtitle: { fontSize: 11, fontWeight: '500' },
  monthStats: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: 8,
  },
  monthStat: {
    alignItems: 'center',
    flex: 1,
    gap: 1,
    justifyContent: 'center',
  },
  monthStatDivider: { height: 30, width: 1 },
  monthStatValue: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  monthStatLabel: { fontSize: 10, fontWeight: '600' },
  weekdayRow: { flexDirection: 'row', gap: 6 },
  weekdayLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
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
  infoIcon: { position: 'absolute', right: 3, top: 3 },
  dayNum: { fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
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
  dreamHeader: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  dreamNote: { fontSize: 12, fontStyle: 'italic', lineHeight: 18 },
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
