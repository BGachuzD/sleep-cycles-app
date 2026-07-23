import 'react-native-get-random-values';

import * as Haptics from 'expo-haptics';
import React, { FC, useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';

import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { GradientBackground } from '../components/GradientBackground';
import { PremiumHint } from '../components/PremiumHint';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { EmptyState, useToast } from '../components/ui';
import { useDreamEntriesContext } from '../context/DreamEntriesContext';
import { usePremium } from '../context/EntitlementsContext';
import type { DreamEntry } from '../domain/dreamEntry';
import {
  DREAM_TAGS,
  type DreamMood,
  FREE_DREAM_NOTE_MAXLEN,
  FREE_DREAM_TAG_LIMIT,
  PREMIUM_DREAM_NOTE_MAXLEN,
  todayDateString,
} from '../domain/sleepLog';
import { useTabBarContentPadding } from '../navigation/tabBarLayout';
import type { AppTheme } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeProvider';
import { Chip } from './dreamJournal/Chip';
import { DreamCard } from './dreamJournal/DreamCard';
export const DreamJournalScreen: FC = () => {
  const { theme } = useAppTheme();
  const styles2 = useMemo(() => createStyles(theme), [theme]);
  const bottomContentPadding = useTabBarContentPadding();
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
    <SafeAreaView style={styles2.container} edges={['top', 'left', 'right']}>
      <GradientBackground />
      <FloatingHomeButton insideSafeArea />

      <ScrollView
        style={styles2.scroll}
        contentContainerStyle={[
          styles2.content,
          { paddingBottom: bottomContentPadding },
        ]}
        scrollIndicatorInsets={{ bottom: bottomContentPadding }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(260)} style={styles2.hero}>
          <Text style={styles2.heroEyebrow}>BITÁCORA DE SUEÑOS</Text>
          <Text style={styles2.heroTitle}>¿Qué soñaste?</Text>
          <Text style={styles2.heroSubtitle}>
            Anota tu experiencia onírica.
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
      </ScrollView>
    </SafeAreaView>
  );
};

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
