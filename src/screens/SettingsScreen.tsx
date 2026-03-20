// src/screens/SettingsScreen.tsx
import React, { FC } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme, ThemeMode } from '../theme/theme';

// ── Opción de tema ────────────────────────────────────────────────────────────
interface ThemeOptionProps {
  value: ThemeMode;
  label: string;
  description: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}

const ThemeOption: FC<ThemeOptionProps> = ({
  label,
  description,
  icon,
  selected,
  onPress,
}) => {
  const { theme } = useAppTheme();
  const styles = createOptionStyles(theme);

  return (
    <TouchableOpacity
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons
          name={icon as any}
          size={22}
          color={selected ? theme.colors.white : theme.colors.textSecondary}
        />
      </View>
      <View style={styles.optionText}>
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
          {label}
        </Text>
        <Text style={styles.optionDesc}>{description}</Text>
      </View>
      {selected && (
        <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );
};

const createOptionStyles = (theme: AppTheme) =>
  StyleSheet.create({
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    optionSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}14`,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceElevated,
    },
    iconWrapSelected: {
      backgroundColor: theme.colors.primary,
    },
    optionText: { flex: 1 },
    optionLabel: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      fontWeight: '700',
    },
    optionLabelSelected: {
      color: theme.colors.textPrimary,
    },
    optionDesc: {
      color: theme.colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
  });

// ── Pantalla principal ────────────────────────────────────────────────────────
export const SettingsScreen: FC = () => {
  const { theme, mode, setMode } = useAppTheme();
  const styles = createStyles(theme);

  const themeOptions: { value: ThemeMode; label: string; description: string; icon: string }[] = [
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <GradientBackground />
      <FloatingDrawerButton insideSafeArea />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Configuración</Text>
          <Text style={styles.subtitle}>Personaliza la apariencia de la app</Text>
        </View>

        {/* Sección tema */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tema de color</Text>
            {themeOptions.map((opt) => (
              <ThemeOption
                key={opt.value}
                {...opt}
                selected={mode === opt.value}
                onPress={() => setMode(opt.value)}
              />
            ))}
          </View>
        </Animated.View>

        {/* Preview chip */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)}>
          <View style={styles.previewRow}>
            <Ionicons
              name={theme.name === 'dark' ? 'moon' : 'sunny'}
              size={14}
              color={theme.colors.textMuted}
            />
            <Text style={styles.previewText}>
              Tema activo ahora:{' '}
              <Text style={styles.previewValue}>
                {theme.name === 'dark' ? 'Oscuro' : 'Claro'}
              </Text>
            </Text>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 40 },
    header: { marginBottom: 28 },
    title: {
      color: theme.colors.textPrimary,
      fontSize: 26,
      fontWeight: '900',
      marginBottom: 4,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    section: { marginBottom: 8 },
    sectionLabel: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 12,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    previewText: {
      color: theme.colors.textMuted,
      fontSize: 12,
    },
    previewValue: {
      color: theme.colors.textSecondary,
      fontWeight: '700',
    },
  });
