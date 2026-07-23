// src/screens/ProfileSetupScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { FC, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FieldInput } from '../components/FieldInput';
import { GradientBackground } from '../components/GradientBackground';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { WheelTimePicker } from '../components/WheelTimePicker';
import { useAuth } from '../context/AuthContext';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import type { Chronotype, Gender, SleepProfile } from '../domain/sleepProfile';
import {
  getAdjustedCycleLengthMinutes,
  getOptimalSleepWindow,
} from '../domain/sleepProfile';
import type { AppTheme } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeProvider';
import { OptionCard } from './profileSetup/OptionCard';
import { SegmentedChip } from './profileSetup/SegmentedChip';

const TOTAL_STEPS = 4;

// ─────────────────────────────────────────────
// Opciones
// ─────────────────────────────────────────────
const GENDER_OPTIONS: {
  value: Gender;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'male', label: 'Masculino', icon: 'man-outline' },
  { value: 'female', label: 'Femenino', icon: 'woman-outline' },
  { value: 'other', label: 'Otro', icon: 'person-outline' },
];

const CHRONO_OPTIONS: {
  value: Chronotype;
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: 'morning',
    label: 'Matutino',
    desc: 'Me duermo y me levanto temprano naturalmente.',
    icon: 'sunny-outline',
  },
  {
    value: 'intermediate',
    label: 'Intermedio',
    desc: 'Sin preferencia clara de horario.',
    icon: 'partly-sunny-outline',
  },
  {
    value: 'night',
    label: 'Nocturno',
    desc: 'Me desvelo fácilmente y me cuesta madrugar.',
    icon: 'moon-outline',
  },
];
// ─────────────────────────────────────────────
// ProfileSetupScreen: stepper de primer uso.
// El navigator lo muestra mientras profile === null; al guardar,
// la app pasa sola al drawer principal.
// ─────────────────────────────────────────────
export const ProfileSetupScreen: FC = () => {
  const { user } = useAuth();
  const { saveProfile } = useSleepProfileContext();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const displayName = user?.user_metadata?.display_name as string | undefined;
  const firstName = displayName?.trim().split(/\s+/)[0];
  const metaChronotype = user?.user_metadata?.chronotype as
    | Chronotype
    | undefined;

  const [step, setStep] = useState(0);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [weight, setWeight] = useState('');
  const [heightStr, setHeightStr] = useState('');
  const [chronotype, setChronotype] = useState<Chronotype>(
    metaChronotype ?? 'intermediate',
  );
  const [wakeDate, setWakeDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(7, 0, 0, 0);
    return d;
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const stepError = (): string | null => {
    if (step === 0) {
      const ageNum = Number(age);
      if (!age) return 'Cuéntanos tu edad para ajustar tus ciclos.';
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        return 'La edad debe ser un número entre 1 y 120.';
      }
    }
    if (step === 1) {
      const w = Number(weight);
      const h = Number(heightStr);
      if (!weight || !heightStr) return 'Completa tu peso y altura.';
      if (isNaN(w) || w <= 0) return 'El peso debe ser mayor a 0.';
      if (isNaN(h) || h <= 0) return 'La altura debe ser mayor a 0.';
    }
    return null;
  };

  const handleNext = async () => {
    const err = stepError();
    if (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
      setError(err);
      return;
    }
    setError(null);

    if (step < TOTAL_STEPS - 1) {
      Haptics.selectionAsync().catch(() => {});
      setStep((s) => s + 1);
      return;
    }

    // Último paso: guardar. El navigator cambia solo al ver profile != null.
    setSaving(true);
    const profile: SleepProfile = {
      age: Number(age),
      weightKg: Number(weight),
      heightCm: Number(heightStr),
      gender,
      chronotype,
      wakeHour: wakeDate.getHours(),
      wakeMinute: wakeDate.getMinutes(),
    };
    await saveProfile(profile);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  };

  const cycleMins = age ? getAdjustedCycleLengthMinutes(Number(age)) : null;
  const optimalWindow = getOptimalSleepWindow(chronotype);

  const stepTitles: { title: string; subtitle: string }[] = [
    {
      title: firstName ? `Hola, ${firstName} 👋` : 'Cuéntanos de ti',
      subtitle:
        'Tu edad y género biológico ajustan la duración de tus ciclos y tu latencia de sueño.',
    },
    {
      title: 'Tu cuerpo',
      subtitle:
        'Con tu peso y altura estimamos tu eficiencia de sueño real, no la de un promedio.',
    },
    {
      title: '¿Cuál es tu cronotipo?',
      subtitle: 'Tu reloj biológico natural. Elige el que más se parezca a ti.',
    },
    {
      title: '¿A qué hora despiertas?',
      subtitle:
        'Tu hora habitual entre semana. La usamos para tus recomendaciones y tu recordatorio diario.',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <GradientBackground />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header: progreso */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {step > 0 ? (
              <Pressable
                onPress={handleBack}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Paso anterior"
                style={styles.backBtn}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            ) : (
              <View style={styles.backBtn} />
            )}
            <Text style={styles.stepLabel}>
              PASO {step + 1} DE {TOTAL_STEPS}
            </Text>
            <View style={styles.backBtn} />
          </View>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: `${theme.colors.accent[500]}1F` },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.accent[500],
                  width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Título del paso (key para re-animar en cada cambio) */}
          <Animated.View
            key={`title-${step}`}
            entering={FadeInDown.duration(240)}
          >
            <Text style={styles.title}>{stepTitles[step].title}</Text>
            <Text style={styles.subtitle}>{stepTitles[step].subtitle}</Text>
          </Animated.View>

          <Animated.View
            key={`content-${step}`}
            entering={FadeInUp.delay(80).duration(240)}
            style={styles.content}
          >
            {step === 0 && (
              <>
                <FieldInput
                  label="Edad"
                  value={age}
                  onChangeText={(t) => {
                    setAge(t);
                    setError(null);
                  }}
                  placeholder="30"
                  keyboardType="number-pad"
                />
                {cycleMins && (
                  <Text style={styles.liveHint}>
                    Tus ciclos durarán ~{cycleMins} min.
                  </Text>
                )}
                <Text style={styles.fieldLabel}>GÉNERO BIOLÓGICO</Text>
                <View
                  style={[
                    styles.segmentedContainer,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  {GENDER_OPTIONS.map((opt) => (
                    <SegmentedChip
                      key={opt.value}
                      label={opt.label}
                      icon={opt.icon}
                      active={gender === opt.value}
                      onPress={() => setGender(opt.value)}
                      theme={theme}
                    />
                  ))}
                </View>
              </>
            )}

            {step === 1 && (
              <View style={styles.fieldsRow}>
                <View style={{ flex: 1 }}>
                  <FieldInput
                    label="Peso (kg)"
                    value={weight}
                    onChangeText={(t) => {
                      setWeight(t);
                      setError(null);
                    }}
                    placeholder="70.5"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldInput
                    label="Altura (cm)"
                    value={heightStr}
                    onChangeText={(t) => {
                      setHeightStr(t);
                      setError(null);
                    }}
                    placeholder="175"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={styles.optionsList}>
                {CHRONO_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    label={opt.label}
                    desc={opt.desc}
                    icon={opt.icon}
                    active={chronotype === opt.value}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setChronotype(opt.value);
                    }}
                    theme={theme}
                  />
                ))}
                <Text style={styles.liveHint}>
                  Ventana óptima para dormir: {optimalWindow.bedtimeStart} a{' '}
                  {optimalWindow.bedtimeEnd}
                </Text>
              </View>
            )}

            {step === 3 && (
              <View
                style={[
                  styles.wheelBox,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <WheelTimePicker value={wakeDate} onChange={setWakeDate} />
              </View>
            )}
          </Animated.View>

          {/* Error */}
          {error && (
            <Animated.View entering={FadeInUp.duration(250)}>
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: `${theme.colors.danger}14`,
                    borderColor: `${theme.colors.danger}40`,
                  },
                ]}
              >
                <Ionicons
                  name="warning-outline"
                  size={16}
                  color={theme.colors.danger}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {saving ? (
            <View style={styles.savingWrapper}>
              <ActivityIndicator color={theme.colors.accent[500]} />
              <Text style={styles.savingText}>Guardando tu perfil…</Text>
            </View>
          ) : (
            <PrimaryCTA
              label={step === TOTAL_STEPS - 1 ? 'Comenzar' : 'Continuar'}
              icon={
                step === TOTAL_STEPS - 1
                  ? 'checkmark-outline'
                  : 'arrow-forward-outline'
              }
              onPress={handleNext}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    flex: { flex: 1 },
    header: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepLabel: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    progressTrack: {
      height: 6,
      borderRadius: 999,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 999,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.xxl,
      paddingBottom: theme.spacing.huge,
      gap: theme.spacing.lg,
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: theme.type.title1,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      lineHeight: 20,
      marginTop: 8,
    },
    content: { gap: theme.spacing.md, marginTop: theme.spacing.sm },
    fieldLabel: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
      marginTop: theme.spacing.sm,
    },
    segmentedContainer: {
      flexDirection: 'row',
      padding: 4,
      borderWidth: 1,
      borderRadius: 999,
    },
    fieldsRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    optionsList: { gap: theme.spacing.sm },
    liveHint: {
      color: theme.colors.accent[300],
      fontSize: theme.type.small,
      fontWeight: '700',
      textAlign: 'center',
    },
    wheelBox: {
      borderWidth: 1,
      borderRadius: theme.radius.xl,
      paddingVertical: theme.spacing.sm,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderRadius: theme.radius.md,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: theme.type.small,
      fontWeight: '600',
      flex: 1,
    },
    footer: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
    },
    savingWrapper: {
      height: 64,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    savingText: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      fontWeight: '700',
    },
  });
