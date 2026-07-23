import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { FC } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '../components/GradientBackground';
import { ListItem } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { navigateToScreen } from '../navigation/navigateTo';
import { useTabBarContentPadding } from '../navigation/tabBarLayout';
import type { AppTheme } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeProvider';

type RowDef = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
};

const TOOLS: RowDef[] = [
  { icon: 'moon-outline', label: 'Dormir ahora', route: 'SleepNow' },
  { icon: 'alarm-outline', label: 'Despertar a una hora', route: 'WakeAt' },
  { icon: 'bed-outline', label: 'Siesta', route: 'Nap' },
  { icon: 'list-outline', label: 'Rutina pre-sueño', route: 'SleepRoutine' },
];

const ACCOUNT: RowDef[] = [
  {
    icon: 'person-circle-outline',
    label: 'Perfil de sueño',
    route: 'SleepProfile',
  },
  {
    icon: 'notifications-outline',
    label: 'Notificaciones',
    route: 'Notifications',
  },
  { icon: 'settings-outline', label: 'Configuración', route: 'Settings' },
];

const Row: FC<{
  def: RowDef;
  onPress: () => void;
}> = ({ def, onPress }) => (
  <ListItem title={def.label} icon={def.icon} onPress={onPress} />
);

export const MoreScreen: FC = () => {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const { theme } = useAppTheme();
  const styles2 = React.useMemo(() => createStyles(theme), [theme]);
  const bottomContentPadding = useTabBarContentPadding();

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email ??
    'Usuario';

  const go = (route: string) => navigateToScreen(navigation, route);

  return (
    <SafeAreaView style={styles2.container} edges={['top', 'left', 'right']}>
      <GradientBackground />
      <ScrollView
        style={styles2.scroll}
        contentContainerStyle={[
          styles2.content,
          { paddingBottom: bottomContentPadding },
        ]}
        scrollIndicatorInsets={{ bottom: bottomContentPadding }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(260)} style={styles2.hero}>
          <Text style={styles2.heroEyebrow}>MÁS</Text>
          <Text style={styles2.heroTitle}>Hola, {displayName}</Text>
          <Text style={styles2.heroSubtitle}>
            Herramientas, tu cuenta y ajustes.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).duration(260)}>
          <Text style={styles2.sectionEyebrow}>HERRAMIENTAS</Text>
          <View style={styles2.list}>
            {TOOLS.map((def) => (
              <Row key={def.route} def={def} onPress={() => go(def.route)} />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).duration(260)}>
          <Text style={styles2.sectionEyebrow}>CUENTA</Text>
          <View style={styles2.list}>
            {ACCOUNT.map((def) => (
              <Row key={def.route} def={def} onPress={() => go(def.route)} />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).duration(260)}>
          <Pressable
            onPress={signOut}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            style={[
              styles2.signOut,
              {
                borderColor: `${theme.colors.danger}40`,
                backgroundColor: `${theme.colors.danger}14`,
                borderRadius: theme.radius.lg,
              },
            ]}
          >
            <Ionicons
              name="log-out-outline"
              size={18}
              color={theme.colors.danger}
            />
            <Text style={[styles2.signOutText, { color: theme.colors.danger }]}>
              Cerrar sesión
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1 },
    content: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.huge + theme.spacing.md,
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
      fontWeight: '700',
      letterSpacing: -0.5,
      marginTop: 4,
    },
    heroSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      marginTop: 6,
    },
    sectionEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
      marginBottom: 8,
    },
    list: { gap: theme.spacing.sm },
    signOut: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderWidth: 1,
      marginTop: theme.spacing.sm,
    },
    signOutText: { fontSize: theme.type.body, fontWeight: '700' },
  });
