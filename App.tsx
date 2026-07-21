// App.tsx
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import { useEffect } from 'react';
import { ActivityIndicator, Linking, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  NavigationContainer,
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { AppDrawerNavigator } from './src/navigation/AppDrawerNavigator';
import { SleepNowScreen } from './src/screens/SleepNowScreen';
import { WakeAtScreen } from './src/screens/WakeAtScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ProfileSetupScreen } from './src/screens/ProfileSetupScreen';
import { SleepProfileScreen } from './src/screens/SleepProfileScreen';
import { SleepProfileProvider } from './src/context/SleepProfileContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { useOnboardingFlag } from './src/hooks/useOnboardingFlag';
import { SignInScreen } from './src/screens/auth/SignInScreen';
import { SignUpScreen } from './src/screens/auth/SignUpScreen';
import { ForgotPasswordScreen } from './src/screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from './src/screens/auth/ResetPasswordScreen';
import { NotificationsManagerScreen } from './src/screens/NotificationsManagerScreen';
import { supabase } from './src/lib/supabaseClient';
import { OnboardingProvider } from './src/context/OnboardingContext';
import { useSleepProfileContext } from './src/context/SleepProfileContext';
import { SleepLogProvider } from './src/context/SleepLogContext';
import { SleepRoutineProvider } from './src/context/SleepRoutineContext';
import { HealthKitProvider } from './src/hooks/useHealthKit';
import { scheduleDailyLogReminder } from './src/notifications/scheduler';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeProvider';

export type RootStackParamList = {
  Onboarding: undefined;
  ProfileSetup: undefined;
  SleepNow: undefined;
  WakeAt: undefined;
  SleepProfile: { forceSetup?: boolean } | undefined;
  Notifications: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
};

/**
 * Parsea los tokens de un deep link de Supabase. Supabase los pone en el
 * URL fragment (#) tras `redirectTo` en `resetPasswordForEmail`.
 *
 * Ej: mimebien://reset-password#access_token=XXX&refresh_token=YYY&type=recovery
 */
function parseSupabaseDeepLink(url: string): {
  accessToken?: string;
  refreshToken?: string;
  type?: string;
} {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return {};
  const hash = url.substring(hashIndex + 1);
  const params = new URLSearchParams(hash);
  return {
    accessToken: params.get('access_token') ?? undefined,
    refreshToken: params.get('refresh_token') ?? undefined,
    type: params.get('type') ?? undefined,
  };
}

const Stack = createNativeStackNavigator<RootStackParamList>();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootNavigator() {
  const {
    user,
    loading: authLoading,
    isInPasswordRecovery,
    enterPasswordRecovery,
  } = useAuth();
  const { hasSeen } = useOnboardingFlag();
  const { profile, loading: profileLoading } = useSleepProfileContext();
  const { theme } = useAppTheme();

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('sleep-reminders', {
          name: 'Sleep reminders',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permisos de notificación no concedidos');
      }
    })();
  }, []);

  // ─────────────────────────────────────────────
  // Recordatorio diario de registro: ~30 min después de la hora de despertar
  // del perfil. Se reprograma solo si cambia la hora (clave única en el
  // scheduler reemplaza el anterior).
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!user || !profile) return;
    const totalMinutes =
      (profile.wakeHour ?? 8) * 60 + (profile.wakeMinute ?? 0) + 30;
    scheduleDailyLogReminder({
      hour: Math.floor(totalMinutes / 60) % 24,
      minute: totalMinutes % 60,
    });
  }, [user, profile]);

  // ─────────────────────────────────────────────
  // Deep link listener: captura URLs del esquema `mimebien://` y, si vienen
  // con tokens de Supabase (recuperación de contraseña), establece la sesión
  // y marca el flujo de recovery para que el navigator muestre ResetPassword
  // en vez del flujo normal.
  // ─────────────────────────────────────────────
  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) return;
      const { accessToken, refreshToken, type } = parseSupabaseDeepLink(url);
      if (type === 'recovery' && accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          console.warn('setSession from deep link failed', error);
          return;
        }
        enterPasswordRecovery();
      }
    };

    // App ya abierta cuando llega el link
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    // App cerrada y se abre desde el link
    Linking.getInitialURL().then(handleUrl);

    return () => sub.remove();
  }, [enterPasswordRecovery]);

  if (authLoading || hasSeen === null || profileLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color={theme.colors.textPrimary} />
      </View>
    );
  }

  // Flujo de recuperación de contraseña: tiene prioridad sobre todo lo demás.
  // El usuario acaba de tap en el enlace del correo, la sesión está establecida
  // pero queremos forzarlo a definir nueva contraseña antes de continuar.
  if (isInPasswordRecovery) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      </Stack.Navigator>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      </Stack.Navigator>
    );
  }

  if (!hasSeen) {
    return (
      <Stack.Navigator
        initialRouteName="Onboarding"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="WakeAt" component={WakeAtScreen} />
        <Stack.Screen name="SleepNow" component={SleepNowScreen} />
        <Stack.Screen name="SleepProfile" component={SleepProfileScreen} />
        <Stack.Screen
          name="Notifications"
          component={NotificationsManagerScreen}
        />
      </Stack.Navigator>
    );
  }

  // Usuario nuevo sin perfil: stepper obligatorio antes de entrar a la app.
  if (!profile) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      </Stack.Navigator>
    );
  }

  return <AppDrawerNavigator />;
}

function AppNavigation() {
  const { theme } = useAppTheme();

  const navigationTheme =
    theme.name === 'dark'
      ? {
          ...NavigationDarkTheme,
          colors: {
            ...NavigationDarkTheme.colors,
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.textPrimary,
            border: theme.colors.border,
            primary: theme.colors.primary,
          },
        }
      : {
          ...NavigationDefaultTheme,
          colors: {
            ...NavigationDefaultTheme.colors,
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.textPrimary,
            border: theme.colors.border,
            primary: theme.colors.primary,
          },
        };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <OnboardingProvider>
            <SleepProfileProvider>
              <SleepLogProvider>
                <SleepRoutineProvider>
                  <HealthKitProvider>
                    <BottomSheetModalProvider>
                      <AppNavigation />
                    </BottomSheetModalProvider>
                  </HealthKitProvider>
                </SleepRoutineProvider>
              </SleepLogProvider>
            </SleepProfileProvider>
          </OnboardingProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
