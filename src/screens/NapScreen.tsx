// src/screens/NapScreen.tsx
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { AppBottomSheetModal, useToast } from '../components/ui';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { usePressScale } from '../hooks/usePressScale';
import { scheduleSmartWakeAlarm } from '../notifications/scheduler';
import { formatTime, formatTimeRange } from '../utils/sleep';
import { useAppTheme } from '../theme/ThemeProvider';
import { useTabBarContentPadding } from '../navigation/tabBarLayout';
import type { AppTheme } from '../theme/theme';

// ─────────────────────────────────────────────
// Tipos y catálogo de siestas
// ─────────────────────────────────────────────
type NapColorKey = 'success' | 'warning' | 'accent500' | 'accent700';

interface NapOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  durationMinutes: number;
  shortDesc: string;
  longDesc: string;
  colorKey: NapColorKey;
  tip: string;
  highlight?: boolean;
}

const NAP_OPTIONS: NapOption[] = [
  {
    id: 'power',
    label: 'Power Nap',
    icon: 'flash-outline',
    durationMinutes: 20,
    shortDesc: 'Recarga rápida sin inercia de sueño.',
    longDesc:
      'No entras en sueño profundo. Despertarás sin aturdimiento y con mayor alerta inmediata.',
    colorKey: 'success',
    tip: 'Ideal antes de las 3pm para no afectar tu sueño nocturno.',
  },
  {
    id: 'refresh',
    label: 'Siesta de recuperación',
    icon: 'cafe-outline',
    durationMinutes: 60,
    shortDesc: 'Un ciclo parcial. Posible inercia leve al despertar.',
    longDesc:
      'Entras a fases más profundas. Despertar puede sentirse pesado los primeros minutos, pero ayuda con fatiga acumulada.',
    colorKey: 'warning',
    tip: 'Útil si tienes una o dos horas. Considera 10 min para "arrancar" tras despertar.',
  },
  {
    id: 'full',
    label: 'Ciclo completo',
    icon: 'moon-outline',
    durationMinutes: 90,
    shortDesc: 'Un ciclo de sueño completo. Recuperación cognitiva alta.',
    longDesc:
      'Completas un ciclo de ~90 min, terminando en sueño ligero. Es la opción con mejor balance recuperación-inercia.',
    colorKey: 'accent500',
    tip: 'La más recomendada cuando tienes el tiempo. Despierta en fase ligera, fresco.',
    highlight: true,
  },
  {
    id: 'double',
    label: 'Doble ciclo',
    icon: 'bed-outline',
    durationMinutes: 180,
    shortDesc: 'Dos ciclos completos. Para deuda significativa.',
    longDesc:
      'Dos ciclos seguidos. Recuperación profunda, usa solo si necesitas compensar mala noche o si no dormiste suficiente.',
    colorKey: 'accent700',
    tip: 'Evita después de las 4pm, podría desplazar tu sueño nocturno.',
  },
];

function resolveColor(theme: AppTheme, key: NapColorKey): string {
  switch (key) {
    case 'success':
      return theme.colors.success;
    case 'warning':
      return theme.colors.warning;
    case 'accent500':
      return theme.colors.accent[500];
    case 'accent700':
      return theme.colors.accent[700];
  }
}

// ─────────────────────────────────────────────
// NapCard: opción en la lista
// ─────────────────────────────────────────────
const NapCard: FC<{
  option: NapOption;
  now: Date;
  scheduledWake?: string;
  onPress: () => void;
  theme: AppTheme;
}> = ({ option, now, scheduledWake, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();
  const color = resolveColor(theme, option.colorKey);
  const wakeEta = new Date(now.getTime() + option.durationMinutes * 60_000);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`Programar ${option.label} de ${option.durationMinutes} minutos`}
        style={[
          cardStyles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: scheduledWake
              ? theme.colors.accent[500]
              : option.highlight
                ? `${color}88`
                : theme.colors.border,
            borderWidth: scheduledWake || option.highlight ? 1.5 : 1,
            borderRadius: theme.radius.xl,
            padding: theme.spacing.lg,
          },
        ]}
      >
        <View
          style={[cardStyles.iconCircle, { backgroundColor: `${color}1F` }]}
        >
          <Ionicons name={option.icon} size={22} color={color} />
        </View>

        <View style={cardStyles.body}>
          <View style={cardStyles.titleRow}>
            <Text
              style={[
                cardStyles.label,
                {
                  color: theme.colors.textPrimary,
                  fontSize: theme.type.bodyLarge,
                },
              ]}
            >
              {option.label}
            </Text>
            <View
              style={[
                cardStyles.durationBadge,
                {
                  backgroundColor: `${color}1F`,
                  borderColor: `${color}55`,
                  borderRadius: 999,
                },
              ]}
            >
              <Text
                style={[
                  cardStyles.durationText,
                  { color, fontSize: theme.type.caption },
                ]}
              >
                {option.durationMinutes} min
              </Text>
            </View>
          </View>

          <Text
            style={[
              cardStyles.desc,
              { color: theme.colors.textSecondary, fontSize: theme.type.small },
            ]}
          >
            {option.shortDesc}
          </Text>

          {scheduledWake ? (
            <View
              style={[
                cardStyles.scheduledRow,
                {
                  backgroundColor: `${theme.colors.accent[500]}1F`,
                  borderColor: `${theme.colors.accent[500]}55`,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={theme.colors.accent[400]}
              />
              <Text
                style={[
                  cardStyles.scheduledText,
                  {
                    color: theme.colors.accent[300],
                    fontSize: theme.type.caption,
                  },
                ]}
              >
                Alarma activa para las {scheduledWake}
              </Text>
            </View>
          ) : (
            <Text
              style={[
                cardStyles.eta,
                { color: theme.colors.textMuted, fontSize: theme.type.caption },
              ]}
            >
              Despertarías a las {formatTime(wakeEta)}
            </Text>
          )}
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.textMuted}
        />
      </Pressable>
    </Animated.View>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: { fontWeight: '700', flex: 1 },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  durationText: {
    fontWeight: '700',
    letterSpacing: 0.3,
    fontVariant: ['tabular-nums'],
  },
  desc: { lineHeight: 17 },
  eta: { fontWeight: '600', marginTop: 2 },
  scheduledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  scheduledText: { fontWeight: '700' },
});

// ─────────────────────────────────────────────
// DetailRow para el sheet
// ─────────────────────────────────────────────
const DetailRow: FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  theme: AppTheme;
}> = ({ icon, label, value, theme }) => (
  <View style={detailStyles.row}>
    <Ionicons name={icon} size={16} color={theme.colors.textMuted} />
    <Text
      style={[
        detailStyles.label,
        { color: theme.colors.textSecondary, fontSize: theme.type.body },
      ]}
    >
      {label}
    </Text>
    <Text
      style={[
        detailStyles.value,
        { color: theme.colors.textPrimary, fontSize: theme.type.body },
      ]}
    >
      {value}
    </Text>
  </View>
);

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  label: { flex: 1, fontWeight: '500' },
  value: { fontWeight: '700', fontVariant: ['tabular-nums'] },
});

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
