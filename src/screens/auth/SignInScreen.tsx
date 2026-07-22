// src/screens/auth/SignInScreen.tsx
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

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

const { width, height } = Dimensions.get('window');
const AMBIENT_DIAMETER = Math.max(width, height);

export const SignInScreen: FC<Props> = ({ navigation }) => {
  const { signIn } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);
    if (signInError) setError(signInError);
  };

  const goToSignUp = () => navigation.replace('SignUp');
  const goToForgotPassword = () => navigation.navigate('ForgotPassword');
  const linkScale = usePressScale(0.97);
  const forgotScale = usePressScale(0.97);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Ambient glow */}
      <View style={styles.ambient} pointerEvents="none">
        <View
          style={[
            styles.ambientGlow,
            {
              backgroundColor: theme.colors.accent[600],
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
          <Animated.View entering={FadeInDown.duration(260)}>
            <AuthHero icon="moon-outline" />
          </Animated.View>

          {/* Title */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(260)}
            style={styles.titleBlock}
          >
            <Text style={styles.eyebrow}>BIENVENIDO DE NUEVO</Text>
            <Text style={styles.title}>Continúa tu descanso</Text>
            <Text style={styles.subtitle}>
              Inicia sesión para retomar tus recomendaciones de sueño.
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInUp.delay(120).duration(260)}
            style={styles.form}
          >
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
              placeholder="••••••••"
              secureTextEntry
              showToggle
              large={false}
            />
          </Animated.View>

          {/* Error */}
          {error && (
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
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </Animated.View>
          )}

          {/* Forgot password link */}
          <Animated.View
            entering={FadeInUp.delay(120).duration(260)}
            style={[styles.forgotWrapper, forgotScale.animatedStyle]}
          >
            <Pressable
              onPress={goToForgotPassword}
              onPressIn={forgotScale.onPressIn}
              onPressOut={forgotScale.onPressOut}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Recuperar contraseña"
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={FadeInUp.delay(120).duration(260)}>
            {loading ? (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator color={theme.colors.accent[500]} />
                <Text style={styles.loadingText}>Iniciando sesión…</Text>
              </View>
            ) : (
              <PrimaryCTA
                label="Iniciar sesión"
                icon="log-in-outline"
                onPress={handleSignIn}
              />
            )}
          </Animated.View>

          {/* Link a SignUp */}
          <Animated.View
            entering={FadeInUp.delay(120).duration(260)}
            style={[styles.linkWrapper, linkScale.animatedStyle]}
          >
            <Pressable
              onPress={goToSignUp}
              onPressIn={linkScale.onPressIn}
              onPressOut={linkScale.onPressOut}
              disabled={loading}
              accessibilityRole="button"
            >
              <Text style={styles.linkText}>
                ¿Aún no tienes cuenta?{' '}
                <Text style={styles.linkTextHighlight}>Regístrate</Text>
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
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.huge,
      gap: theme.spacing.lg,
    },
    titleBlock: { alignItems: 'center', gap: 4, marginTop: theme.spacing.lg },
    eyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: theme.type.title1,
      fontWeight: '700',
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
      fontWeight: '700',
    },
    forgotWrapper: { alignSelf: 'flex-end', marginTop: -theme.spacing.xs },
    forgotText: {
      color: theme.colors.accent[400],
      fontSize: theme.type.small,
      fontWeight: '700',
    },
  });
