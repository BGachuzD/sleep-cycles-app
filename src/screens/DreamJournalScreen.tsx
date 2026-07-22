import React, { FC, useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition,
} from 'react-native-reanimated';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { PremiumHint } from '../components/PremiumHint';
import { EmptyState, useToast } from '../components/ui';
import { usePressScale } from '../hooks/usePressScale';
import { usePremium } from '../context/EntitlementsContext';
import { useDreamEntriesContext } from '../context/DreamEntriesContext';
import {
  DREAM_TAGS,
  FREE_DREAM_TAG_LIMIT,
  FREE_DREAM_NOTE_MAXLEN,
  PREMIUM_DREAM_NOTE_MAXLEN,
  todayDateString,
  type DreamMood,
} from '../domain/sleepLog';
import type { DreamEntry } from '../domain/dreamEntry';
import { formatTime } from '../utils/sleep';
import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

const Chip: FC<{
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active: boolean;
  color?: string;
  grow?: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ label, icon, active, color, grow, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.95);
  const c = color ?? theme.colors.accent[500];
  return (
    <Animated.View style={[grow ? { flex: 1 } : null, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          styles.chip,
          {
            backgroundColor: active ? `${c}1F` : theme.colors.surfaceElevated,
            borderColor: active ? c : theme.colors.border,
            borderWidth: active ? 1.5 : 1,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={16}
            color={active ? c : theme.colors.textMuted}
          />
        )}
        <Text
          style={[
            styles.chipLabel,
            { color: active ? c : theme.colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

function formatDreamWhen(loggedAtISO: string): string {
  const d = new Date(loggedAtISO);
  const date = d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
  return `${date} · ${formatTime(d)}`;
}

const DreamCard: FC<{
  dream: DreamEntry;
  onDelete: () => void;
  theme: AppTheme;
}> = ({ dream, onDelete, theme }) => {
  const moodColor =
    dream.mood === 1
      ? theme.colors.danger
      : dream.mood === 2
        ? theme.colors.success
        : theme.colors.textMuted;
  const moodIcon =
    dream.mood === 1
      ? 'thunderstorm-outline'
      : dream.mood === 2
        ? 'sparkles-outline'
        : 'cloudy-night-outline';

  return (
    <View
      style={[
        styles.dreamCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <View style={styles.dreamCardHeader}>
        <View
          style={[
            styles.moodPill,
            {
              backgroundColor: `${moodColor}1F`,
              borderColor: `${moodColor}55`,
            },
          ]}
        >
          <Ionicons name={moodIcon} size={14} color={moodColor} />
        </View>
        <Text style={[styles.dreamWhen, { color: theme.colors.textMuted }]}>
          {formatDreamWhen(dream.loggedAt)}
        </Text>
        <Pressable
          hitSlop={8}
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Eliminar sueño"
        >
          <Ionicons
            name="trash-outline"
            size={16}
            color={theme.colors.textMuted}
          />
        </Pressable>
      </View>

      {!!dream.tags?.length && (
        <View style={styles.tagRow}>
          {dream.tags.map((t) => (
            <View
              key={t}
              style={[
                styles.tagPill,
                {
                  backgroundColor: `${theme.colors.accent[500]}14`,
                  borderColor: `${theme.colors.accent[500]}33`,
                },
              ]}
            >
              <Text
                style={[
                  styles.tagPillText,
                  { color: theme.colors.accent[300] },
                ]}
              >
                {t}
              </Text>
            </View>
          ))}
        </View>
      )}

      {!!dream.note && (
        <Text style={[styles.dreamNote, { color: theme.colors.textSecondary }]}>
          {dream.note}
        </Text>
      )}
    </View>
  );
};

export const DreamJournalScreen: FC = () => {
  const { theme } = useAppTheme();
  const styles2 = useMemo(() => createStyles(theme), [theme]);
  const { isPremium, presentPaywall } = usePremium();
  const { dreams, addDream, deleteDream } = useDreamEntriesContext();
  const { showToast } = useToast();

  const [mood, setMood] = useState<DreamMood>(2);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const noteMaxLen = isPremium
    ? PREMIUM_DREAM_NOTE_MAXLEN
    : FREE_DREAM_NOTE_MAXLEN;

  const toggleTag = useCallback(
    (tag: string) => {
      const selected = tags.includes(tag);
      if (!selected && !isPremium && tags.length >= FREE_DREAM_TAG_LIMIT) {
        presentPaywall(
          `El plan gratuito permite hasta ${FREE_DREAM_TAG_LIMIT} sensaciones por sueño.`,
        );
        return;
      }
      setTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
      );
    },
    [tags, isPremium, presentPaywall],
  );

  const handleSave = useCallback(async () => {
    const entry: DreamEntry = {
      id: uuidv4(),
      loggedAt: new Date().toISOString(),
      date: todayDateString(),
      mood,
      ...(tags.length ? { tags } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    await addDream(entry);
    setMood(2);
    setTags([]);
    setNote('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    showToast({
      title: 'Sueño anotado',
      message: 'Quedó guardado en tu bitácora.',
    });
  }, [mood, tags, note, addDream, showToast]);

  const handleDelete = useCallback(
    (dream: DreamEntry) => {
      Alert.alert('Eliminar sueño', '¿Eliminar esta anotación?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteDream(dream.id),
        },
      ]);
    },
    [deleteDream],
  );

  return (
    <SafeAreaView style={styles2.container} edges={['top', 'bottom']}>
      <GradientBackground />
      <FloatingHomeButton insideSafeArea />

      <ScrollView
        style={styles2.scroll}
        contentContainerStyle={styles2.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(260)} style={styles2.hero}>
          <Text style={styles2.heroEyebrow}>BITÁCORA DE SUEÑOS</Text>
          <Text style={styles2.heroTitle}>¿Qué soñaste?</Text>
          <Text style={styles2.heroSubtitle}>
            Anótalo cuando quieras — no necesitas registrar cómo dormiste.
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(260)}
          style={styles2.formCard}
        >
          <Text style={styles2.fieldLabel}>¿CÓMO FUE?</Text>
          <View style={styles2.row}>
            <Chip
              label="Malo"
              icon="thunderstorm-outline"
              active={mood === 1}
              color={theme.colors.danger}
              grow
              onPress={() => setMood(1)}
              theme={theme}
            />
            <Chip
              label="Bueno"
              icon="sparkles-outline"
              active={mood === 2}
              color={theme.colors.success}
              grow
              onPress={() => setMood(2)}
              theme={theme}
            />
          </View>

          <Text style={styles2.fieldLabel}>SENSACIONES</Text>
          <View style={styles2.tagsWrap}>
            {DREAM_TAGS.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                active={tags.includes(tag)}
                onPress={() => toggleTag(tag)}
                theme={theme}
              />
            ))}
          </View>
          {!isPremium && (
            <Text style={styles2.hint}>
              Hasta {FREE_DREAM_TAG_LIMIT} sensaciones en el plan gratuito.
            </Text>
          )}

          <Text style={styles2.fieldLabel}>NOTAS</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="¿Qué recuerdas? ¿Dónde estabas, quién aparecía…?"
            placeholderTextColor={theme.colors.textMuted}
            multiline
            maxLength={noteMaxLen}
            style={[
              styles2.noteInput,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                color: theme.colors.textPrimary,
              },
            ]}
          />
          <Text style={styles2.counter}>
            {note.length}/{noteMaxLen}
          </Text>
          {!isPremium && note.length >= FREE_DREAM_NOTE_MAXLEN && (
            <PremiumHint
              label="Escribe notas más largas con Premium"
              onPress={() =>
                presentPaywall(
                  `El plan gratuito permite notas de hasta ${FREE_DREAM_NOTE_MAXLEN} caracteres.`,
                )
              }
            />
          )}

          <View style={{ marginTop: theme.spacing.xs }}>
            <PrimaryCTA
              label="Guardar sueño"
              icon="cloudy-night-outline"
              onPress={handleSave}
            />
          </View>
        </Animated.View>

        {/* Lista */}
        <View style={styles2.listHeader}>
          <Text style={styles2.sectionEyebrow}>TUS SUEÑOS</Text>
        </View>

        {dreams.length === 0 ? (
          <EmptyState
            icon="cloudy-night-outline"
            title="Tu bitácora está en calma"
            description="Cuando anotes un sueño, aparecerá aquí para que puedas recordarlo."
          />
        ) : (
          <View style={styles2.list}>
            {dreams.map((dream, index) => (
              <Animated.View
                key={dream.id}
                entering={FadeInUp.delay(Math.min(index * 30, 120)).duration(
                  220,
                )}
                layout={LinearTransition.duration(200)}
              >
                <DreamCard
                  dream={dream}
                  onDelete={() => handleDelete(dream)}
                  theme={theme}
                />
              </Animated.View>
            ))}
          </View>
        )}

        <View style={{ height: theme.spacing.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipLabel: { fontWeight: '700', fontSize: 13 },
  dreamCard: { borderWidth: 1, padding: 14, gap: 10 },
  dreamCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  moodPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dreamWhen: { flex: 1, fontSize: 12, fontWeight: '700' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagPillText: { fontSize: 11, fontWeight: '700' },
  dreamNote: { fontSize: 13, lineHeight: 18 },
});

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1 },
    content: {
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
    formCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    fieldLabel: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1,
    },
    row: { flexDirection: 'row', gap: theme.spacing.sm },
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    hint: {
      color: theme.colors.textMuted,
      fontSize: theme.type.caption,
      lineHeight: 15,
    },
    noteInput: {
      minHeight: 72,
      borderWidth: 1,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      fontSize: theme.type.body,
      textAlignVertical: 'top',
    },
    counter: {
      color: theme.colors.textMuted,
      fontSize: theme.type.caption,
      fontWeight: '600',
      alignSelf: 'flex-end',
      fontVariant: ['tabular-nums'],
    },
    listHeader: { flexDirection: 'row', alignItems: 'center' },
    sectionEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    list: { gap: theme.spacing.sm },
    emptyBox: {
      alignItems: 'center',
      gap: 10,
      paddingVertical: theme.spacing.xxl,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    emptyText: { color: theme.colors.textMuted, fontSize: theme.type.small },
  });
