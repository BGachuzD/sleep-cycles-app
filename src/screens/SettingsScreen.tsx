// src/screens/SettingsScreen.tsx
import React, { FC, useMemo } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { usePressScale } from '../hooks/usePressScale';
import { useAppTheme } from '../theme/ThemeProvider';
import { resolveAutoThemeByHour } from '../theme/theme';
import type { AppTheme, ThemeMode } from '../theme/theme';

// URLs placeholder — actualizar cuando exista la landing definitiva.
const LANDING_URL = 'https://sleepcycles.app';
const PRIVACY_URL = 'https://sleepcycles.app/privacy';
const TERMS_URL = 'https://sleepcycles.app/terms';

// ─────────────────────────────────────────────
// ThemeOption
// ─────────────────────────────────────────────
const ThemeOption: FC<{
  value: ThemeMode;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ label, description, icon, selected, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          optionStyles.option,
          {
            backgroundColor: selected
              ? `${theme.colors.accent[500]}14`
              : theme.colors.surface,
            borderColor: selected
              ? theme.colors.accent[500]
              : theme.colors.border,
            borderWidth: selected ? 1.5 : 1,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <View
          style={[
            optionStyles.iconCircle,
            {
              backgroundColor: selected
                ? theme.colors.accent[500]
                : `${theme.colors.accent[500]}1F`,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={selected ? theme.colors.white : theme.colors.accent[400]}
          />
        </View>

        <View style={optionStyles.textCol}>
          <Text
            style={[
              optionStyles.label,
              {
                color: selected
                  ? theme.colors.textPrimary
                  : theme.colors.textSecondary,
                fontSize: theme.type.bodyLarge,
              },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              optionStyles.description,
              { color: theme.colors.textMuted, fontSize: theme.type.small },
            ]}
          >
            {description}
          </Text>
        </View>

        {selected && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={theme.colors.accent[400]}
          />
        )}
      </Pressable>
    </Animated.View>
  );
};

const optionStyles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  label: { fontWeight: '800' },
  description: { lineHeight: 17, marginTop: 2 },
});

// ─────────────────────────────────────────────
// LinkRow para legal y externos
// ─────────────────────────────────────────────
const LinkRow: FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  external?: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ icon, label, hint, external, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          linkStyles.row,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <View
          style={[
            linkStyles.iconCircle,
            { backgroundColor: `${theme.colors.accent[500]}1A` },
          ]}
        >
          <Ionicons name={icon} size={16} color={theme.colors.accent[400]} />
        </View>
        <View style={linkStyles.textCol}>
          <Text
            style={[
              linkStyles.label,
              { color: theme.colors.textPrimary, fontSize: theme.type.body },
            ]}
          >
            {label}
          </Text>
          {hint && (
            <Text
              style={[
                linkStyles.hint,
                { color: theme.colors.textMuted, fontSize: theme.type.caption },
              ]}
            >
              {hint}
            </Text>
          )}
        </View>
        <Ionicons
          name={external ? 'open-outline' : 'chevron-forward'}
          size={16}
          color={theme.colors.textMuted}
        />
      </Pressable>
    </Animated.View>
  );
};

const linkStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 2 },
  label: { fontWeight: '700' },
  hint: { fontWeight: '600' },
});

