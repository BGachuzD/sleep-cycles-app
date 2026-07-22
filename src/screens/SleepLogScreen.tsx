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
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { navigateToScreen } from '../navigation/navigateTo';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { TimeWheel } from '../components/TimeWheel';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { HealthKitBanner } from '../components/HealthKitBanner';
import { EmptyState, useToast } from '../components/ui';
import { usePressScale } from '../hooks/usePressScale';
import { useHealthKit } from '../hooks/useHealthKit';
import { useSleepLogContext } from '../context/SleepLogContext';
import {
  computeSleepMinutes,
  computeCompleteCycles,
  dateStringDaysAgo,
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
// TimeField: tarjeta tocable que muestra la hora;
// al tocarla se abre la rueda nativa debajo.
// ─────────────────────────────────────────────
const TimeField: FC<{
  label: string;
  date: Date;
  active: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ label, date, active, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatTime(date)}. Toca para cambiar la hora`}
        style={[
          timeStyles.column,
          {
            backgroundColor: active
              ? `${theme.colors.accent[500]}14`
              : theme.colors.surfaceElevated,
            borderRadius: theme.radius.lg,
            borderColor: active
              ? theme.colors.accent[500]
              : theme.colors.border,
            borderWidth: active ? 1.5 : 1,
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
        <View style={timeStyles.hintRow}>
          <Ionicons
            name={active ? 'chevron-up' : 'create-outline'}
            size={12}
            color={active ? theme.colors.accent[400] : theme.colors.textMuted}
          />
          <Text
            style={[
              timeStyles.hint,
              {
                color: active
                  ? theme.colors.accent[400]
                  : theme.colors.textMuted,
                fontSize: theme.type.caption,
              },
            ]}
          >
            {active ? 'Cerrar' : 'Editar'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const timeStyles = StyleSheet.create({
  column: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  label: { fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  value: {
    fontWeight: '700',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hint: { fontWeight: '700', letterSpacing: 0.3 },
});

/** Copia la hora/minuto de `picked` sobre la fecha de `base`. */
function withTime(base: Date, picked: Date): Date {
  const next = new Date(base);
  next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return next;
}

/**
 * Ancla la hora de acostarse relativa al despertar: misma fecha del
 * despertar y, si queda igual o después, la noche anterior. Así el
 * cruce de medianoche se resuelve solo y bed < wake siempre.
 */
function anchorBedToWake(bedHM: Date, wake: Date): Date {
  const bed = withTime(wake, bedHM);
  if (bed.getTime() >= wake.getTime()) {
    bed.setDate(bed.getDate() - 1);
  }
  return bed;
}

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

  // Pop del icono al quedar seleccionado
  const iconScale = useSharedValue(1);
  useEffect(() => {
    if (active) {
      iconScale.value = withSequence(
        withSpring(1.3, { mass: 0.3, damping: 10, stiffness: 260 }),
        withSpring(1, { mass: 0.3, damping: 12, stiffness: 220 }),
      );
    }
  }, [active, iconScale]);
  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

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
        <Animated.View style={iconAnimatedStyle}>
          <Ionicons
            name={info.icon}
            size={24}
            color={active ? color : theme.colors.textMuted}
          />
        </Animated.View>
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
// DayChip: selector de a qué día pertenece el registro
// (la fecha es la del DESPERTAR: "Hoy" = desperté esta mañana)
// ─────────────────────────────────────────────
const DayChip: FC<{
  label: string;
  dateCaption: string;
  active: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ label, dateCaption, active, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.95);
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`Registrar despertar de ${label}`}
        style={[
          dayStyles.chip,
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
            dayStyles.label,
            {
              color: active
                ? theme.colors.accent[300]
                : theme.colors.textSecondary,
              fontSize: theme.type.small,
            },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            dayStyles.caption,
            { color: theme.colors.textMuted, fontSize: theme.type.caption },
          ]}
        >
          {dateCaption}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const dayStyles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  label: { fontWeight: '700' },
  caption: { fontWeight: '600' },
});

function formatDayCaption(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
}

// ─────────────────────────────────────────────
// HistoryCard
// ─────────────────────────────────────────────
const HistoryCard: FC<{
  entry: SleepLogEntry;
  cycleMins: number;
  isEditing: boolean;
  isFromHealthKit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  theme: AppTheme;
}> = ({
  entry,
  cycleMins,
  isEditing,
  isFromHealthKit,
  onEdit,
  onDelete,
  theme,
}) => {
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
        <View style={historyStyles.dateRow}>
          <Text
            style={[
              historyStyles.date,
              { color: theme.colors.textMuted, fontSize: theme.type.caption },
            ]}
          >
            {entry.date}
          </Text>
          {isFromHealthKit && (
            <View
              style={[
                historyStyles.sourceBadge,
                {
                  backgroundColor: `${theme.colors.success}1F`,
                  borderColor: `${theme.colors.success}55`,
                },
              ]}
            >
              <Ionicons name="heart" size={9} color={theme.colors.success} />
              <Text
                style={[
                  historyStyles.sourceBadgeText,
                  { color: theme.colors.success },
                ]}
              >
                Salud
              </Text>
            </View>
          )}
        </View>
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  date: { fontWeight: '700', letterSpacing: 0.3 },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: 1,
  },
  sourceBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
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
  const navigation = useNavigation();
  const { showToast } = useToast();

  const hk = useHealthKit();
  const [autoPopulatedFromHK, setAutoPopulatedFromHK] = useState(false);
  const [hasUserEdited, setHasUserEdited] = useState(false);

  const cycleMins = getAdjustedCycleLengthMinutes(profile?.age ?? 30);
  const { bed: initialBed, wake: initialWake } = useMemo(
    () => getSmartDefaults(),
    [],
  );

  const [bedTime, setBedTime] = useState<Date>(initialBed);
  const [wakeTime, setWakeTime] = useState<Date>(initialWake);
  const [feeling, setFeeling] = useState<FeelingLevel>(2);
  const [editingEntry, setEditingEntry] = useState<SleepLogEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Día del despertar del registro nuevo: 0 = hoy, 1 = ayer.
  const [daysAgo, setDaysAgo] = useState<0 | 1>(0);
  const logDate = dateStringDaysAgo(daysAgo);

  const selectDay = useCallback((next: 0 | 1) => {
    setDaysAgo((prev) => {
      if (prev === next) return prev;
      // Conservar las horas elegidas, desplazando el datetime real ±24 h.
      const deltaMs = (prev - next) * 24 * 60 * 60 * 1000;
      setBedTime((b) => new Date(b.getTime() + deltaMs));
      setWakeTime((w) => new Date(w.getTime() + deltaMs));
      return next;
    });
    setAutoPopulatedFromHK(false);
  }, []);

  // Auto-poblar desde HealthKit cuando hay permisos, no estamos editando y
  // el usuario aún no tocó los campos manualmente.
  useEffect(() => {
    if (!hk.isAuthorized || hk.isLoading || editingEntry || hasUserEdited) {
      return;
    }
    let cancelled = false;
    (async () => {
      const hkEntry = await hk.fetchForDate(logDate);
      if (cancelled || !hkEntry) return;
      setBedTime(new Date(hkEntry.bedTime));
      setWakeTime(new Date(hkEntry.wakeTime));
      setAutoPopulatedFromHK(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [hk, editingEntry, hasUserEdited, logDate]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  useEffect(() => {
    if (editingEntry) {
      setBedTime(new Date(editingEntry.bedTimeISO));
      setWakeTime(new Date(editingEntry.wakeTimeISO));
      setFeeling(editingEntry.feeling);
      setAutoPopulatedFromHK(false);
      setHasUserEdited(false);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [editingEntry]);

  const cancelEdit = useCallback(() => {
    setEditingEntry(null);
    const { bed, wake } = getSmartDefaults();
    setBedTime(bed);
    setWakeTime(wake);
    setFeeling(2);
    setDaysAgo(0);
    setAutoPopulatedFromHK(false);
    setHasUserEdited(false);
    setActiveField(null);
  }, []);

  // Campo cuyo TimeWheel está abierto (null = ninguno).
  const [activeField, setActiveField] = useState<'bed' | 'wake' | null>(null);

  const toggleField = useCallback((field: 'bed' | 'wake') => {
    Haptics.selectionAsync().catch(() => {});
    setActiveField((prev) => (prev === field ? null : field));
  }, []);

  const handleBedPicked = useCallback(
    (picked: Date) => {
      setBedTime(anchorBedToWake(picked, wakeTime));
      setHasUserEdited(true);
      setAutoPopulatedFromHK(false);
    },
    [wakeTime],
  );

  const handleWakePicked = useCallback(
    (picked: Date) => {
      const nextWake = withTime(wakeTime, picked);
      setWakeTime(nextWake);
      setBedTime((prevBed) => anchorBedToWake(prevBed, nextWake));
      setHasUserEdited(true);
      setAutoPopulatedFromHK(false);
    },
    [wakeTime],
  );

  const handleConnectHK = useCallback(async () => {
    const granted = await hk.requestPermissions();
    if (!granted) {
      Alert.alert(
        'Permiso no concedido',
        'Puedes activarlo más tarde desde Ajustes → Salud → Mimebien.',
      );
    }
  }, [hk]);

  const showHkBanner =
    hk.isAvailable &&
    !hk.isAuthorized &&
    !hk.isLoading &&
    !hk.isBannerDismissed;

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
      Alert.alert(
        'Hora inválida',
        'La hora de despertar debe ser posterior a la hora de acostarse.',
      );
      return;
    }
    if (previewOutOfRange) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
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
      setActiveField(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      showToast({
        title: 'Registro actualizado',
        message: 'Tus cambios ya están guardados.',
      });
    } else {
      const newId = uuidv4();
      const entry: SleepLogEntry = {
        id: newId,
        date: logDate,
        bedTimeISO: bedTime.toISOString(),
        wakeTimeISO: wakeTime.toISOString(),
        feeling,
      };
      await addEntry(entry);
      // Si los valores vinieron de HealthKit, marca el id para el badge.
      if (autoPopulatedFromHK) {
        await hk.markImported(newId);
      }
      setAutoPopulatedFromHK(false);
      setHasUserEdited(false);
      setDaysAgo(0);
      setActiveField(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      showToast({
        title: 'Sueño registrado',
        message: 'Ya forma parte de tu historial.',
      });
    }
  }, [
    wakeTime,
    bedTime,
    previewOutOfRange,
    editingEntry,
    feeling,
    logDate,
    addEntry,
    updateEntry,
    autoPopulatedFromHK,
    hk,
    showToast,
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.accent[400]}
          />
        }
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(260)} style={styles.hero}>
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

        {/* Acceso a la bitácora de sueños (independiente del registro de noche) */}
        <Pressable
          onPress={() => navigateToScreen(navigation, 'DreamJournal')}
          accessibilityRole="button"
          accessibilityLabel="Abrir bitácora de sueños"
          style={styles.dreamLink}
        >
          <Ionicons
            name="cloudy-night-outline"
            size={18}
            color={theme.colors.accent[400]}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.dreamLinkTitle}>Bitácora de sueños</Text>
            <Text style={styles.dreamLinkSubtitle}>
              Anota un sueño sin registrar la noche
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.colors.textMuted}
          />
        </Pressable>

        {/* HealthKit banner */}
        {showHkBanner && (
          <HealthKitBanner
            onConnect={handleConnectHK}
            onDismiss={hk.dismissBanner}
          />
        )}

        {/* Form */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(260)}
          style={[
            styles.formCard,
            editingEntry && {
              backgroundColor: `${theme.colors.accent[500]}0A`,
            },
          ]}
        >
          {/* Importado de Salud — solo cuando los valores vienen de HK */}
          {autoPopulatedFromHK && (
            <View
              style={[
                styles.importedBadge,
                {
                  backgroundColor: `${theme.colors.success}14`,
                  borderColor: `${theme.colors.success}40`,
                },
              ]}
            >
              <Ionicons
                name="cloud-done-outline"
                size={14}
                color={theme.colors.success}
              />
              <Text
                style={[
                  styles.importedBadgeText,
                  { color: theme.colors.success },
                ]}
              >
                Importado de Salud
              </Text>
            </View>
          )}

          {/* Día del despertar (solo para registros nuevos) */}
          {!editingEntry && (
            <View style={styles.daySection}>
              <Text style={styles.fieldLabel}>¿Qué mañana despertaste?</Text>
              <View style={styles.dayRow}>
                <DayChip
                  label="Ayer"
                  dateCaption={formatDayCaption(dateStringDaysAgo(1))}
                  active={daysAgo === 1}
                  onPress={() => selectDay(1)}
                  theme={theme}
                />
                <DayChip
                  label="Hoy"
                  dateCaption={formatDayCaption(dateStringDaysAgo(0))}
                  active={daysAgo === 0}
                  onPress={() => selectDay(0)}
                  theme={theme}
                />
              </View>
              <Text style={styles.dayHint}>
                {daysAgo === 0
                  ? 'Registrarás la noche que terminó esta mañana.'
                  : 'Registrarás la noche anterior, la que terminó ayer por la mañana.'}
              </Text>
            </View>
          )}

          {/* Time pickers */}
          <View style={styles.timeRow}>
            <TimeField
              label="Me acosté"
              date={bedTime}
              active={activeField === 'bed'}
              onPress={() => toggleField('bed')}
              theme={theme}
            />
            <View style={styles.timeArrow}>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={theme.colors.textMuted}
              />
            </View>
            <TimeField
              label="Desperté"
              date={wakeTime}
              active={activeField === 'wake'}
              onPress={() => toggleField('wake')}
              theme={theme}
            />
          </View>

          {activeField && (
            <Animated.View
              entering={FadeInDown.duration(220)}
              layout={LinearTransition.springify().damping(16)}
              style={styles.wheelBox}
            >
              <TimeWheel
                value={activeField === 'bed' ? bedTime : wakeTime}
                onChange={
                  activeField === 'bed' ? handleBedPicked : handleWakePicked
                }
                height={170}
              />
            </Animated.View>
          )}

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
                Rango inválido, revisa las horas
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
          <EmptyState
            title="Aún no hay noches registradas"
            description="Tu historial y tus patrones de sueño aparecerán aquí después de tu primer registro."
          />
        ) : (
          <View style={styles.historyList}>
            {entries.slice(0, 14).map((entry, index) => {
              const isEditing = editingEntry?.id === entry.id;
              return (
                <Animated.View
                  key={entry.id}
                  entering={FadeIn.delay(Math.min(index * 30, 120)).duration(
                    220,
                  )}
                  exiting={FadeOut.duration(180)}
                  layout={LinearTransition.duration(200)}
                >
                  <HistoryCard
                    entry={entry}
                    cycleMins={cycleMins}
                    isEditing={isEditing}
                    isFromHealthKit={hk.isImported(entry.id)}
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
      fontWeight: '700',
      letterSpacing: -0.5,
      marginTop: 4,
    },
    heroSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      lineHeight: 20,
      marginTop: 6,
    },
    dreamLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
    },
    dreamLinkTitle: {
      color: theme.colors.textPrimary,
      fontSize: theme.type.body,
      fontWeight: '700',
    },
    dreamLinkSubtitle: {
      color: theme.colors.textMuted,
      fontSize: theme.type.caption,
      marginTop: 2,
    },
    formCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.xl,
      gap: theme.spacing.lg,
    },
    daySection: {
      gap: theme.spacing.sm,
    },
    dayRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    dayHint: {
      color: theme.colors.textMuted,
      fontSize: theme.type.caption,
      lineHeight: 15,
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
    wheelBox: {
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: theme.spacing.xs,
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
    importedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingVertical: 5,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: 999,
      borderWidth: 1,
    },
    importedBadgeText: {
      fontSize: theme.type.caption,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
  });
