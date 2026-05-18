// App.tsx
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
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
import { SleepProfileScreen } from './src/screens/SleepProfileScreen';
import { SleepProfileProvider } from './src/context/SleepProfileContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { useOnboardingFlag } from './src/hooks/useOnboardingFlag';
import { SignInScreen } from './src/screens/auth/SignInScreen';
import { SignUpScreen } from './src/screens/auth/SignUpScreen';
import { NotificationsManagerScreen } from './src/screens/NotificationsManagerScreen';
import { OnboardingProvider } from './src/context/OnboardingContext';
import { useSleepProfileContext } from './src/context/SleepProfileContext';
import { SleepLogProvider } from './src/context/SleepLogContext';
import { SleepRoutineProvider } from './src/context/SleepRoutineContext';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeProvider';

export type RootStackParamList = {
  Onboarding: undefined;
  SleepNow: undefined;
  WakeAt: undefined;
  SleepProfile: { forceSetup?: boolean } | undefined;
  Notifications: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

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
  const { user, loading: authLoading } = useAuth();
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

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
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

  if (!profile) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="SleepProfile"
          component={SleepProfileScreen}
          initialParams={{ forceSetup: true }}
        />
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
                  <BottomSheetModalProvider>
                    <AppNavigation />
                  </BottomSheetModalProvider>
                </SleepRoutineProvider>
              </SleepLogProvider>
            </SleepProfileProvider>
          </OnboardingProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
