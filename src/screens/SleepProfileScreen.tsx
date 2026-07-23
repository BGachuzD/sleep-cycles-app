// src/screens/SleepProfileScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { FC, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../App';
import { FieldInput } from '../components/FieldInput';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { GradientBackground } from '../components/GradientBackground';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { useAuth } from '../context/AuthContext';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import type { Chronotype, Gender, SleepProfile } from '../domain/sleepProfile';
import {
  buildDerivedProfile,
  calculateBMI,
  categorizeBMI,
  getOptimalSleepWindow,
} from '../domain/sleepProfile';
import {
  useTabBarContentPadding,
  useTabBarOverlayHeight,
} from '../navigation/tabBarLayout';
import type { AppTheme } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeProvider';
import { DataRow } from './sleepProfile/DataRow';
import { SecondaryLink } from './sleepProfile/SecondaryLink';
import { SegmentedChips } from './sleepProfile/SegmentedChip';

type Props = NativeStackScreenProps<RootStackParamList, 'SleepProfile'>;

// ─────────────────────────────────────────────
// Opciones de segmented control
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
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'morning', label: 'Matutino', icon: 'sunny-outline' },
  { value: 'intermediate', label: 'Neutro', icon: 'partly-sunny-outline' },
  { value: 'night', label: 'Nocturno', icon: 'moon-outline' },
];

const BMI_LABEL: Record<string, string> = {
  underweight: 'Bajo peso',
  normal: 'Normal',
  overweight: 'Sobrepeso',
  obese: 'Obesidad',
};

