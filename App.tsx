// App.tsx
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

export type RootStackParamList = {
  Onboarding: undefined;
  SleepNow: undefined;
  WakeAt: undefined;
  SleepProfile: undefined;
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

  console.log('RootNavigator →', {
    userEmail: user?.email,
    hasSeen,
  });

  useEffect(() => {
    (async () => {
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

  if (authLoading || hasSeen === null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#020617',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color="#e5e7eb" />
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
        <Stack.Screen name="SleepNow" component={SleepNowScreen} />
        <Stack.Screen name="WakeAt" component={WakeAtScreen} />
        <Stack.Screen name="SleepProfile" component={SleepProfileScreen} />
        <Stack.Screen
          name="Notifications"
          component={NotificationsManagerScreen}
        />
      </Stack.Navigator>
    );
  }

  return <AppDrawerNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <OnboardingProvider>
          <SleepProfileProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </SleepProfileProvider>
        </OnboardingProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
