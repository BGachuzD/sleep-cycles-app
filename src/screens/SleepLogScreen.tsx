// src/screens/SleepLogScreen.tsx
import 'react-native-get-random-values';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
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
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';

import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { GradientBackground } from '../components/GradientBackground';
import { HealthKitBanner } from '../components/HealthKitBanner';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { TimeWheel } from '../components/TimeWheel';
import { EmptyState, useToast } from '../components/ui';
import { useSleepLogContext } from '../context/SleepLogContext';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import {
  computeCompleteCycles,
  dateStringDaysAgo,
  type SleepLogEntry,
} from '../domain/sleepLog';
import { getAdjustedCycleLengthMinutes } from '../domain/sleepProfile';
import { useHealthKit } from '../hooks/useHealthKit';
import { navigateToScreen } from '../navigation/navigateTo';
import { useTabBarContentPadding } from '../navigation/tabBarLayout';
import type { AppTheme } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeProvider';
import { formatDuration } from '../utils/sleep';
import { DayChip } from './sleepLog/DayChip';
import { FeelingChip } from './sleepLog/FeelingChip';
import type { FeelingLevel } from './sleepLog/feelings';
import {
  anchorBedToWake,
  formatDayCaption,
  getSmartDefaults,
  withTime,
} from './sleepLog/helpers';
import { HistoryCard } from './sleepLog/HistoryCard';
import { TimeField } from './sleepLog/TimeField';

// ─────────────────────────────────────────────
// SleepLogScreen
// ─────────────────────────────────────────────
export const SleepLogScreen: FC = () => {
  const { entries, loading, addEntry, updateEntry, deleteEntry, refresh } =
    useSleepLogContext();
  const { profile } = useSleepProfileContext();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const bottomContentPadding = useTabBarContentPadding();
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <GradientBackground />
      <FloatingDrawerButton insideSafeArea />
      <FloatingHomeButton insideSafeArea />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomContentPadding },
        ]}
        scrollIndicatorInsets={{ bottom: bottomContentPadding }}
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
