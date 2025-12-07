import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SleepNowScreen } from './src/screens/SleepNowScreen';
import { WakeAtScreen } from './src/screens/WakeAtScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  SleepNow: undefined;
  WakeAt: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Onboarding"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="SleepNow" component={SleepNowScreen} />
        <Stack.Screen name="WakeAt" component={WakeAtScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
