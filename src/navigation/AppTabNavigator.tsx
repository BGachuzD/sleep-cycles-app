import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/HomeScreen';
import { SleepNowScreen } from '../screens/SleepNowScreen';
import { WakeAtScreen } from '../screens/WakeAtScreen';
import { NapScreen } from '../screens/NapScreen';
import { SleepRoutineScreen } from '../screens/SleepRoutineScreen';
import { SleepLogScreen } from '../screens/SleepLogScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { SleepProfileScreen } from '../screens/SleepProfileScreen';
import { NotificationsManagerScreen } from '../screens/NotificationsManagerScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { DeleteAccountScreen } from '../screens/DeleteAccountScreen';
import { CustomTabBar } from './CustomTabBar';

// Un único factory de native-stack reutilizado por cada tab. Cada tab es un
// stack para que las pantallas puedan hacer push (con swipe-back de iOS gratis).
const Stack = createNativeStackNavigator();

function InicioStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="SleepNow" component={SleepNowScreen} />
      <Stack.Screen name="WakeAt" component={WakeAtScreen} />
      <Stack.Screen name="Nap" component={NapScreen} />
      <Stack.Screen name="SleepRoutine" component={SleepRoutineScreen} />
    </Stack.Navigator>
  );
}

function DiarioStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SleepLog" component={SleepLogScreen} />
    </Stack.Navigator>
  );
}

function ProgresoStack() {
  // Por ahora apunta a StatsScreen; en la Fase B se reemplaza por la pantalla
  // Progreso rica (feed de insights, racha, logros, tendencias).
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Stats" component={StatsScreen} />
    </Stack.Navigator>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Mas" component={MoreScreen} />
      <Stack.Screen name="SleepProfile" component={SleepProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsManagerScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
    </Stack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export const AppTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Inicio" component={InicioStack} />
      <Tab.Screen name="Diario" component={DiarioStack} />
      <Tab.Screen name="Progreso" component={ProgresoStack} />
      <Tab.Screen name="Mas" component={MoreStack} />
    </Tab.Navigator>
  );
};
