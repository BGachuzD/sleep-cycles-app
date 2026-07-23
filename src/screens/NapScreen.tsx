// src/screens/NapScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { GradientBackground } from '../components/GradientBackground';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { AppBottomSheetModal, useToast } from '../components/ui';
import { useTabBarContentPadding } from '../navigation/tabBarLayout';
import { scheduleSmartWakeAlarm } from '../notifications/scheduler';
import type { AppTheme } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeProvider';
import { formatTime, formatTimeRange } from '../utils/sleep';
import { DetailRow } from './nap/DetailRow';
import { NapCard } from './nap/NapCard';
import { NAP_OPTIONS, type NapOption, resolveColor } from './nap/napOptions';
// ─────────────────────────────────────────────
// NapScreen
// ─────────────────────────────────────────────
export const NapScreen: FC = () => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const bottomContentPadding = useTabBarContentPadding();
  const { showToast } = useToast();

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const [selectedOption, setSelectedOption] = useState<NapOption | null>(null);
  const [scheduled, setScheduled] = useState<Record<string, string>>({});

  // Bottom sheet
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['72%'], []);

  useEffect(() => {
    if (selectedOption) sheetRef.current?.present();
  }, [selectedOption]);

  const closeSheet = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const openOption = useCallback((option: NapOption) => {
    setSelectedOption(option);
  }, []);

  const handleSchedule = useCallback(async () => {
    if (!selectedOption) return;
    const currentNow = new Date();
    const wakeTime = new Date(
      currentNow.getTime() + selectedOption.durationMinutes * 60_000,
    );
    const windowStart = new Date(wakeTime.getTime() - 10 * 60_000);
    const windowEnd = new Date(wakeTime.getTime() + 10 * 60_000);

    const { centerId } = await scheduleSmartWakeAlarm({
      keyBase: `nap:${selectedOption.id}`,
      windowStart,
      windowEnd,
    });

    if (!centerId) {
      Alert.alert(
        'No se pudo programar',
        'Revisa permisos de notificación o la hora seleccionada.',
      );
      return;
    }

    setScheduled((prev) => ({
      ...prev,
      [selectedOption.id]: formatTime(wakeTime),
    }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    showToast({
      title: 'Siesta programada',
      message: `Despertarás a las ${formatTime(wakeTime)} · ventana ${formatTimeRange(
        windowStart,
        windowEnd,
      )}`,
    });
    closeSheet();
  }, [selectedOption, closeSheet, showToast]);

  // Cálculos derivados para el sheet
  const sheetWakeTime = selectedOption
    ? new Date(now.getTime() + selectedOption.durationMinutes * 60_000)
    : null;
  const sheetWindowStart = sheetWakeTime
    ? new Date(sheetWakeTime.getTime() - 10 * 60_000)
    : null;
  const sheetWindowEnd = sheetWakeTime
    ? new Date(sheetWakeTime.getTime() + 10 * 60_000)
    : null;
  const sheetColor = selectedOption
    ? resolveColor(theme, selectedOption.colorKey)
    : theme.colors.accent[400];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <GradientBackground />
      <FloatingDrawerButton insideSafeArea />
      <FloatingHomeButton insideSafeArea />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomContentPadding },
        ]}
        scrollIndicatorInsets={{ bottom: bottomContentPadding }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(260)} style={styles.hero}>
          <Text style={styles.heroEyebrow}>MODO SIESTA</Text>
          <Text style={styles.heroTitle}>¿Cuánto tiempo tienes?</Text>
          <Text style={styles.heroSubtitle}>
            Calculamos el momento ideal para despertarte sin inercia.
          </Text>
        </Animated.View>

        {/* Opciones */}
        <View style={styles.optionsList}>
          {NAP_OPTIONS.map((option, index) => (
            <Animated.View
              key={option.id}
              entering={FadeInUp.delay(Math.min(index * 36, 120)).duration(240)}
            >
              <NapCard
                option={option}
                now={now}
                scheduledWake={scheduled[option.id]}
                onPress={() => openOption(option)}
                theme={theme}
              />
            </Animated.View>
          ))}
        </View>

        {/* Science note */}
        <Animated.View entering={FadeInUp.delay(120).duration(260)}>
          <View
            style={[
              styles.scienceCard,
              {
                backgroundColor: `${theme.colors.accent[500]}0F`,
                borderColor: `${theme.colors.accent[500]}33`,
                borderRadius: theme.radius.lg,
              },
            ]}
          >
            <Ionicons
              name="flask-outline"
              size={16}
              color={theme.colors.accent[400]}
              style={{ marginTop: 1 }}
            />
            <Text style={styles.scienceText}>
              Las siestas de 20 min mejoran el estado de alerta sin causar
              inercia. Las de 90 min completan un ciclo y maximizan la
              recuperación cognitiva.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom sheet detalle */}
      <AppBottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        onDismiss={() => setSelectedOption(null)}
      >
        <BottomSheetView style={styles.sheetContent}>
          {selectedOption &&
            sheetWakeTime &&
            sheetWindowStart &&
            sheetWindowEnd && (
              <>
                <View style={styles.sheetHeader}>
                  <View
                    style={[
                      styles.sheetIconCircle,
                      { backgroundColor: `${sheetColor}1F` },
                    ]}
                  >
                    <Ionicons
                      name={selectedOption.icon}
                      size={26}
                      color={sheetColor}
                    />
                  </View>
                  <Text style={styles.sheetEyebrow}>
                    SIESTA DE {selectedOption.durationMinutes} MIN
                  </Text>
                  <Text style={styles.sheetClock}>
                    {formatTime(sheetWakeTime)}
                  </Text>
                  <Text style={styles.sheetLabel}>{selectedOption.label}</Text>
                </View>

                <View style={styles.sheetDetails}>
                  <DetailRow
                    icon="time-outline"
                    label="Duración"
                    value={`${selectedOption.durationMinutes} min`}
                    theme={theme}
                  />
                  <DetailRow
                    icon="alarm-outline"
                    label="Despertarás a las"
                    value={formatTime(sheetWakeTime)}
                    theme={theme}
                  />
                  <DetailRow
                    icon="sunny-outline"
                    label="Ventana inteligente"
                    value={formatTimeRange(sheetWindowStart, sheetWindowEnd)}
                    theme={theme}
                  />
                </View>

                <Text style={styles.sheetDescription}>
                  {selectedOption.longDesc}
                </Text>

                <View
                  style={[
                    styles.tipBlock,
                    {
                      backgroundColor: `${sheetColor}14`,
                      borderColor: `${sheetColor}40`,
                    },
                  ]}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={sheetColor}
                    style={{ marginTop: 1 }}
                  />
                  <Text style={styles.tipText}>{selectedOption.tip}</Text>
                </View>

                <View style={styles.sheetCtaWrapper}>
                  <PrimaryCTA
                    label="Programar alarma"
                    icon="alarm-outline"
                    onPress={handleSchedule}
                  />
                </View>
              </>
            )}
        </BottomSheetView>
      </AppBottomSheetModal>
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
    optionsList: { gap: theme.spacing.md },
    scienceCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      padding: theme.spacing.md,
      borderWidth: 1,
    },
    scienceText: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: theme.type.small,
      lineHeight: 18,
    },
    // Sheet
    sheetContent: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xxxl,
      gap: theme.spacing.lg,
    },
    sheetHeader: { alignItems: 'center', gap: 4 },
    sheetIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    sheetEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    sheetClock: {
      color: theme.colors.heroText,
      fontSize: theme.type.title1,
      fontWeight: '700',
      letterSpacing: -1,
      fontVariant: ['tabular-nums'],
      marginTop: 4,
    },
    sheetLabel: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      fontWeight: '700',
      marginTop: 2,
    },
    sheetDetails: {
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    sheetDescription: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.small,
      lineHeight: 19,
      paddingHorizontal: theme.spacing.xs,
    },
    tipBlock: {
      flexDirection: 'row',
      gap: 10,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
    },
    tipText: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: theme.type.small,
      lineHeight: 19,
    },
    sheetCtaWrapper: { marginTop: 'auto' },
  });
