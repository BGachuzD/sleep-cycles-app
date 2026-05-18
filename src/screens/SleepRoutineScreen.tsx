// src/screens/SleepRoutineScreen.tsx
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInLeft } from 'react-native-reanimated';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { usePressScale } from '../hooks/usePressScale';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import { useSleepRoutineContext } from '../context/SleepRoutineContext';
import { getOptimalSleepWindow } from '../domain/sleepProfile';
import { type RoutineStep } from '../domain/sleepRoutine';
import { formatTime } from '../utils/sleep';
import { scheduleUniqueNotificationAtDate } from '../notifications/scheduler';
import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

// ─────────────────────────────────────────────
// Bumper: chevron up/down circular con spring
// ─────────────────────────────────────────────
const Bumper: FC<{
  direction: 'up' | 'down';
  onPress: () => void;
  theme: AppTheme;
}> = ({ direction, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.85);
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        hitSlop={8}
        style={[
          bumperStyles.btn,
          {
            backgroundColor: `${theme.colors.accent[500]}1A`,
            borderRadius: 999,
          },
        ]}
      >
        <Ionicons
          name={direction === 'up' ? 'add' : 'remove'}
          size={18}
          color={theme.colors.accent[400]}
        />
      </Pressable>
    </Animated.View>
  );
};

const bumperStyles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
interface StepDraft {
  title: string;
  description: string;
  minutesBefore: number;
}

