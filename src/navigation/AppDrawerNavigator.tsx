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

import { SleepNowScreen } from '../screens/SleepNowScreen';
import { WakeAtScreen } from '../screens/WakeAtScreen';
import { SleepProfileScreen } from '../screens/SleepProfileScreen';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export type AppDrawerParamList = {
  SleepNow: undefined;
  WakeAt: undefined;
  SleepProfile: undefined;
};

const Drawer = createDrawerNavigator<AppDrawerParamList>();

const HeaderMenuButton = () => {
  const navigation = useNavigation<DrawerNavigationProp<AppDrawerParamList>>();

  return (
    <TouchableOpacity
      style={{ marginLeft: 16 }}
      onPress={() => navigation.openDrawer()}
    >
      <Ionicons name="moon" size={32} color="#f9fafb" />;
    </TouchableOpacity>
  );
};

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, signOut } = useAuth();

  const email = user?.email ?? 'Usuario';
  const initials =
    user?.email?.[0]?.toUpperCase?.() ?? user?.id?.[0]?.toUpperCase?.() ?? '?';

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
          <Text style={styles.userEmail}>{email}</Text>
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
        headerStyle: {
          backgroundColor: '#020617',
        },
        headerTintColor: '#e5e7eb',
        headerLeft: () => <HeaderMenuButton />,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 16,
        },
        drawerType: 'slide',
        drawerActiveTintColor: '#e5e7eb',
        drawerInactiveTintColor: '#9ca3af',
        drawerStyle: {
          backgroundColor: '#020617',
          width: 260,
        },
      }}
    >
      <Drawer.Screen
        name="SleepNow"
        component={SleepNowScreen}
        options={{
          title: 'Dormir ahora',
        }}
      />
      <Drawer.Screen
        name="WakeAt"
        component={WakeAtScreen}
        options={{
          title: 'Despertar a una hora',
        }}
      />
      <Drawer.Screen
        name="SleepProfile"
        component={SleepProfileScreen}
        options={{
          title: 'Perfil de sueño',
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
  avatarText: {
    color: '#f9fafb',
    fontWeight: '700',
    fontSize: 18,
  },
  userEmail: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
  },
  userSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.2)',
    paddingTop: 8,
  },
});
