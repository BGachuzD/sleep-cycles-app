// src/screens/auth/ResetPasswordScreen.tsx
//
// Se abre vía deep link `mimebien://reset-password#access_token=...&type=recovery`
// cuando el usuario tap en el link del correo de recuperación. El listener
// de Linking en App.tsx ya hizo `supabase.auth.setSession()` y marcó
// `enterPasswordRecovery()` en el AuthContext, por lo que el RootNavigator
// muestra esta pantalla en lugar del flujo normal.

import React, { FC, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { useAuth } from '../../context/AuthContext';
import { AuthHero } from '../../components/AuthHero';
import { FieldInput } from '../../components/FieldInput';
import { PrimaryCTA } from '../../components/PrimaryCTA';
import { usePressScale } from '../../hooks/usePressScale';
import { useAppTheme } from '../../theme/ThemeProvider';
import type { AppTheme } from '../../theme/theme';

const { width, height } = Dimensions.get('window');
const AMBIENT_DIAMETER = Math.max(width, height);

export const ResetPasswordScreen: FC = () => {
  const { updatePassword, exitPasswordRecovery, signOut } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!password || !confirm) {
      setError('Completa ambos campos.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    const { error: updateError } = await updatePassword(password);
    setLoading(false);
    if (updateError) {
      setError(updateError);
      return;
    }
    Alert.alert(
      'Contraseña actualizada',
      'Tu nueva contraseña ya está activa. Ahora puedes seguir usando la app con normalidad.',
      [
        {
          text: 'Entendido',
          onPress: () => {
            exitPasswordRecovery();
          },
        },
      ],
    );
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancelar recuperación',
      'Si cancelas, tu contraseña no cambiará y cerraremos la sesión actual.',
      [
        { text: 'Continuar reseteando', style: 'cancel' },
        {
          text: 'Cancelar',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            exitPasswordRecovery();
          },
        },
      ],
    );
  };

  const cancelScale = usePressScale(0.97);

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
            <AuthHero icon="lock-closed-outline" />
          </Animated.View>

          {/* Title */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(260)}
            style={styles.titleBlock}
          >
            <Text style={styles.eyebrow}>NUEVA CONTRASEÑA</Text>
            <Text style={styles.title}>Define tu nueva clave</Text>
            <Text style={styles.subtitle}>
              Elige una contraseña que recuerdes. Mínimo 6 caracteres.
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInUp.delay(120).duration(260)}
            style={styles.form}
          >
            <FieldInput
              label="Nueva contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              showToggle
              large={false}
            />
            <FieldInput
              label="Confirmar contraseña"
              value={confirm}
              onChangeText={setConfirm}
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

          {/* CTA */}
          <Animated.View entering={FadeInUp.delay(120).duration(260)}>
            {loading ? (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator color={theme.colors.accent[500]} />
                <Text style={styles.loadingText}>Actualizando…</Text>
              </View>
            ) : (
              <PrimaryCTA
                label="Guardar contraseña"
                icon="checkmark-outline"
                onPress={handleSave}
              />
            )}
          </Animated.View>

          {/* Cancel */}
          <Animated.View
            entering={FadeInUp.delay(120).duration(260)}
            style={[styles.linkWrapper, cancelScale.animatedStyle]}
          >
            <Pressable
              onPress={handleCancel}
              onPressIn={cancelScale.onPressIn}
              onPressOut={cancelScale.onPressOut}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Cancelar recuperación"
            >
              <Text style={styles.linkText}>Cancelar recuperación</Text>
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
      color: theme.colors.textMuted,
      fontSize: theme.type.body,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