// ─────────────────────────────────────────────
// SleepRoutineScreen
// ─────────────────────────────────────────────
export const SleepRoutineScreen: FC = () => {
  const { profile } = useSleepProfileContext();
  const {
    steps,
    loading,
    toggleStep,
    updateStep,
    addStep,
    deleteStep,
    resetToDefaults,
    refresh,
  } = useSleepRoutineContext();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const optWindow = getOptimalSleepWindow(profile?.chronotype);

  const [editMode, setEditMode] = useState(false);
  const [editingStep, setEditingStep] = useState<RoutineStep | null>(null);
  const [isNewStep, setIsNewStep] = useState(false);
  const [draft, setDraft] = useState<StepDraft>({
    title: '',
    description: '',
    minutesBefore: 30,
  });
  const [scheduledSteps, setScheduledSteps] = useState<Set<string>>(new Set());

  // Hora objetivo de dormir: centro de la ventana óptima
  const targetBedTime = useMemo(() => {
    const [sh, sm] = optWindow.bedtimeStart.split(':').map(Number);
    const [eh, em] = optWindow.bedtimeEnd.split(':').map(Number);
    const startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;
    if (endMins < startMins) endMins += 24 * 60;
    const centerMins = Math.round((startMins + endMins) / 2) % (24 * 60);
    const h = Math.floor(centerMins / 60) % 24;
    const m = centerMins % 60;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    return d;
  }, [optWindow]);

  const stepTime = useCallback(
    (step: RoutineStep): Date =>
      new Date(targetBedTime.getTime() - step.minutesBefore * 60 * 1000),
    [targetBedTime],
  );

  // Pasos a mostrar: en modo normal solo habilitados; en edición todos
  const visibleSteps = useMemo(
    () => (editMode ? steps : steps.filter((s) => s.enabled)),
    [editMode, steps],
  );

  // ── Bottom sheet edit ───────────────────────
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['72%'], []);

  useEffect(() => {
    if (editingStep) {
      sheetRef.current?.present();
    }
  }, [editingStep]);

  const closeSheet = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    [],
  );

  // ── Acciones ────────────────────────────────
  const handleScheduleAll = useCallback(async () => {
    let count = 0;
    for (const step of visibleSteps) {
      const time = stepTime(step);
      if (time.getTime() > Date.now()) {
        await scheduleUniqueNotificationAtDate({
          key: `routine:${step.id}`,
          title: step.title,
          body: step.description,
          date: time,
        });
        count++;
      }
    }
    setScheduledSteps(new Set(visibleSteps.map((s) => s.id)));
    Alert.alert(
      'Rutina programada',
      `${count} recordatorios configurados para esta noche.`,
    );
  }, [visibleSteps, stepTime]);

  const handleScheduleStep = useCallback(
    async (step: RoutineStep) => {
      const time = stepTime(step);
      if (time.getTime() <= Date.now()) {
        Alert.alert(
          'Hora pasada',
          'Esta hora ya pasó. Programa para mañana ajustando tu horario.',
        );
        return;
      }
      await scheduleUniqueNotificationAtDate({
        key: `routine:${step.id}`,
        title: step.title,
        body: step.description,
        date: time,
      });
      setScheduledSteps((prev) => new Set([...prev, step.id]));
      Alert.alert('Recordatorio', `Programado para las ${formatTime(time)}`);
    },
    [stepTime],
  );

  const openEdit = useCallback((step: RoutineStep) => {
    setIsNewStep(false);
    setDraft({
      title: step.title,
      description: step.description,
      minutesBefore: step.minutesBefore,
    });
    setEditingStep(step);
  }, []);

  const openAdd = useCallback(() => {
    const newStep: RoutineStep = {
      id: uuidv4(),
      minutesBefore: 30,
      icon: 'star-outline',
      title: '',
      description: '',
      color: '#818cf8',
      enabled: true,
      isDefault: false,
    };
    setIsNewStep(true);
    setDraft({ title: '', description: '', minutesBefore: 30 });
    setEditingStep(newStep);
  }, []);

  const handleSaveDraft = useCallback(async () => {
    if (!editingStep) return;
    if (!draft.title.trim()) {
      Alert.alert('Campo requerido', 'El título no puede estar vacío.');
      return;
    }
    const updated: RoutineStep = {
      ...editingStep,
      title: draft.title.trim(),
      description: draft.description.trim(),
      minutesBefore: draft.minutesBefore,
    };
    if (isNewStep) {
      await addStep(updated);
    } else {
      await updateStep(updated);
    }
    closeSheet();
  }, [editingStep, draft, isNewStep, addStep, updateStep, closeSheet]);

  const handleDeleteStep = useCallback(
    (step: RoutineStep) => {
      Alert.alert('Eliminar paso', `¿Eliminar "${step.title}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteStep(step.id),
        },
      ]);
    },
    [deleteStep],
  );

  const handleReset = useCallback(() => {
    Alert.alert(
      'Restablecer rutina',
      'Se eliminarán tus pasos personalizados y se restaurarán los pasos por defecto.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Restablecer', style: 'destructive', onPress: resetToDefaults },
      ],
    );
  }, [resetToDefaults]);

  const isLast = (index: number) => index === visibleSteps.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <GradientBackground />
      <FloatingDrawerButton insideSafeArea />
      <FloatingHomeButton insideSafeArea />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroEyebrow}>RUTINA PARA DORMIR A LAS</Text>
              <Text style={styles.heroClock}>{formatTime(targetBedTime)}</Text>
            </View>
            <View style={styles.heroActions}>
              {!editMode && (
                <Pressable
                  onPress={refresh}
                  disabled={loading}
                  hitSlop={8}
                  style={styles.iconBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Refrescar rutina"
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
              )}
              <Pressable
                onPress={() => setEditMode((v) => !v)}
                hitSlop={8}
                style={[
                  styles.editToggle,
                  editMode && {
                    backgroundColor: theme.colors.accent[500],
                    borderColor: theme.colors.accent[500],
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={editMode ? 'Salir de edición' : 'Editar rutina'}
              >
                <Ionicons
                  name={editMode ? 'checkmark-outline' : 'pencil-outline'}
                  size={15}
                  color={
                    editMode ? theme.colors.white : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.editToggleText,
                    editMode && { color: theme.colors.white },
                  ]}
                >
                  {editMode ? 'Listo' : 'Editar'}
                </Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.heroSubtitle}>
            Prepárate antes de tu ventana óptima
            {optWindow.label !== 'Intermedio'
              ? ` · cronotipo ${optWindow.label.toLowerCase()}`
              : ''}
            .
          </Text>
        </Animated.View>

        {/* Acción contextual */}
        {!editMode ? (
          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <PrimaryCTA
              label="Programar toda la rutina"
              icon="notifications-outline"
              onPress={handleScheduleAll}
            />
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={styles.resetWrapper}
          >
            <Pressable
              style={styles.resetBtn}
              onPress={handleReset}
              accessibilityRole="button"
            >
              <Ionicons
                name="refresh-outline"
                size={15}
                color={theme.colors.danger}
              />
              <Text style={styles.resetBtnText}>Restablecer por defecto</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Timeline de pasos */}
        <View style={styles.timeline}>
          {visibleSteps.map((step, index) => {
            const time = stepTime(step);
            const isScheduled = scheduledSteps.has(step.id);
            const isPast = time.getTime() <= Date.now();
            return (
              <Animated.View
                key={step.id}
                entering={FadeInLeft.delay(index * 60)
                  .springify()
                  .damping(14)}
              >
                <StepRow
                  step={step}
                  time={time}
                  isScheduled={isScheduled}
                  isPast={isPast}
                  isLast={isLast(index)}
                  editMode={editMode}
                  onToggle={() => toggleStep(step.id)}
                  onPress={() =>
                    editMode ? openEdit(step) : handleScheduleStep(step)
                  }
                  onEdit={() => openEdit(step)}
                  onDelete={() => handleDeleteStep(step)}
                  theme={theme}
                />
              </Animated.View>
            );
          })}
        </View>

        {/* Añadir paso (en edit mode) */}
        {editMode && (
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <Pressable
              style={[
                styles.addStepBtn,
                {
                  backgroundColor: `${theme.colors.accent[500]}14`,
                  borderColor: `${theme.colors.accent[500]}44`,
                },
              ]}
              onPress={openAdd}
              accessibilityRole="button"
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={theme.colors.accent[400]}
              />
              <Text style={styles.addStepText}>Añadir paso personalizado</Text>
            </Pressable>
          </Animated.View>
        )}

        <View style={{ height: theme.spacing.huge }} />
      </ScrollView>

      {/* BottomSheet de edición */}
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.textMuted }}
        backdropComponent={renderBackdrop}
        onDismiss={() => setEditingStep(null)}
      >
        <BottomSheetView style={styles.sheetContent}>
          {editingStep && (
            <>
              <Text style={styles.sheetEyebrow}>
                {isNewStep ? 'NUEVO PASO' : 'EDITAR PASO'}
              </Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Título</Text>
                <BottomSheetTextInput
                  style={styles.input}
                  value={draft.title}
                  onChangeText={(t) => setDraft((d) => ({ ...d, title: t }))}
                  placeholder="Ej. Ducha relajante"
                  placeholderTextColor={theme.colors.textMuted}
                  maxLength={50}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Descripción</Text>
                <BottomSheetTextInput
                  style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
                  value={draft.description}
                  onChangeText={(t) =>
                    setDraft((d) => ({ ...d, description: t }))
                  }
                  placeholder="Breve indicación de qué hacer"
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  maxLength={120}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Minutos antes de acostarse</Text>
                <View style={styles.minutesRow}>
                  <Bumper
                    direction="down"
                    onPress={() =>
                      setDraft((d) => ({
                        ...d,
                        minutesBefore: Math.max(0, d.minutesBefore - 5),
                      }))
                    }
                    theme={theme}
                  />
                  <Text style={styles.minutesValue}>
                    {draft.minutesBefore} min
                  </Text>
                  <Bumper
                    direction="up"
                    onPress={() =>
                      setDraft((d) => ({
                        ...d,
                        minutesBefore: d.minutesBefore + 5,
                      }))
                    }
                    theme={theme}
                  />
                </View>
              </View>

              <View style={styles.sheetCtaWrapper}>
                <PrimaryCTA
                  label={isNewStep ? 'Añadir paso' : 'Guardar cambios'}
                  icon={isNewStep ? 'add-outline' : 'checkmark-outline'}
                  onPress={handleSaveDraft}
                />
              </View>
            </>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// StepRow (uno por paso del timeline)
// ─────────────────────────────────────────────
const StepRow: FC<{
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
            <View style={[rowStyles.line, { backgroundColor: `${step.color}40` }]} />
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
              opacity: !step.enabled && editMode ? 0.55 : isPast && !editMode ? 0.55 : 1,
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
                    { color: theme.colors.textMuted, fontSize: theme.type.micro },
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
                  { color: theme.colors.textSecondary, fontSize: theme.type.small },
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

// ─────────────────────────────────────────────
// Styles principales
// ─────────────────────────────────────────────
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.huge + theme.spacing.xxl,
      paddingBottom: theme.spacing.huge,
      gap: theme.spacing.lg,
    },
    hero: { gap: theme.spacing.sm },
    heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    heroEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    heroClock: {
      color: theme.colors.heroText,
      fontSize: theme.type.title1,
      fontWeight: '900',
      letterSpacing: -1,
      marginTop: 4,
      fontVariant: ['tabular-nums'],
    },
    heroActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      alignItems: 'center',
      marginTop: 6,
    },
    iconBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    editToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.surface,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    editToggleText: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.small,
      fontWeight: '700',
    },
    heroSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      lineHeight: 20,
      marginTop: theme.spacing.xs,
    },
    resetWrapper: { alignItems: 'center' },
    resetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    resetBtnText: {
      color: theme.colors.danger,
      fontSize: theme.type.small,
      fontWeight: '700',
    },
    timeline: { gap: 0 },
    addStepBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
    },
    addStepText: {
      color: theme.colors.accent[400],
      fontSize: theme.type.body,
      fontWeight: '700',
    },
    // Sheet
    sheetContent: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xxxl,
      gap: theme.spacing.lg,
    },
    sheetEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
      textAlign: 'center',
    },
    field: { gap: 6 },
    fieldLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.micro,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      color: theme.colors.textPrimary,
      fontSize: theme.type.bodyLarge,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    minutesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.sm,
    },
    minutesValue: {
      color: theme.colors.textPrimary,
      fontSize: theme.type.title3,
      fontWeight: '800',
      minWidth: 100,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },
    sheetCtaWrapper: { marginTop: 'auto' },
  });
