import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FloatingActionButton } from '../components/ui';
import { usePressScale } from '../hooks/usePressScale';
import type { AppTheme } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeProvider';
import {
  TAB_BAR_BOTTOM_OFFSET,
  TAB_BAR_HEIGHT,
  TAB_BAR_TOP_PADDING,
} from './tabBarLayout';

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

function TabButton({
  meta,
  focused,
  onPress,
  theme,
}: {
  meta: TabMeta;
  focused: boolean;
  onPress: () => void;
  theme: AppTheme;
}) {
  const press = usePressScale(theme.motion.pressScale, { haptic: false });
  const color = focused ? theme.colors.textPrimary : theme.colors.textMuted;

  return (
    <Animated.View style={[styles.tabSlot, press.animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={styles.tab}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={meta.label}
      >
        <View
          style={[
            styles.iconPill,
            focused && {
              backgroundColor: `${theme.colors.primary}1F`,
              borderColor: `${theme.colors.primary}30`,
            },
          ]}
        >
          <Ionicons
            name={focused ? meta.iconActive : meta.icon}
            size={21}
            color={focused ? theme.colors.accent[400] : color}
          />
        </View>
        <Text style={[styles.label, { color }]}>{meta.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const renderTab = (routeIndex: number) => {
    const route = state.routes[routeIndex];
    if (!route) return null;
    const meta = TAB_META[route.name] ?? {
      label: route.name,
      icon: 'ellipse-outline' as const,
      iconActive: 'ellipse' as const,
    };
    const focused = state.index === routeIndex;
    return (
      <TabButton
        key={route.key}
        meta={meta}
        focused={focused}
        theme={theme}
        onPress={() => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented)
            navigation.navigate(route.name);
        }}
      />
    );
  };

  const onFabPress = () => {
    const nav = navigation as unknown as {
      navigate: (name: string, params?: object) => void;
    };
    nav.navigate('Inicio', { screen: 'SmartWake' });
  };

  return (
    <View
      style={{
        backgroundColor: theme.colors.background,
        bottom: 0,
        left: 0,
        paddingBottom: Math.max(insets.bottom, TAB_BAR_BOTTOM_OFFSET),
        paddingHorizontal: theme.spacing.md,
        paddingTop: TAB_BAR_TOP_PADDING,
        position: 'absolute',
        right: 0,
        zIndex: 100,
      }}
    >
      <View
        style={[
          styles.bar,
          {
            backgroundColor: `${theme.colors.surfaceElevated}F5`,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.xl,
            boxShadow: theme.shadows.floating,
          },
        ]}
      >
        {renderTab(0)}
        {renderTab(1)}
        <View style={styles.fabSlot}>
          <FloatingActionButton
            icon="alarm"
            label="Acción rápida de sueño"
            onPress={onFabPress}
            size={60}
            style={{ marginTop: -28 }}
          />
        </View>
        {renderTab(2)}
        {renderTab(3)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: TAB_BAR_HEIGHT,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  tabSlot: { flex: 1 },
  tab: {
    alignItems: 'center',
    gap: 2,
    justifyContent: 'center',
    minHeight: 52,
  },
  iconPill: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 42,
  },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 0.1 },
  fabSlot: { alignItems: 'center', justifyContent: 'center', width: 66 },
});
