import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';

import { SleepNowScreen } from './src/screens/SleepNowScreen';
import { WakeAtScreen } from './src/screens/WakeAtScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { SleepProfileScreen } from './src/screens/SleepProfileScreen';
import { SleepProfileProvider } from './src/context/SleepProfileContext';
import { NotificationsManagerScreen } from './src/screens/NotificationsManagerScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  SleepNow: undefined;
  WakeAt: undefined;
  SleepProfile: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Configuración global: cómo se muestran las notificaciones cuando la app está en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  useEffect(() => {
    (async () => {
      // Pedimos permisos al arrancar
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

  return (
    <SleepProfileProvider>
      <NavigationContainer>
        <StatusBar style="light" />
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
      </NavigationContainer>
    </SleepProfileProvider>
  );
}
