// src/screens/SleepLogScreen.tsx
import React, { FC, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { useSleepLogContext } from '../context/SleepLogContext';
import {
  computeSleepMinutes,
  computeCompleteCycles,
  todayDateString,
  type SleepLogEntry,
} from '../domain/sleepLog';
import { formatDuration, formatTime } from '../utils/sleep';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

const FEELING_LABELS: Record<1 | 2 | 3, { emoji: string; label: string; color: string }> = {
  1: { emoji: '😴', label: 'Mal', color: '#f87171' },
  2: { emoji: '😐', label: 'Regular', color: '#fbbf24' },
  3: { emoji: '😊', label: 'Excelente', color: '#34d399' },
};

// ── Defaults inteligentes según la hora del día ──────────────────────────────
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

// ── Componente ajustador de hora ─────────────────────────────────────────────
const TimeAdjuster: FC<{
  label: string;
  date: Date;
  onAdjust: (deltaMinutes: number) => void;
}> = ({ label, date, onAdjust }) => {
  const { theme } = useAppTheme();
  const timeStyles = createTimeStyles(theme);

  return (
    <View style={timeStyles.wrapper}>
      <Text style={timeStyles.label}>{label}</Text>

      <View style={timeStyles.row}>
        <TouchableOpacity
          style={timeStyles.btn}
          onPress={() => onAdjust(-15)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
        >
          <Ionicons name="remove" size={18} color={theme.colors.info} />
        </TouchableOpacity>

        <Text
          style={timeStyles.value}
          adjustsFontSizeToFit
          numberOfLines={1}
          minimumFontScale={0.7}
        >
          {formatTime(date)}
        </Text>

        <TouchableOpacity
          style={timeStyles.btn}
          onPress={() => onAdjust(15)}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
        >
          <Ionicons name="add" size={18} color={theme.colors.info} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createTimeStyles = (theme: AppTheme) => StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 0,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 4,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(96,165,250,0.12)',
    flexShrink: 0,
  },
  value: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
});

// ── Pantalla principal ────────────────────────────────────────────────────────
export const SleepLogScreen: FC = () => {
  const { entries, loading, addEntry, updateEntry, deleteEntry, refresh } = useSleepLogContext();
  const { profile } = useSleepProfileContext();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const scrollRef = useRef<ScrollView>(null);

  const cycleMins = profile?.age
    ? profile.age < 18 ? 95 : profile.age > 60 ? 85 : 90
    : 90;

  const { bed: initialBed, wake: initialWake } = useMemo(() => getSmartDefaults(), []);

  const [bedTime, setBedTime] = useState<Date>(initialBed);
  const [wakeTime, setWakeTime] = useState<Date>(initialWake);
  const [feeling, setFeeling] = useState<1 | 2 | 3>(2);
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
    setBedTime((prev) => new Date(prev.getTime() + delta * 60 * 1000));
  }, []);

  const adjustWake = useCallback((delta: number) => {
    setWakeTime((prev) => new Date(prev.getTime() + delta * 60 * 1000));
  }, []);

  const previewMinutes = useMemo(
    () => Math.max(0, Math.round((wakeTime.getTime() - bedTime.getTime()) / 60_000)),
    [bedTime, wakeTime],
  );
  const previewCycles = computeCompleteCycles(previewMinutes, cycleMins);
  const previewValid = previewMinutes > 0 && previewMinutes <= 16 * 60;

  const handleSave = async () => {
    if (wakeTime <= bedTime) {
      Alert.alert(
        'Hora inválida',
        'La hora de despertar debe ser posterior a la hora de acostarse.',
      );
      return;
    }
    if (previewMinutes > 16 * 60) {
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
      Alert.alert('¡Actualizado!', 'Tu registro ha sido actualizado.');
    } else {
      const entry: SleepLogEntry = {
        id: uuidv4(),
        date: todayDateString(),
        bedTimeISO: bedTime.toISOString(),
        wakeTimeISO: wakeTime.toISOString(),
        feeling,
      };
      await addEntry(entry);
      Alert.alert('¡Guardado!', 'Tu sueño quedó registrado.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <GradientBackground />
      <FloatingDrawerButton insideSafeArea />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Registro de sueño</Text>
          <Text style={styles.subtitle}>
            Registra cómo dormiste anoche para ver tus estadísticas.
          </Text>
        </View>

        {/* Form card */}
        <View style={[styles.card, editingEntry && styles.cardEditing]}>
          {editingEntry && (
            <View style={styles.editBanner}>
              <Ionicons name="pencil" size={12} color="#fbbf24" style={{ marginRight: 4 }} />
              <Text style={styles.editBannerText}>Editando · {editingEntry.date}</Text>
            </View>
          )}

          <Text style={styles.cardTitle}>
            {editingEntry ? 'Editar registro' : '¿Cómo dormiste anoche?'}
          </Text>

          {/* Time pickers */}
          <View style={styles.timeRow}>
            <TimeAdjuster label="Me acosté" date={bedTime} onAdjust={adjustBed} />
            <Ionicons name="arrow-forward" size={16} color={theme.colors.textMuted} />
            <TimeAdjuster label="Desperté" date={wakeTime} onAdjust={adjustWake} />
          </View>

          {/* Preview */}
          {previewValid ? (
            <View style={styles.previewBox}>
              <Ionicons name="moon" size={14} color="#a5b4fc" style={{ marginRight: 6 }} />
              <Text style={styles.previewText}>
                {formatDuration(previewMinutes)} · {previewCycles} ciclos completos
              </Text>
            </View>
          ) : previewMinutes > 16 * 60 ? (
            <View style={[styles.previewBox, styles.previewBoxError]}>
              <Ionicons name="warning-outline" size={14} color={theme.colors.danger} style={{ marginRight: 6 }} />
              <Text style={[styles.previewText, { color: theme.colors.danger }]}>
                Rango inválido — revisa las horas
              </Text>
            </View>
          ) : null}

          {/* Feeling */}
          <Text style={styles.feelingLabel}>¿Cómo te sentiste al despertar?</Text>
          <View style={styles.feelingRow}>
            {([1, 2, 3] as (1 | 2 | 3)[]).map((f) => {
              const info = FEELING_LABELS[f];
              const active = feeling === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.feelingChip,
                    active && { borderColor: info.color, backgroundColor: `${info.color}20` },
                  ]}
                  onPress={() => setFeeling(f)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.feelingEmoji}>{info.emoji}</Text>
                  <Text style={[styles.feelingChipText, active && { color: info.color }]}>
                    {info.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
            <Ionicons
              name={editingEntry ? 'checkmark-done-circle-outline' : 'checkmark-circle-outline'}
              size={18}
              color="#022c22"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.saveButtonText}>
              {editingEntry ? 'Actualizar registro' : 'Guardar noche'}
            </Text>
          </TouchableOpacity>

          {editingEntry && (
            <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit} activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>Cancelar edición</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* History */}
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Historial reciente</Text>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={refresh}
            disabled={loading}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {loading
              ? <ActivityIndicator size="small" color={theme.colors.info} />
              : <Ionicons name="refresh-outline" size={18} color={theme.colors.info} />
            }
          </TouchableOpacity>
        </View>

        {entries.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="moon-outline" size={28} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>Aún no hay registros. ¡Empieza hoy!</Text>
          </View>
        ) : (
          entries.slice(0, 14).map((entry, index) => {
            const mins = computeSleepMinutes(entry);
            const cycles = computeCompleteCycles(mins, cycleMins);
            const info = FEELING_LABELS[entry.feeling];
            const bedDate = new Date(entry.bedTimeISO);
            const wakeDate = new Date(entry.wakeTimeISO);
            const isEditing = editingEntry?.id === entry.id;

            return (
              <Animated.View key={entry.id} entering={FadeInUp.delay(index * 50).springify()}>
                <View style={[styles.historyCard, isEditing && styles.historyCardEditing]}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>{entry.date}</Text>
                    <Text style={styles.historyTime}>
                      {formatTime(bedDate)} → {formatTime(wakeDate)}
                    </Text>
                    <Text style={styles.historyDetail}>
                      {formatDuration(mins)} · {cycles} ciclos
                    </Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyFeeling}>{info.emoji}</Text>
                    <View style={styles.historyActions}>
                      <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                        onPress={() => (isEditing ? cancelEdit() : setEditingEntry(entry))}
                      >
                        <Ionicons
                          name="pencil-outline"
                          size={16}
                          color={isEditing ? '#fbbf24' : theme.colors.textMuted}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                        onPress={() =>
                          Alert.alert('Eliminar', '¿Eliminar este registro?', [
                            { text: 'Cancelar', style: 'cancel' },
                            {
                              text: 'Eliminar',
                              style: 'destructive',
                              onPress: () => {
                                if (isEditing) cancelEdit();
                                deleteEntry(entry.id);
                              },
                            },
                          ])
                        }
                      >
                        <Ionicons name="trash-outline" size={16} color={theme.colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Animated.View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { color: theme.colors.textPrimary, fontSize: 26, fontWeight: '900', marginBottom: 4 },
  subtitle: { color: '#a5b4fc', fontSize: 13, lineHeight: 18 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 28,
  },
  cardEditing: {
    borderColor: 'rgba(251,191,36,0.5)',
  },
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  editBannerText: { color: '#fbbf24', fontSize: 11, fontWeight: '600' },
  cardTitle: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 14 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
  },
  previewBoxError: {
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderColor: 'rgba(248,113,113,0.3)',
  },
  previewText: { color: '#a5b4fc', fontSize: 13, fontWeight: '600' },
  feelingLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  feelingRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  feelingChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
  },
  feelingEmoji: { fontSize: 22, marginBottom: 4 },
  feelingChipText: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600' },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveButtonText: { color: '#022c22', fontSize: 15, fontWeight: '800' },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '600' },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyTitle: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '700' },
  refreshBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyText: { color: theme.colors.textMuted, fontSize: 13, marginTop: 10 },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  historyCardEditing: {
    borderColor: 'rgba(251,191,36,0.4)',
    backgroundColor: 'rgba(251,191,36,0.04)',
  },
  historyLeft: { flex: 1, marginRight: 8 },
  historyDate: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  historyTime: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '700' },
  historyDetail: { color: theme.colors.textMuted, fontSize: 11, marginTop: 2 },
  historyRight: { alignItems: 'center', gap: 8 },
  historyFeeling: { fontSize: 20 },
  historyActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
});
