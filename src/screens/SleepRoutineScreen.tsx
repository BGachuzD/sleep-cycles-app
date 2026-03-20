// src/screens/SleepRoutineScreen.tsx
import React, { FC, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInLeft, FadeInDown } from 'react-native-reanimated';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import { useSleepRoutineContext } from '../context/SleepRoutineContext';
import { getOptimalSleepWindow } from '../domain/sleepProfile';
import { type RoutineStep } from '../domain/sleepRoutine';
import { formatTime } from '../utils/sleep';
import { scheduleUniqueNotificationAtDate } from '../notifications/scheduler';
import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

// ── Modal de edición de paso ──────────────────────────────────────────────────
interface StepDraft {
  title: string;
  description: string;
  minutesBefore: number;
}

const EditStepModal: FC<{
  visible: boolean;
  draft: StepDraft;
  isNew: boolean;
  onChange: (d: StepDraft) => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ visible, draft, isNew, onChange, onSave, onCancel }) => {
  const { theme } = useAppTheme();
  const modalStyles = createModalStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={modalStyles.overlay}
      >
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>{isNew ? 'Nuevo paso' : 'Editar paso'}</Text>

          <Text style={modalStyles.fieldLabel}>Título</Text>
          <TextInput
            style={modalStyles.input}
            value={draft.title}
            onChangeText={(t) => onChange({ ...draft, title: t })}
            placeholder="Ej. Ducha relajante"
            placeholderTextColor={theme.colors.textMuted}
            maxLength={50}
          />

          <Text style={modalStyles.fieldLabel}>Descripción</Text>
          <TextInput
            style={[modalStyles.input, { height: 72, textAlignVertical: 'top' }]}
            value={draft.description}
            onChangeText={(t) => onChange({ ...draft, description: t })}
            placeholder="Breve indicación de qué hacer"
            placeholderTextColor={theme.colors.textMuted}
            multiline
            maxLength={120}
          />

          <Text style={modalStyles.fieldLabel}>Minutos antes de acostarse</Text>
          <View style={modalStyles.minutesRow}>
            <TouchableOpacity
              style={modalStyles.minutesBtn}
              onPress={() => onChange({ ...draft, minutesBefore: Math.max(0, draft.minutesBefore - 5) })}
            >
              <Ionicons name="remove" size={20} color="#60a5fa" />
            </TouchableOpacity>
            <Text style={modalStyles.minutesValue}>{draft.minutesBefore} min</Text>
            <TouchableOpacity
              style={modalStyles.minutesBtn}
              onPress={() => onChange({ ...draft, minutesBefore: draft.minutesBefore + 5 })}
            >
              <Ionicons name="add" size={20} color="#60a5fa" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={modalStyles.saveBtn} onPress={onSave} activeOpacity={0.85}>
            <Text style={modalStyles.saveBtnText}>{isNew ? 'Añadir paso' : 'Guardar cambios'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={modalStyles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
            <Text style={modalStyles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createModalStyles = (theme: AppTheme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.5)',
    marginBottom: 20,
  },
  title: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 20 },
  fieldLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  minutesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 24,
  },
  minutesBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(96,165,250,0.12)',
  },
  minutesValue: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    minWidth: 80,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: '#10b981',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveBtnText: { color: '#022c22', fontSize: 15, fontWeight: '800' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '600' },
});

