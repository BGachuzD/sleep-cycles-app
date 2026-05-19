// src/screens/auth/SignUpScreen.tsx
import React, { FC, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../App';
import { useAuth } from '../../context/AuthContext';
import { AuthHero } from '../../components/AuthHero';
import { FieldInput } from '../../components/FieldInput';
import { PrimaryCTA } from '../../components/PrimaryCTA';
import { usePressScale } from '../../hooks/usePressScale';
import { useAppTheme } from '../../theme/ThemeProvider';
import type { AppTheme } from '../../theme/theme';
import type { Chronotype } from '../../domain/sleepProfile';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const { width, height } = Dimensions.get('window');
const AMBIENT_DIAMETER = Math.max(width, height);

const CHRONO_OPTIONS: Array<{
  value: Chronotype;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { value: 'morning', label: 'Matutino', icon: 'sunny-outline' },
  { value: 'intermediate', label: 'Neutro', icon: 'partly-sunny-outline' },
  { value: 'night', label: 'Nocturno', icon: 'moon-outline' },
];

// ─────────────────────────────────────────────
// SegmentedChip (inline para cronotipo)
// ─────────────────────────────────────────────
const SegmentedChip: FC<{
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ label, icon, active, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.96);
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          segmentedStyles.chip,
          active && { backgroundColor: theme.colors.accent[500] },
        ]}
      >
        <Ionicons
          name={icon}
          size={15}
          color={active ? theme.colors.white : theme.colors.textSecondary}
        />
        <Text
          style={[
            segmentedStyles.label,
            {
              color: active ? theme.colors.white : theme.colors.textSecondary,
              fontSize: theme.type.small,
            },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const segmentedStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 999,
  },
  label: { fontWeight: '700' },
});