// ─────────────────────────────────────────────
// SettingsScreen
// ─────────────────────────────────────────────
export const SettingsScreen: FC = () => {
  const { theme, mode, setMode } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const themeOptions: Array<{
    value: ThemeMode;
    label: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    {
      value: 'auto',
      label: 'Automático',
      description: 'Claro de 7am a 7pm · Oscuro el resto',
      icon: 'partly-sunny-outline',
    },
    {
      value: 'light',
      label: 'Claro',
      description: 'Siempre tema claro',
      icon: 'sunny-outline',
    },
    {
      value: 'dark',
      label: 'Oscuro',
      description: 'Siempre tema oscuro',
      icon: 'moon-outline',
    },
  ];

  const resolvedFromAuto = mode === 'auto' ? resolveAutoThemeByHour() : null;
  const activeThemeName = theme.name === 'dark' ? 'Oscuro' : 'Claro';

  const openExternal = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'No se pudo abrir el enlace',
        'Verifica tu conexión a internet o inténtalo más tarde.',
      );
    });
  };

  const openPremium = () => {
    Alert.alert(
      'Sleep Cycles Premium',
      'Próximamente. Estamos preparando funciones avanzadas, sincronización extendida y análisis profundo para suscriptores.',
      [{ text: 'Entendido', style: 'default' }],
    );
  };

  const premiumScale = usePressScale(0.97);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <GradientBackground />
      <FloatingDrawerButton insideSafeArea />
      <FloatingHomeButton insideSafeArea />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
          <Text style={styles.heroEyebrow}>CONFIGURACIÓN</Text>
          <Text style={styles.heroTitle}>Apariencia y cuenta</Text>
          <Text style={styles.heroSubtitle}>
            Personaliza la app, gestiona tu plan y revisa nuestros términos.
          </Text>
        </Animated.View>

        {/* Premium hero */}
        <Animated.View
          entering={FadeInUp.delay(60).duration(500)}
          style={premiumScale.animatedStyle}
        >
          <Pressable
            onPress={openPremium}
            onPressIn={premiumScale.onPressIn}
            onPressOut={premiumScale.onPressOut}
            accessibilityRole="button"
            accessibilityLabel="Conocer Sleep Cycles Premium"
          >
            <LinearGradient
              colors={[theme.colors.accent[500], theme.colors.accent[700]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.premiumCard,
                {
                  borderRadius: theme.radius.xl,
                  shadowColor: theme.colors.accent[600],
                },
              ]}
            >
              <View style={styles.premiumTopRow}>
                <View style={styles.premiumBadge}>
                  <Ionicons
                    name="sparkles"
                    size={11}
                    color={theme.colors.accent[700]}
                  />
                  <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                </View>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={theme.colors.white}
                />
              </View>
              <Text style={styles.premiumTitle}>
                Lleva tu sueño al siguiente nivel
              </Text>
              <Text style={styles.premiumSubtitle}>
                Análisis profundo, sincronización extendida y funciones
                exclusivas para suscriptores.
              </Text>
              <View style={styles.premiumPillsRow}>
                <View style={styles.premiumPill}>
                  <Ionicons
                    name="analytics-outline"
                    size={12}
                    color={theme.colors.white}
                  />
                  <Text style={styles.premiumPillText}>Análisis avanzado</Text>
                </View>
                <View style={styles.premiumPill}>
                  <Ionicons
                    name="cloud-outline"
                    size={12}
                    color={theme.colors.white}
                  />
                  <Text style={styles.premiumPillText}>
                    Historial ilimitado
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Preview tema activo */}
        <Animated.View entering={FadeInUp.delay(120).duration(500)}>
          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.xl,
              },
            ]}
          >
            <View
              style={[
                styles.previewIconCircle,
                { backgroundColor: `${theme.colors.accent[500]}1F` },
              ]}
            >
              <Ionicons
                name={theme.name === 'dark' ? 'moon' : 'sunny'}
                size={22}
                color={theme.colors.accent[400]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewEyebrow}>TEMA ACTIVO</Text>
              <Text style={styles.previewName}>{activeThemeName}</Text>
              {mode === 'auto' && resolvedFromAuto && (
                <Text style={styles.previewSubtitle}>
                  resuelto desde modo automático
                </Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Sección tema */}
        <Animated.View entering={FadeInUp.delay(180).duration(500)}>
          <Text style={styles.sectionEyebrow}>TEMA DE COLOR</Text>
          <View style={styles.optionsList}>
            {themeOptions.map((opt) => (
              <ThemeOption
                key={opt.value}
                {...opt}
                selected={mode === opt.value}
                onPress={() => setMode(opt.value)}
                theme={theme}
              />
            ))}
          </View>
        </Animated.View>

        {/* Sección Legal y enlaces */}
        <Animated.View entering={FadeInUp.delay(260).duration(500)}>
          <Text style={styles.sectionEyebrow}>LEGAL Y ENLACES</Text>
          <View style={styles.optionsList}>
            <LinkRow
              icon="globe-outline"
              label="Sitio web"
              hint="mimebien.com"
              external
              onPress={() => openExternal(LANDING_URL)}
              theme={theme}
            />
            <LinkRow
              icon="document-text-outline"
              label="Términos y condiciones"
              external
              onPress={() => openExternal(TERMS_URL)}
              theme={theme}
            />
            <LinkRow
              icon="shield-checkmark-outline"
              label="Política de privacidad"
              external
              onPress={() => openExternal(PRIVACY_URL)}
              theme={theme}
            />
          </View>
        </Animated.View>

        <View style={{ height: theme.spacing.huge }} />
      </ScrollView>
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
      fontWeight: '900',
      letterSpacing: -0.5,
      marginTop: 4,
    },
    heroSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      lineHeight: 20,
      marginTop: 6,
    },
    // Premium
    premiumCard: {
      padding: theme.spacing.xl,
      gap: 10,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 6,
    },
    premiumTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    premiumBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255,255,255,0.95)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    premiumBadgeText: {
      color: theme.colors.accent[700],
      fontSize: theme.type.caption,
      fontWeight: '900',
      letterSpacing: 0.8,
    },
    premiumTitle: {
      color: '#ffffff',
      fontSize: theme.type.title3,
      fontWeight: '900',
      letterSpacing: -0.3,
      marginTop: 4,
    },
    premiumSubtitle: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: theme.type.small,
      lineHeight: 18,
    },
    premiumPillsRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
      flexWrap: 'wrap',
    },
    premiumPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderColor: 'rgba(255,255,255,0.28)',
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
    },
    premiumPillText: {
      color: '#ffffff',
      fontSize: theme.type.caption,
      fontWeight: '700',
    },
    // Preview tema
    previewCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: theme.spacing.lg,
      borderWidth: 1,
    },
    previewIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    previewName: {
      color: theme.colors.heroText,
      fontSize: theme.type.title3,
      fontWeight: '900',
      letterSpacing: -0.5,
      marginTop: 2,
    },
    previewSubtitle: {
      color: theme.colors.textMuted,
      fontSize: theme.type.caption,
      fontWeight: '600',
      marginTop: 2,
    },
    sectionEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
      marginBottom: 8,
    },
    optionsList: { gap: theme.spacing.sm },
  });
