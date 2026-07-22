// src/components/HealthKitBanner/HealthKitBanner.tsx
//
// Banner que invita al usuario a conectar HealthKit. Aparece en
// SleepLogScreen y StatsScreen cuando la integración está disponible
// pero no autorizada.

import React, { FC, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import { usePressScale } from '../../hooks/usePressScale';
import { useAppTheme } from '../../theme/ThemeProvider';
import type { AppTheme } from '../../theme/theme';

interface HealthKitBannerProps {
  onConnect: () => void;
  onDismiss: () => void;
}

/**
 * Logo de Apple Health stylized: cuadrado redondeado rojo con corazón blanco.
 * Inline para no añadir un asset estático.
 */
const AppleHealthIcon: FC<{ size?: number }> = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Rect x={0} y={0} width={32} height={32} rx={7.5} ry={7.5} fill="#ff3b5c" />
    {/* Corazón blanco simplificado */}
    <Path
      d="M16 24.5
         C 16 24.5  7.5 19.2  7.5 13.4
         C 7.5 10.2  9.9 8 12.5 8
         C 14.2 8 15.4 8.9 16 10.1
         C 16.6 8.9 17.8 8 19.5 8
         C 22.1 8 24.5 10.2 24.5 13.4
         C 24.5 19.2 16 24.5 16 24.5 Z"
      fill="#ffffff"
    />
  </Svg>
);

export const HealthKitBanner: FC<HealthKitBannerProps> = ({
  onConnect,
  onDismiss,
}) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const connectScale = usePressScale(0.96);
  const dismissScale = usePressScale(0.97);

  return (
    <Animated.View entering={FadeIn.duration(240)}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconWrapper}>
            <AppleHealthIcon size={32} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.title}>Conecta con Salud</Text>
            <Text style={styles.description}>
              Importa tu sueño del Apple Watch automáticamente. Sin escribir
              nada.
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {/* CTA: Conectar */}
          <Animated.View
            style={[styles.connectWrapper, connectScale.animatedStyle]}
          >
            <Pressable
              onPress={onConnect}
              onPressIn={connectScale.onPressIn}
              onPressOut={connectScale.onPressOut}
              accessibilityRole="button"
              accessibilityLabel="Conectar con Salud"
            >
              <LinearGradient
                colors={[theme.colors.accent[500], theme.colors.accent[700]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.connectBtn}
              >
                <Text style={styles.connectText}>Conectar</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Dismiss: Ahora no */}
          <Animated.View style={dismissScale.animatedStyle}>
            <Pressable
              onPress={onDismiss}
              onPressIn={dismissScale.onPressIn}
              onPressOut={dismissScale.onPressOut}
              accessibilityRole="button"
              accessibilityLabel="Ahora no"
              style={styles.dismissBtn}
            >
              <Text style={styles.dismissText}>Ahora no</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconWrapper: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textCol: { flex: 1, gap: 4 },
    title: {
      color: theme.colors.textPrimary,
      fontSize: theme.type.subhead,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    description: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.small,
      lineHeight: 18,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    connectWrapper: { flex: 1 },
    connectBtn: {
      height: 40,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    connectText: {
      color: '#ffffff',
      fontSize: theme.type.body,
      fontWeight: '700',
    },
    dismissBtn: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    dismissText: {
      color: theme.colors.textMuted,
      fontSize: theme.type.body,
      fontWeight: '700',
    },
  });