// ─────────────────────────────────────────────
// SignUpScreen
// ─────────────────────────────────────────────
export const SignUpScreen: FC<Props> = ({ navigation }) => {
  const { signUp } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [chronotype, setChronotype] = useState<Chronotype>('intermediate');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSignUp = async () => {
    setError(null);
    setInfoMessage(null);

    if (!displayName.trim() || !email.trim() || !password || !passwordConfirm) {
      setError('Completa todos los campos.');
      return;
    }
    if (displayName.trim().length < 2) {
      setError('Ingresa un nombre válido (mínimo 2 caracteres).');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp({
      email: email.trim(),
      password,
      displayName: displayName.trim(),
      chronotype,
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }

    setInfoMessage(
      'Cuenta creada. Si la verificación por correo está habilitada, revisa tu bandeja de entrada y confirma tu email antes de iniciar sesión.',
    );
  };

  const goToSignIn = () => navigation.replace('SignIn');
  const linkScale = usePressScale(0.97);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Ambient glow */}
      <View style={styles.ambient} pointerEvents="none">
        <View
          style={[
            styles.ambientGlow,
            {
              backgroundColor: theme.colors.accent[600],
              shadowColor: theme.colors.accent[600],
            },
          ]}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <Animated.View entering={FadeInDown.duration(500)}>
            <AuthHero icon="sparkles-outline" />
          </Animated.View>

          {/* Title */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500)}
            style={styles.titleBlock}
          >
            <Text style={styles.eyebrow}>CREAR CUENTA</Text>
            <Text style={styles.title}>Empieza a dormir mejor</Text>
            <Text style={styles.subtitle}>
              Regístrate para guardar tu perfil de sueño y personalizar tu
              experiencia desde el inicio.
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInUp.delay(180).duration(500)}
            style={styles.form}
          >
            <FieldInput
              label="Nombre para mostrar"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Tu nombre"
              autoCapitalize="words"
              large={false}
            />
            <FieldInput
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              large={false}
            />
            <FieldInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              showToggle
              large={false}
            />
            <FieldInput
              label="Confirmar contraseña"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder="Repite la contraseña"
              secureTextEntry
              showToggle
              large={false}
            />
          </Animated.View>

          {/* Cronotipo */}
          <Animated.View
            entering={FadeInUp.delay(240).duration(500)}
            style={styles.chronoSection}
          >
            <Text style={styles.sectionEyebrow}>CRONOTIPO (RECOMENDADO)</Text>
            <View
              style={[
                styles.segmentedContainer,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                  borderRadius: 999,
                },
              ]}
            >
              {CHRONO_OPTIONS.map((opt) => (
                <SegmentedChip
                  key={opt.value}
                  label={opt.label}
                  icon={opt.icon}
                  active={chronotype === opt.value}
                  onPress={() => setChronotype(opt.value)}
                  theme={theme}
                />
              ))}
            </View>
          </Animated.View>

          {/* Error */}
          {error && (
            <Animated.View entering={FadeInUp.duration(300)}>
              <View
                style={[
                  styles.alertBox,
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
                <Text
                  style={[styles.alertText, { color: theme.colors.danger }]}
                >
                  {error}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Info */}
          {infoMessage && (
            <Animated.View entering={FadeInUp.duration(300)}>
              <View
                style={[
                  styles.alertBox,
                  {
                    backgroundColor: `${theme.colors.accent[500]}14`,
                    borderColor: `${theme.colors.accent[500]}40`,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={theme.colors.accent[400]}
                />
                <Text
                  style={[
                    styles.alertText,
                    { color: theme.colors.accent[300] },
                  ]}
                >
                  {infoMessage}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* CTA */}
          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
            {loading ? (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator color={theme.colors.accent[500]} />
                <Text style={styles.loadingText}>Creando cuenta…</Text>
              </View>
            ) : (
              <PrimaryCTA
                label="Crear cuenta"
                icon="person-add-outline"
                onPress={handleSignUp}
              />
            )}
          </Animated.View>

          {/* Link a SignIn */}
          <Animated.View
            entering={FadeInUp.delay(380).duration(500)}
            style={[styles.linkWrapper, linkScale.animatedStyle]}
          >
            <Pressable
              onPress={goToSignIn}
              onPressIn={linkScale.onPressIn}
              onPressOut={linkScale.onPressOut}
              disabled={loading}
              accessibilityRole="button"
            >
              <Text style={styles.linkText}>
                ¿Ya tienes cuenta?{' '}
                <Text style={styles.linkTextHighlight}>Inicia sesión</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    flex: { flex: 1 },
    ambient: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },
    ambientGlow: {
      position: 'absolute',
      top: -AMBIENT_DIAMETER * 0.45,
      left: (width - AMBIENT_DIAMETER) / 2,
      width: AMBIENT_DIAMETER,
      height: AMBIENT_DIAMETER,
      borderRadius: AMBIENT_DIAMETER / 2,
      opacity: 0.22,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 200,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.huge,
      gap: theme.spacing.lg,
    },
    titleBlock: { alignItems: 'center', gap: 4, marginTop: theme.spacing.md },
    eyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: theme.type.title1,
      fontWeight: '900',
      letterSpacing: -0.5,
      marginTop: 6,
      textAlign: 'center',
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      lineHeight: 20,
      marginTop: 6,
      textAlign: 'center',
      paddingHorizontal: theme.spacing.md,
    },
    form: { gap: theme.spacing.sm, marginTop: theme.spacing.md },
    chronoSection: { gap: theme.spacing.sm, marginTop: theme.spacing.xs },
    sectionEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    segmentedContainer: {
      flexDirection: 'row',
      padding: 4,
      borderWidth: 1,
    },
    alertBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: theme.spacing.md,
      borderWidth: 1,
    },
    alertText: {
      fontSize: theme.type.small,
      fontWeight: '600',
      flex: 1,
      lineHeight: 18,
    },
    loadingWrapper: {
      height: 64,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    loadingText: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      fontWeight: '700',
    },
    linkWrapper: { alignItems: 'center', marginTop: theme.spacing.md },
    linkText: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      textAlign: 'center',
    },
    linkTextHighlight: {
      color: theme.colors.accent[400],
      fontWeight: '800',
    },
  });
