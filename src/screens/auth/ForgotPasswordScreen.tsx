// src/screens/auth/ForgotPasswordScreen.tsx
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

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const { width, height } = Dimensions.get('window');
const AMBIENT_DIAMETER = Math.max(width, height);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ForgotPasswordScreen: FC<Props> = ({ navigation }) => {
  const { resetPassword } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentToEmail, setSentToEmail] = useState<string | null>(null);

  const handleSend = async () => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Ingresa tu correo electrónico.');
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setError('Ese correo no tiene un formato válido.');
      return;
    }
    setLoading(true);
    const { error: resetError } = await resetPassword(trimmed);
    setLoading(false);

    if (resetError) {
      setError(resetError);
      return;
    }

    setSentToEmail(trimmed);
  };

  const handleBackToSignIn = () => navigation.replace('SignIn');
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
            <AuthHero
              icon={sentToEmail ? 'mail-open-outline' : 'key-outline'}
            />
          </Animated.View>

          {/* Title */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(260)}
            style={styles.titleBlock}
          >
            <Text style={styles.eyebrow}>
              {sentToEmail ? 'CORREO ENVIADO' : 'RECUPERAR ACCESO'}
            </Text>
            <Text style={styles.title}>
              {sentToEmail ? 'Revisa tu bandeja' : '¿Olvidaste tu contraseña?'}
            </Text>
            <Text style={styles.subtitle}>
              {sentToEmail
                ? `Enviamos un enlace a ${sentToEmail}. Ábrelo desde tu correo para crear una nueva contraseña.`
                : 'Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.'}
            </Text>
          </Animated.View>

          {/* Form o instrucciones */}
          {!sentToEmail ? (
            <>
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
              </Animated.View>

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

              <Animated.View entering={FadeInUp.delay(120).duration(260)}>
                {loading ? (
                  <View style={styles.loadingWrapper}>
                    <ActivityIndicator color={theme.colors.accent[500]} />
                    <Text style={styles.loadingText}>Enviando enlace…</Text>
                  </View>
                ) : (
                  <PrimaryCTA
                    label="Enviar enlace"
                    icon="mail-outline"
                    onPress={handleSend}
                  />
                )}
              </Animated.View>
            </>
          ) : (
            <Animated.View entering={FadeInUp.delay(120).duration(260)}>
              <View
                style={[
                  styles.tipBlock,
                  {
                    backgroundColor: `${theme.colors.accent[500]}14`,
                    borderColor: `${theme.colors.accent[500]}40`,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={theme.colors.accent[400]}
                  style={{ marginTop: 1 }}
                />
                <Text style={styles.tipText}>
                  Si no ves el correo en unos minutos, revisa también la carpeta
                  de spam o promociones. El enlace expira por seguridad después
                  de un tiempo limitado.
                </Text>
              </View>

              <View style={{ height: theme.spacing.md }} />

              <PrimaryCTA
                label="Volver a iniciar sesión"
                icon="arrow-back-outline"
                trailingIcon="log-in-outline"
                onPress={handleBackToSignIn}
              />
            </Animated.View>
          )}

          {/* Link de regreso (solo si aún no envió) */}
          {!sentToEmail && (
            <Animated.View
              entering={FadeInUp.delay(120).duration(260)}
              style={[styles.linkWrapper, linkScale.animatedStyle]}
            >
              <Pressable
                onPress={handleBackToSignIn}
                onPressIn={linkScale.onPressIn}
                onPressOut={linkScale.onPressOut}
                disabled={loading}
                accessibilityRole="button"
              >
                <Text style={styles.linkText}>
                  <Text style={styles.linkTextHighlight}>← Volver</Text> a
                  iniciar sesión
                </Text>
              </Pressable>
            </Animated.View>
          )}
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
    tipBlock: {
      flexDirection: 'row',
      gap: 10,
      padding: theme.spacing.md,
      borderWidth: 1,
    },
    tipText: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: theme.type.small,
      lineHeight: 19,
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
  });
