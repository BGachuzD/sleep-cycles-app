import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../hooks/usePressScale';
import { useAppTheme } from '../theme/ThemeProvider';

type TabMeta = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TAB_META: Record<string, TabMeta> = {
  Inicio: { label: 'Inicio', icon: 'home-outline', iconActive: 'home' },
  Diario: { label: 'Diario', icon: 'book-outline', iconActive: 'book' },
  Progreso: {
    label: 'Progreso',
    icon: 'stats-chart-outline',
    iconActive: 'stats-chart',
  },
  Mas: {
    label: 'Más',
    icon: 'ellipsis-horizontal',
    iconActive: 'ellipsis-horizontal',
  },
};

/**
 * Barra de tabs inferior con un FAB central contextual. Las tabs reales son 4
 * (Inicio, Diario, Progreso, Más); el FAB no es una ruta, es un botón que
 * dispara la acción principal según la hora (dormir de noche / registrar de día).
 */
export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const fab = usePressScale(0.9);

  const renderTab = (routeIndex: number) => {
    const route = state.routes[routeIndex];
    if (!route) return null;
    const meta = TAB_META[route.name] ?? {
      label: route.name,
      icon: 'ellipse-outline' as const,
      iconActive: 'ellipse' as const,
    };
    const isFocused = state.index === routeIndex;
    const color = isFocused ? theme.colors.accent[500] : theme.colors.textMuted;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        style={styles.tab}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={meta.label}
      >
        <Ionicons
          name={isFocused ? meta.iconActive : meta.icon}
          size={22}
          color={color}
        />
        <Text style={[styles.label, { color }]}>{meta.label}</Text>
      </Pressable>
    );
  };

  const onFabPress = () => {
    // El botón central es el corazón de la app: la calculadora de despertar
    // inteligente ("¿a qué hora despierto si me duermo ahora?").
    const nav = navigation as unknown as {
      navigate: (name: string, params?: object) => void;
    };
    nav.navigate('Inicio', { screen: 'SmartWake' });
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom || 8,
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      {renderTab(0)}
      {renderTab(1)}

      <View style={styles.fabSlot}>
        <Animated.View style={fab.animatedStyle}>
          <Pressable
            onPress={onFabPress}
            onPressIn={fab.onPressIn}
            onPressOut={fab.onPressOut}
            accessibilityRole="button"
            accessibilityLabel="Acción rápida de sueño"
            style={[
              styles.fab,
              {
                backgroundColor: theme.colors.accent[500],
                shadowColor: theme.colors.accent[600],
                borderColor: theme.colors.surface,
              },
            ]}
          >
            <Ionicons name="alarm" size={28} color={theme.colors.white} />
          </Pressable>
        </Animated.View>
      </View>

      {renderTab(2)}
      {renderTab(3)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  fabSlot: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    marginTop: -28,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
