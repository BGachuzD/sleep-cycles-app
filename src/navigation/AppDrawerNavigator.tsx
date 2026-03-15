import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
  type DrawerContentComponentProps,
  DrawerNavigationProp,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '../screens/HomeScreen';
import { SleepNowScreen } from '../screens/SleepNowScreen';
import { WakeAtScreen } from '../screens/WakeAtScreen';
import { SleepProfileScreen } from '../screens/SleepProfileScreen';
import { NotificationsManagerScreen } from '../screens/NotificationsManagerScreen';
import { SleepLogScreen } from '../screens/SleepLogScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { NapScreen } from '../screens/NapScreen';
import { SleepRoutineScreen } from '../screens/SleepRoutineScreen';

import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export type AppDrawerParamList = {
  Home: undefined;
  SleepNow: undefined;
  WakeAt: undefined;
  Nap: undefined;
  SleepLog: undefined;
  Stats: undefined;
  SleepRoutine: undefined;
  SleepProfile: undefined;
  Notifications: undefined;
};

const Drawer = createDrawerNavigator<AppDrawerParamList>();

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, signOut } = useAuth();

  const displayName =
    typeof user?.user_metadata?.display_name === 'string'
      ? user.user_metadata.display_name
      : null;
  const identityLabel = displayName || user?.email || 'Usuario';
  const initials =
    identityLabel?.[0]?.toUpperCase?.() ??
    user?.id?.[0]?.toUpperCase?.() ??
    '?';

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1, backgroundColor: '#020617' }}
    >
      {/* Header del usuario */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userEmail}>{identityLabel}</Text>
          {!!displayName && !!user?.email && (
            <Text style={styles.userEmailSecondary}>{user.email}</Text>
          )}
          <Text style={styles.userSubtitle}>Ciclos de sueño</Text>
        </View>
      </View>

      {/* Lista de pantallas */}
      <View style={{ flex: 1 }}>
        <DrawerItemList {...props} />
      </View>

      {/* Botón de cerrar sesión */}
      <View style={styles.footer}>
        <DrawerItem
          label="Cerrar sesión"
          labelStyle={{ color: '#fecaca', fontSize: 14 }}
          onPress={signOut}
          style={{ borderRadius: 12 }}
        />
      </View>
    </DrawerContentScrollView>
  );
}

export const AppDrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right',
        drawerType: 'slide',
        drawerActiveTintColor: '#e5e7eb',
        drawerInactiveTintColor: '#9ca3af',
        drawerStyle: {
          backgroundColor: '#020617',
          width: 270,
        },
        drawerActiveBackgroundColor: 'rgba(99,102,241,0.15)',
        drawerItemStyle: { borderRadius: 10 },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Inicio',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="SleepNow"
        component={SleepNowScreen}
        options={{
          title: 'Dormir ahora',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="moon-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="WakeAt"
        component={WakeAtScreen}
        options={{
          title: 'Despertar a una hora',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="alarm-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Nap"
        component={NapScreen}
        options={{
          title: 'Siesta',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="bed-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="SleepLog"
        component={SleepLogScreen}
        options={{
          title: 'Diario de sueño',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="journal-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          title: 'Estadísticas',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="SleepRoutine"
        component={SleepRoutineScreen}
        options={{
          title: 'Rutina pre-sueño',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="SleepProfile"
        component={SleepProfileScreen}
        options={{
          title: 'Perfil de sueño',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsManagerScreen}
        options={{
          title: 'Notificaciones',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.2)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#f9fafb', fontWeight: '700', fontSize: 18 },
  userEmail: { color: '#e5e7eb', fontSize: 14, fontWeight: '600' },
  userEmailSecondary: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  userSubtitle: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.2)',
    paddingTop: 8,
  },
});