// ─────────────────────────────────────────────
// SleepProfileScreen
// ─────────────────────────────────────────────
export const SleepProfileScreen: FC<Props> = ({ navigation, route }) => {
  const rootNavigation = useNavigation();
  const { profile, loading, saveProfile } = useSleepProfileContext();
  const { signOut, user } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isForceSetup = route.params?.forceSetup === true;
  const tabBarContentPadding = useTabBarContentPadding();
  const tabBarOverlayHeight = useTabBarOverlayHeight();
  const bottomContentPadding = isForceSetup ? 120 : 120 + tabBarOverlayHeight;
  const displayName = user?.user_metadata?.display_name as string | undefined;

  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [heightStr, setHeightStr] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [chronotype, setChronotype] = useState<Chronotype>('intermediate');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const metaChronotype = user?.user_metadata?.chronotype as
      | Chronotype
      | undefined;
    if (profile) {
      setAge(String(profile.age));
      setWeight(String(profile.weightKg));
      setHeightStr(String(profile.heightCm));
      setGender(profile.gender);
      setChronotype(profile.chronotype ?? metaChronotype ?? 'intermediate');
    } else if (metaChronotype) {
      setChronotype(metaChronotype);
    }
  }, [profile, user]);

  const validationError = useMemo(() => {
    const ageNum = Number(age);
    const weightNum = Number(weight);
    const heightNum = Number(heightStr);

    if (!age || !weight || !heightStr)
      return 'Por favor, completa todos los campos.';
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120)
      return 'La edad debe ser un número válido (1-120).';
    if (isNaN(weightNum) || weightNum <= 0)
      return 'El peso debe ser mayor a 0.';
    if (isNaN(heightNum) || heightNum <= 0)
      return 'La altura debe ser mayor a 0.';
    return null;
  }, [age, weight, heightStr]);

  const parsedProfile: SleepProfile | null = useMemo(() => {
    if (validationError) return null;
    return {
      age: Number(age),
      weightKg: Number(weight),
      heightCm: Number(heightStr),
      gender,
      chronotype,
      wakeHour: profile?.wakeHour,
      wakeMinute: profile?.wakeMinute,
    };
  }, [
    age,
    weight,
    heightStr,
    gender,
    chronotype,
    validationError,
    profile?.wakeHour,
    profile?.wakeMinute,
  ]);

  const derived = useMemo(() => {
    if (!parsedProfile) return null;
    return buildDerivedProfile(parsedProfile);
  }, [parsedProfile]);

  const bmiInfo = useMemo(() => {
    if (!parsedProfile) return null;
    const bmi = calculateBMI(parsedProfile.weightKg, parsedProfile.heightCm);
    const cat = categorizeBMI(bmi);
    return { bmi, cat };
  }, [parsedProfile]);

  const handleSave = async () => {
    if (!parsedProfile || validationError) return;
    setSaving(true);
    await saveProfile(parsedProfile);
    setSaving(false);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Quieres cerrar tu sesión actual?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleDeleteAccount = () => {
    (rootNavigation as any).navigate('DeleteAccount');
  };

  const optimalWindow = parsedProfile?.chronotype
    ? getOptimalSleepWindow(parsedProfile.chronotype)
    : null;

  if (loading) {
    return (
      <View style={styles.container}>
        <GradientBackground />
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={theme.colors.accent[500]} size="large" />
          <Text style={styles.loadingText}>Cargando perfil…</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={isForceSetup ? ['top', 'bottom'] : ['top', 'left', 'right']}
    >
      <GradientBackground />
      {!isForceSetup && <FloatingDrawerButton insideSafeArea />}
      {!isForceSetup && <FloatingHomeButton insideSafeArea />}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: isForceSetup
                ? bottomContentPadding
                : Math.max(bottomContentPadding, tabBarContentPadding),
            },
          ]}
          scrollIndicatorInsets={{
            bottom: isForceSetup ? 0 : bottomContentPadding,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <Animated.View
            entering={FadeInDown.duration(260)}
            style={styles.hero}
          >
            <Text style={styles.heroEyebrow}>TU PERFIL</Text>
            <Text style={styles.heroTitle}>
              {displayName ? `Hola, ${displayName}` : 'Datos personales'}
            </Text>
            <Text style={styles.heroSubtitle}>
              Ajustamos ciclos, latencia y eficiencia con base en tu edad, IMC y
              cronotipo.
            </Text>
          </Animated.View>

          {/* Info banner (force setup) */}
          {isForceSetup && (
            <Animated.View entering={FadeInUp.delay(60).duration(240)}>
              <View
                style={[
                  styles.infoBanner,
                  {
                    backgroundColor: `${theme.colors.accent[500]}14`,
                    borderColor: `${theme.colors.accent[500]}40`,
                    borderRadius: theme.radius.lg,
                  },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={theme.colors.accent[400]}
                  style={{ marginTop: 1 }}
                />
                <Text style={styles.infoBannerText}>
                  Completa tu perfil para obtener recomendaciones personalizadas
                  antes de continuar.
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Section: datos personales */}
          <Animated.View entering={FadeInUp.delay(80).duration(260)}>
            <Text style={styles.sectionEyebrow}>DATOS PERSONALES</Text>
            <View style={styles.fieldsRow}>
              <View style={{ flex: 1 }}>
                <FieldInput
                  label="Edad"
                  value={age}
                  onChangeText={setAge}
                  placeholder="30"
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <FieldInput
                  label="Peso (kg)"
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="70.5"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.fieldsRow}>
              <View style={{ flex: 1 }}>
                <FieldInput
                  label="Altura (cm)"
                  value={heightStr}
                  onChangeText={setHeightStr}
                  placeholder="175"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }} />
            </View>
          </Animated.View>

          {/* Section: género */}
          <Animated.View
            entering={FadeInUp.delay(120).duration(260)}
            style={styles.section}
          >
            <Text style={styles.sectionEyebrow}>GÉNERO BIOLÓGICO</Text>
            <SegmentedChips
              options={GENDER_OPTIONS}
              value={gender}
              onChange={setGender}
              theme={theme}
            />
          </Animated.View>

          {/* Section: cronotipo */}
          <Animated.View
            entering={FadeInUp.delay(120).duration(260)}
            style={styles.section}
          >
            <Text style={styles.sectionEyebrow}>CRONOTIPO</Text>
            <SegmentedChips
              options={CHRONO_OPTIONS}
              value={chronotype}
              onChange={setChronotype}
              theme={theme}
            />
            {optimalWindow && (
              <Text style={styles.chronoHint}>
                Ventana óptima para dormir:{' '}
                <Text style={styles.chronoHintStrong}>
                  {optimalWindow.bedtimeStart} a {optimalWindow.bedtimeEnd}
                </Text>
              </Text>
            )}
          </Animated.View>

          {/* Validation error */}
          {validationError && (
            <Animated.View entering={FadeInUp.duration(240)}>
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: `${theme.colors.danger}14`,
                    borderColor: `${theme.colors.danger}40`,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <Ionicons
                  name="warning-outline"
                  size={16}
                  color={theme.colors.danger}
                />
                <Text style={styles.errorText}>{validationError}</Text>
              </View>
            </Animated.View>
          )}

          {/* BMI card */}
          {bmiInfo && (
            <Animated.View entering={FadeInUp.delay(120).duration(260)}>
              <Text style={styles.sectionEyebrow}>ÍNDICE DE MASA CORPORAL</Text>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.xl,
                  },
                ]}
              >
                <Text style={styles.bmiValue}>{bmiInfo.bmi.toFixed(1)}</Text>
                <View style={styles.bmiBadgeWrapper}>
                  <View
                    style={[
                      styles.bmiBadge,
                      {
                        backgroundColor: `${theme.colors.accent[500]}1F`,
                        borderColor: `${theme.colors.accent[500]}55`,
                        borderRadius: 999,
                      },
                    ]}
                  >
                    <Text style={styles.bmiBadgeText}>
                      {BMI_LABEL[bmiInfo.cat] ?? bmiInfo.cat}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Derived params */}
          {derived && (
            <Animated.View entering={FadeInUp.delay(120).duration(260)}>
              <Text style={styles.sectionEyebrow}>PARÁMETROS DERIVADOS</Text>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.xl,
                    paddingVertical: theme.spacing.sm,
                    paddingHorizontal: theme.spacing.lg,
                  },
                ]}
              >
                <DataRow
                  icon="sync-outline"
                  label="Longitud de ciclo"
                  value={`${derived.adjustedCycleMinutes} min`}
                  theme={theme}
                />
                <DataRow
                  icon="analytics-outline"
                  label="Eficiencia estimada"
                  value={`${(derived.sleepEfficiency * 100).toFixed(0)}%`}
                  theme={theme}
                />
                <DataRow
                  icon="time-outline"
                  label="Latencia para dormir"
                  value={`${derived.latencyMinutes} min`}
                  theme={theme}
                  last
                />
              </View>
            </Animated.View>
          )}

          {/* Acciones secundarias (solo si no force setup) */}
          {!isForceSetup && (
            <Animated.View
              entering={FadeInUp.delay(120).duration(260)}
              style={styles.secondaryActions}
            >
              <SecondaryLink
                icon="notifications-outline"
                label="Ver mis recordatorios"
                onPress={() => navigation.navigate('Notifications')}
                theme={theme}
              />
              <SecondaryLink
                icon="log-out-outline"
                label="Cerrar sesión"
                onPress={handleLogout}
                theme={theme}
              />
              <SecondaryLink
                icon="trash-outline"
                label="Eliminar cuenta"
                onPress={handleDeleteAccount}
                destructive
                theme={theme}
              />
            </Animated.View>
          )}
        </ScrollView>

        {/* Footer fijo */}
        <View
          style={[
            styles.footer,
            {
              bottom: isForceSetup ? 0 : tabBarOverlayHeight,
              backgroundColor:
                theme.name === 'dark'
                  ? 'rgba(2,6,23,0.95)'
                  : 'rgba(248,250,252,0.95)',
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          {saving ? (
            <View style={styles.savingWrapper}>
              <ActivityIndicator color={theme.colors.accent[500]} />
              <Text style={styles.savingText}>Guardando…</Text>
            </View>
          ) : (
            <PrimaryCTA
              label={isForceSetup ? 'Comenzar' : 'Guardar perfil'}
              icon="cloud-upload-outline"
              onPress={handleSave}
              trailingIcon={
                isForceSetup ? 'arrow-forward' : 'checkmark-outline'
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    flex: { flex: 1 },
    loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: {
      color: theme.colors.textSecondary,
      marginTop: 12,
      fontSize: theme.type.body,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.huge + theme.spacing.xxl,
      paddingBottom: 120, // espacio para el footer fijo
      gap: theme.spacing.lg,
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
    infoBanner: {
      flexDirection: 'row',
      gap: 10,
      padding: theme.spacing.md,
      borderWidth: 1,
    },
    infoBannerText: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: theme.type.small,
      lineHeight: 18,
    },
    section: { gap: theme.spacing.sm },
    sectionEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
      marginBottom: 8,
    },
    fieldsRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    chronoHint: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.small,
      textAlign: 'center',
      marginTop: 6,
    },
    chronoHintStrong: {
      color: theme.colors.accent[300],
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: theme.spacing.md,
      borderWidth: 1,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: theme.type.small,
      fontWeight: '600',
      flex: 1,
    },
    card: {
      padding: theme.spacing.lg,
      borderWidth: 1,
    },
    bmiValue: {
      color: theme.colors.heroText,
      fontSize: theme.type.display,
      fontWeight: '700',
      letterSpacing: -2,
      fontVariant: ['tabular-nums'],
      textAlign: 'center',
    },
    bmiBadgeWrapper: { alignItems: 'center', marginTop: 6 },
    bmiBadge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderWidth: 1,
    },
    bmiBadgeText: {
      color: theme.colors.accent[300],
      fontSize: theme.type.caption,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    secondaryActions: { gap: theme.spacing.sm, marginTop: theme.spacing.md },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.md,
      paddingBottom:
        Platform.OS === 'ios' ? theme.spacing.lg : theme.spacing.lg,
      borderTopWidth: 1,
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
