// src/screens/SleepLogScreen.tsx
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { Bumper } from '../components/Bumper';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { usePressScale } from '../hooks/usePressScale';
import { useSleepLogContext } from '../context/SleepLogContext';
import {
  computeSleepMinutes,
  computeCompleteCycles,
  todayDateString,
  type SleepLogEntry,
} from '../domain/sleepLog';
import { formatDuration, formatTime } from '../utils/sleep';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import { getAdjustedCycleLengthMinutes } from '../domain/sleepProfile';
import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';
import { FloatingHomeButton } from '../components/FloatingHomeButton';

// ─────────────────────────────────────────────
// Feelings: 1 Mal · 2 Regular · 3 Excelente
// Iconos meteorológicos + colores semánticos del theme.
// ─────────────────────────────────────────────
type FeelingLevel = 1 | 2 | 3;

const FEELINGS: Record<
  FeelingLevel,
  {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    colorKey: 'danger' | 'warning' | 'success';
  }
> = {
  1: { icon: 'cloud-outline', label: 'Mal', colorKey: 'danger' },
  2: { icon: 'partly-sunny-outline', label: 'Regular', colorKey: 'warning' },
  3: { icon: 'sunny-outline', label: 'Excelente', colorKey: 'success' },
};

// ─────────────────────────────────────────────
// Defaults inteligentes según la hora del día
// ─────────────────────────────────────────────
function getSmartDefaults(): { bed: Date; wake: Date } {
  const now = new Date();
  const hour = now.getHours();

  const wake = new Date();
  const bed = new Date();

  if (hour < 14) {
    const mins = Math.round(now.getMinutes() / 15) * 15;
    wake.setMinutes(mins, 0, 0);
    bed.setTime(wake.getTime() - 8 * 60 * 60 * 1000);
  } else {
    wake.setDate(wake.getDate() + 1);
    wake.setHours(7, 0, 0, 0);
    bed.setHours(23, 0, 0, 0);
  }

  return { bed, wake };
}

