import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { AppDrawerParamList } from '../navigation/AppDrawerNavigator';
import { Ionicons } from '@expo/vector-icons';

export const FloatingDrawerButton: React.FC = () => {
  const navigation = useNavigation<DrawerNavigationProp<AppDrawerParamList>>();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <TouchableOpacity
        onPress={openDrawer}
        activeOpacity={0.9}
        style={styles.button}
      >
        <Ionicons name="menu" size={24} color="#e5e7eb" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 5,
    left: 5,
    pointerEvents: 'box-none',
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  icon: {
    color: '#f9fafb',
    fontSize: 24,
    fontWeight: '700',
  },
});