// ── Pantalla principal ────────────────────────────────────────────────────────
export const SleepRoutineScreen: FC = () => {
  const { profile } = useSleepProfileContext();
  const { steps, loading, toggleStep, updateStep, addStep, deleteStep, resetToDefaults, refresh } =
    useSleepRoutineContext();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const optWindow = getOptimalSleepWindow(profile?.chronotype);

  const [editMode, setEditMode] = useState(false);
  const [editingStep, setEditingStep] = useState<RoutineStep | null>(null);
  const [isNewStep, setIsNewStep] = useState(false);
  const [draft, setDraft] = useState<StepDraft>({ title: '', description: '', minutesBefore: 30 });
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
  const visibleSteps = editMode ? steps : steps.filter((s) => s.enabled);

  const handleScheduleAll = async () => {
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
    Alert.alert('Rutina programada', `${count} recordatorios configurados para esta noche.`);
  };

  const handleScheduleStep = async (step: RoutineStep) => {
    const time = stepTime(step);
    if (time.getTime() <= Date.now()) {
      Alert.alert('Hora pasada', 'Esta hora ya pasó. Programa para mañana ajustando tu horario.');
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
  };

  const openEdit = (step: RoutineStep) => {
    setEditingStep(step);
    setIsNewStep(false);
    setDraft({ title: step.title, description: step.description, minutesBefore: step.minutesBefore });
  };

  const openAdd = () => {
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
    setEditingStep(newStep);
    setIsNewStep(true);
    setDraft({ title: '', description: '', minutesBefore: 30 });
  };

  const handleSaveDraft = async () => {
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
    setEditingStep(null);
  };

  const handleDeleteStep = (step: RoutineStep) => {
    Alert.alert(
      'Eliminar paso',
      `¿Eliminar "${step.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteStep(step.id),
        },
      ],
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Restablecer rutina',
      'Se eliminarán tus pasos personalizados y se restaurarán los pasos por defecto.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Restablecer', style: 'destructive', onPress: resetToDefaults },
      ],
    );
  };

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Rutina pre-sueño</Text>
              <Text style={styles.subtitle}>
                Prepararte antes de dormir a las{' '}
                <Text style={styles.targetTime}>{formatTime(targetBedTime)}</Text>
                {optWindow.label !== 'Intermedio' ? ` · ${optWindow.label}` : ''}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {!editMode && (
                <TouchableOpacity
                  style={styles.refreshBtn}
                  onPress={refresh}
                  disabled={loading}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                >
                  {loading
                    ? <ActivityIndicator size="small" color={theme.colors.info} />
                    : <Ionicons name="refresh-outline" size={18} color={theme.colors.info} />
                  }
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.editModeBtn, editMode && styles.editModeBtnActive]}
                onPress={() => setEditMode((v) => !v)}
              >
                <Ionicons
                  name={editMode ? 'checkmark-outline' : 'pencil-outline'}
                  size={16}
                  color={editMode ? '#022c22' : theme.colors.textSecondary}
                />
                <Text style={[styles.editModeBtnText, editMode && { color: '#022c22' }]}>
                  {editMode ? 'Listo' : 'Editar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Schedule all / Reset buttons */}
        {!editMode ? (
          <TouchableOpacity style={styles.scheduleAllBtn} onPress={handleScheduleAll}>
            <Ionicons name="notifications-outline" size={18} color="#022c22" style={{ marginRight: 8 }} />
            <Text style={styles.scheduleAllText}>Programar toda la rutina</Text>
          </TouchableOpacity>
        ) : (
          <Animated.View entering={FadeInDown.duration(300)}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Ionicons name="refresh-outline" size={15} color="#f87171" style={{ marginRight: 6 }} />
              <Text style={styles.resetBtnText}>Restablecer por defecto</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Steps timeline */}
        {visibleSteps.map((step, index) => {
          const time = stepTime(step);
          const isScheduled = scheduledSteps.has(step.id);
          const isPast = time.getTime() <= Date.now();

          return (
            <Animated.View
              key={step.id}
              entering={FadeInLeft.delay(index * 60).springify().damping(14)}
            >
              <View style={styles.stepRow}>
                {/* Timeline dot + line */}
                {!editMode && (
                  <View style={styles.timelineCol}>
                    <View style={[styles.dot, { backgroundColor: step.color }]} />
                    {!isLast(index) && (
                      <View style={[styles.line, { backgroundColor: step.color + '40' }]} />
                    )}
                  </View>
                )}

                {/* Card */}
                <TouchableOpacity
                  style={[
                    styles.stepCard,
                    editMode && styles.stepCardEditMode,
                    !editMode && isPast && styles.stepCardPast,
                    !editMode && isScheduled && styles.stepCardScheduled,
                    !step.enabled && editMode && styles.stepCardDisabled,
                  ]}
                  onPress={() => editMode ? openEdit(step) : handleScheduleStep(step)}
                  activeOpacity={0.8}
                >
                  <View style={styles.stepTop}>
                    {editMode && (
                      <Switch
                        value={step.enabled}
                        onValueChange={() => toggleStep(step.id)}
                        trackColor={{ false: theme.colors.border, true: step.color + '80' }}
                        thumbColor={step.enabled ? step.color : theme.colors.textMuted}
                        style={{ marginRight: 10, transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                      />
                    )}

                    <View style={[styles.iconCircle, { backgroundColor: step.color + '20' }]}>
                      <Ionicons name={step.icon} size={18} color={step.color} />
                    </View>

                    <View style={styles.stepTextCol}>
                      {!editMode && <Text style={styles.stepTime}>{formatTime(time)}</Text>}
                      <Text style={[styles.stepTitle, !step.enabled && { color: theme.colors.textMuted }]}>
                        {step.title}
                      </Text>
                    </View>

                    {editMode ? (
                      <View style={styles.editActions}>
                        <TouchableOpacity
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                          onPress={() => openEdit(step)}
                        >
                          <Ionicons name="pencil-outline" size={18} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                        {!step.isDefault && (
                          <TouchableOpacity
                            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                            onPress={() => handleDeleteStep(step)}
                          >
                            <Ionicons name="trash-outline" size={18} color="#f87171" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      isScheduled
                        ? <Ionicons name="checkmark-circle" size={20} color="#34d399" />
                        : <Ionicons name="alarm-outline" size={18} color={theme.colors.textMuted} />
                    )}
                  </View>

                  {!editMode && (
                    <>
                      <Text style={styles.stepDesc}>{step.description}</Text>
                      {step.minutesBefore === 0 && (
                        <View style={styles.bedtimeBadge}>
                          <Text style={styles.bedtimeBadgeText}>⭐ Hora óptima para tu cronotipo</Text>
                        </View>
                      )}
                    </>
                  )}

                  {editMode && (
                    <Text style={[styles.stepDesc, { fontSize: 12, marginTop: 4 }, !step.enabled && { color: theme.colors.border }]}>
                      {step.minutesBefore === 0 ? 'Al acostarse' : `${step.minutesBefore} min antes`}
                      {step.isDefault ? '' : ' · personalizado'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          );
        })}

        {/* Add step button in edit mode */}
        {editMode && (
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <TouchableOpacity style={styles.addStepBtn} onPress={openAdd}>
              <Ionicons name="add-circle-outline" size={20} color="#818cf8" style={{ marginRight: 8 }} />
              <Text style={styles.addStepText}>Añadir paso personalizado</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit step modal */}
      <EditStepModal
        visible={editingStep !== null}
        draft={draft}
        isNew={isNewStep}
        onChange={setDraft}
        onSave={handleSaveDraft}
        onCancel={() => setEditingStep(null)}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 40 },
  header: { marginBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { color: theme.colors.textPrimary, fontSize: 26, fontWeight: '900', marginBottom: 4 },
  subtitle: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 18 },
  targetTime: { color: '#a78bfa', fontWeight: '700' },
  refreshBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 4,
  },
  editModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 4,
  },
  editModeBtnActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  editModeBtnText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '700' },
  scheduleAllBtn: {
    backgroundColor: '#10b981',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 28,
    ...Platform.select({
      ios: { shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  scheduleAllText: { color: '#022c22', fontSize: 15, fontWeight: '800' },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 20,
  },
  resetBtnText: { color: '#f87171', fontSize: 13, fontWeight: '600' },
  stepRow: { flexDirection: 'row', marginBottom: 4 },
  timelineCol: { width: 32, alignItems: 'center', paddingTop: 14 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  line: { width: 2, flex: 1, marginTop: 4 },
  stepCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepCardEditMode: {
    marginLeft: 0,
  },
  stepCardPast: { opacity: 0.45 },
  stepCardScheduled: {
    borderColor: '#34d39940',
    backgroundColor: 'rgba(52,211,153,0.06)',
  },
  stepCardDisabled: {
    opacity: 0.5,
  },
  stepTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  stepTextCol: { flex: 1 },
  stepTime: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '600' },
  stepTitle: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '700' },
  stepDesc: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 18 },
  editActions: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  bedtimeBadge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderRadius: 999,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#a78bfa40',
  },
  bedtimeBadgeText: { color: '#c4b5fd', fontSize: 11, fontWeight: '700' },
  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: 'rgba(129,140,248,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.2)',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addStepText: { color: '#818cf8', fontSize: 14, fontWeight: '700' },
});