// ─────────────────────────────────────────────
// TimeColumn: columna con label + bumpers + hora
// ─────────────────────────────────────────────
const TimeColumn: FC<{
  label: string;
  date: Date;
  onAdjust: (deltaMin: number) => void;
  theme: AppTheme;
}> = ({ label, date, onAdjust, theme }) => (
  <View
    style={[
      timeStyles.column,
      {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radius.lg,
        borderColor: theme.colors.border,
      },
    ]}
  >
    <Text
      style={[
        timeStyles.label,
        { color: theme.colors.textMuted, fontSize: theme.type.micro },
      ]}
    >
      {label}
    </Text>
    <Bumper
      icon="chevron-up"
      onPress={() => onAdjust(15)}
      size={32}
      iconSize={18}
      accessibilityLabel={`Subir 15 min: ${label}`}
    />
    <Text
      style={[
        timeStyles.value,
        { color: theme.colors.heroText, fontSize: theme.type.title2 },
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.65}
    >
      {formatTime(date)}
    </Text>
    <Bumper
      icon="chevron-down"
      onPress={() => onAdjust(-15)}
      size={32}
      iconSize={18}
      accessibilityLabel={`Bajar 15 min: ${label}`}
    />
  </View>
);

const timeStyles = StyleSheet.create({
  column: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
  },
  label: { fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  value: {
    fontWeight: '900',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
});

// ─────────────────────────────────────────────
// FeelingChip
// ─────────────────────────────────────────────
const FeelingChip: FC<{
  feeling: FeelingLevel;
  active: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ feeling, active, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.95);
  const info = FEELINGS[feeling];
  const color = theme.colors[info.colorKey];

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={info.label}
        style={[
          feelingStyles.chip,
          {
            backgroundColor: active
              ? `${color}1F`
              : theme.colors.surfaceElevated,
            borderColor: active ? color : theme.colors.border,
            borderWidth: active ? 1.5 : 1,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <Ionicons
          name={info.icon}
          size={24}
          color={active ? color : theme.colors.textMuted}
        />
        <Text
          style={[
            feelingStyles.label,
            {
              color: active ? color : theme.colors.textSecondary,
              fontSize: theme.type.small,
            },
          ]}
        >
          {info.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const feelingStyles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  label: { fontWeight: '700' },
});

// ─────────────────────────────────────────────
// HistoryCard
// ─────────────────────────────────────────────
const HistoryCard: FC<{
  entry: SleepLogEntry;
  cycleMins: number;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  theme: AppTheme;
}> = ({ entry, cycleMins, isEditing, onEdit, onDelete, theme }) => {
  const mins = computeSleepMinutes(entry);
  const cycles = computeCompleteCycles(mins, cycleMins);
  const info = FEELINGS[entry.feeling];
  const color = theme.colors[info.colorKey];
  const bedDate = new Date(entry.bedTimeISO);
  const wakeDate = new Date(entry.wakeTimeISO);

  return (
    <View
      style={[
        historyStyles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderColor: isEditing
            ? theme.colors.accent[500]
            : theme.colors.border,
          borderWidth: isEditing ? 1.5 : 1,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
        },
      ]}
    >
      <View style={historyStyles.left}>
        <Text
          style={[
            historyStyles.date,
            { color: theme.colors.textMuted, fontSize: theme.type.caption },
          ]}
        >
          {entry.date}
        </Text>
        <Text
          style={[
            historyStyles.time,
            { color: theme.colors.textPrimary, fontSize: theme.type.bodyLarge },
          ]}
        >
          {formatTime(bedDate)} → {formatTime(wakeDate)}
        </Text>
        <Text
          style={[
            historyStyles.detail,
            { color: theme.colors.textMuted, fontSize: theme.type.caption },
          ]}
        >
          {formatDuration(mins)} · {cycles} ciclos
        </Text>
      </View>

      <View style={historyStyles.right}>
        <View
          style={[
            historyStyles.feelingPill,
            { backgroundColor: `${color}1F`, borderColor: `${color}55` },
          ]}
        >
          <Ionicons name={info.icon} size={16} color={color} />
        </View>
        <View style={historyStyles.actions}>
          <Pressable hitSlop={8} onPress={onEdit}>
            <Ionicons
              name="pencil-outline"
              size={16}
              color={
                isEditing ? theme.colors.accent[400] : theme.colors.textMuted
              }
            />
          </Pressable>
          <Pressable hitSlop={8} onPress={onDelete}>
            <Ionicons
              name="trash-outline"
              size={16}
              color={theme.colors.textMuted}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const historyStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: { flex: 1, marginRight: 8 },
  date: { fontWeight: '700', letterSpacing: 0.3, marginBottom: 2 },
  time: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  detail: { marginTop: 2 },
  right: { alignItems: 'center', gap: 8 },
  feelingPill: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
});

// ─────────────────────────────────────────────
// SleepLogScreen
// ─────────────────────────────────────────────
export const SleepLogScreen: FC = () => {
  const { entries, loading, addEntry, updateEntry, deleteEntry, refresh } =
    useSleepLogContext();
  const { profile } = useSleepProfileContext();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const scrollRef = useRef<ScrollView>(null);

  const cycleMins = getAdjustedCycleLengthMinutes(profile?.age ?? 30);
  const { bed: initialBed, wake: initialWake } = useMemo(
    () => getSmartDefaults(),
    [],
  );

  const [bedTime, setBedTime] = useState<Date>(initialBed);
  const [wakeTime, setWakeTime] = useState<Date>(initialWake);
  const [feeling, setFeeling] = useState<FeelingLevel>(2);
  const [editingEntry, setEditingEntry] = useState<SleepLogEntry | null>(null);

  useEffect(() => {
    if (editingEntry) {
      setBedTime(new Date(editingEntry.bedTimeISO));
      setWakeTime(new Date(editingEntry.wakeTimeISO));
      setFeeling(editingEntry.feeling);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [editingEntry]);

  const cancelEdit = useCallback(() => {
    setEditingEntry(null);
    const { bed, wake } = getSmartDefaults();
    setBedTime(bed);
    setWakeTime(wake);
    setFeeling(2);
  }, []);

  const adjustBed = useCallback((delta: number) => {
    setBedTime((prev) => new Date(prev.getTime() + delta * 60_000));
  }, []);

  const adjustWake = useCallback((delta: number) => {
    setWakeTime((prev) => new Date(prev.getTime() + delta * 60_000));
  }, []);

  const previewMinutes = useMemo(
    () =>
      Math.max(
        0,
        Math.round((wakeTime.getTime() - bedTime.getTime()) / 60_000),
      ),
    [bedTime, wakeTime],
  );
  const previewCycles = computeCompleteCycles(previewMinutes, cycleMins);
  const previewValid = previewMinutes > 0 && previewMinutes <= 16 * 60;
  const previewOutOfRange = previewMinutes > 16 * 60;

  const handleSave = useCallback(async () => {
    if (wakeTime <= bedTime) {
      Alert.alert(
        'Hora inválida',
        'La hora de despertar debe ser posterior a la hora de acostarse.',
      );
      return;
    }
    if (previewOutOfRange) {
      Alert.alert(
        'Rango demasiado amplio',
        'La diferencia entre acostarse y despertar parece mayor a 16 h. Ajusta las horas.',
      );
      return;
    }

    if (editingEntry) {
      const updated: SleepLogEntry = {
        ...editingEntry,
        bedTimeISO: bedTime.toISOString(),
        wakeTimeISO: wakeTime.toISOString(),
        feeling,
      };
      await updateEntry(updated);
      setEditingEntry(null);
      Alert.alert('Actualizado', 'Tu registro ha sido actualizado.');
    } else {
      const entry: SleepLogEntry = {
        id: uuidv4(),
        date: todayDateString(),
        bedTimeISO: bedTime.toISOString(),
        wakeTimeISO: wakeTime.toISOString(),
        feeling,
      };
      await addEntry(entry);
      Alert.alert('Guardado', 'Tu sueño quedó registrado.');
    }
  }, [
    wakeTime,
    bedTime,
    previewOutOfRange,
    editingEntry,
    feeling,
    addEntry,
    updateEntry,
  ]);

  const handleDelete = useCallback(
    (entry: SleepLogEntry) => {
      Alert.alert('Eliminar registro', '¿Eliminar este registro?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            if (editingEntry?.id === entry.id) cancelEdit();
            deleteEntry(entry.id);
          },
        },
      ]);
    },
    [editingEntry, cancelEdit, deleteEntry],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <GradientBackground />
      <FloatingDrawerButton insideSafeArea />
      <FloatingHomeButton insideSafeArea />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
          <Text style={styles.heroEyebrow}>REGISTRO DE SUEÑO</Text>
          <Text style={styles.heroTitle}>
            {editingEntry ? 'Editar registro' : '¿Cómo dormiste?'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {editingEntry
              ? `Estás editando el registro del ${editingEntry.date}.`
              : 'Registra cómo dormiste anoche para alimentar tus estadísticas.'}
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(500)}
          style={[
            styles.formCard,
            editingEntry && {
              borderColor: theme.colors.accent[500],
              borderWidth: 1.5,
            },
          ]}
        >
          {/* Time pickers */}
          <View style={styles.timeRow}>
            <TimeColumn
              label="Me acosté"
              date={bedTime}
              onAdjust={adjustBed}
              theme={theme}
            />
            <View style={styles.timeArrow}>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={theme.colors.textMuted}
              />
            </View>
            <TimeColumn
              label="Desperté"
              date={wakeTime}
              onAdjust={adjustWake}
              theme={theme}
            />
          </View>

          {/* Preview */}
          {previewValid && (
            <View
              style={[
                styles.previewBox,
                {
                  backgroundColor: `${theme.colors.accent[500]}14`,
                  borderColor: `${theme.colors.accent[500]}40`,
                },
              ]}
            >
              <Ionicons
                name="moon-outline"
                size={14}
                color={theme.colors.accent[400]}
              />
              <Text
                style={[
                  styles.previewText,
                  { color: theme.colors.accent[300] },
                ]}
              >
                {formatDuration(previewMinutes)} · {previewCycles} ciclos
                completos
              </Text>
            </View>
          )}
          {previewOutOfRange && (
            <View
              style={[
                styles.previewBox,
                {
                  backgroundColor: `${theme.colors.danger}14`,
                  borderColor: `${theme.colors.danger}40`,
                },
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={14}
                color={theme.colors.danger}
              />
              <Text
                style={[styles.previewText, { color: theme.colors.danger }]}
              >
                Rango inválido — revisa las horas
              </Text>
            </View>
          )}

          {/* Feelings */}
          <Text style={styles.fieldLabel}>¿Cómo te sentiste al despertar?</Text>
          <View style={styles.feelingRow}>
            {([1, 2, 3] as FeelingLevel[]).map((f) => (
              <FeelingChip
                key={f}
                feeling={f}
                active={feeling === f}
                onPress={() => setFeeling(f)}
                theme={theme}
              />
            ))}
          </View>

          {/* Submit */}
          <View style={styles.submitWrapper}>
            <PrimaryCTA
              label={editingEntry ? 'Actualizar registro' : 'Guardar noche'}
              icon={
                editingEntry ? 'checkmark-done-outline' : 'checkmark-outline'
              }
              onPress={handleSave}
            />
          </View>

          {editingEntry && (
            <Pressable onPress={cancelEdit} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancelar edición</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* History */}
        <View style={styles.historyHeader}>
          <Text style={styles.historyEyebrow}>HISTORIAL RECIENTE</Text>
          <Pressable
            onPress={refresh}
            disabled={loading}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Refrescar historial"
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.accent[400]}
              />
            ) : (
              <Ionicons
                name="refresh-outline"
                size={18}
                color={theme.colors.accent[400]}
              />
            )}
          </Pressable>
        </View>

        {entries.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons
              name="moon-outline"
              size={28}
              color={theme.colors.textMuted}
            />
            <Text style={styles.emptyText}>
              Aún no hay registros. ¡Empieza hoy!
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {entries.slice(0, 14).map((entry, index) => {
              const isEditing = editingEntry?.id === entry.id;
              return (
                <Animated.View
                  key={entry.id}
                  entering={FadeInUp.delay(index * 40)
                    .springify()
                    .damping(14)}
                >
                  <HistoryCard
                    entry={entry}
                    cycleMins={cycleMins}
                    isEditing={isEditing}
                    onEdit={() =>
                      isEditing ? cancelEdit() : setEditingEntry(entry)
                    }
                    onDelete={() => handleDelete(entry)}
                    theme={theme}
                  />
                </Animated.View>
              );
            })}
          </View>
        )}

        <View style={{ height: theme.spacing.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.huge + theme.spacing.xxl,
      paddingBottom: theme.spacing.huge,
      gap: theme.spacing.xl,
    },
    hero: { gap: 4 },
    heroEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    heroTitle: {
      color: theme.colors.textPrimary,
      fontSize: theme.type.title2,
      fontWeight: '900',
      letterSpacing: -0.5,
      marginTop: 4,
    },
    heroSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      lineHeight: 20,
      marginTop: 6,
    },
    formCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.xl,
      gap: theme.spacing.lg,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    timeArrow: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
    },
    previewText: {
      fontSize: theme.type.body,
      fontWeight: '700',
    },
    fieldLabel: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    feelingRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    submitWrapper: { marginTop: theme.spacing.xs },
    cancelBtn: { alignItems: 'center', paddingVertical: 6 },
    cancelBtnText: {
      color: theme.colors.textMuted,
      fontSize: theme.type.small,
      fontWeight: '600',
    },
    historyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    historyEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    emptyBox: {
      alignItems: 'center',
      gap: 10,
      paddingVertical: theme.spacing.xxl,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: theme.type.small,
    },
    historyList: { gap: theme.spacing.sm },
  });
