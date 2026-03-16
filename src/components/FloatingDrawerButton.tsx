import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { AppDrawerParamList } from '../navigation/AppDrawerNavigator';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/ThemeProvider';

interface Props {
  /** true cuando el componente ya está dentro de un SafeAreaView con edge top */
  insideSafeArea?: boolean;
}

export const FloatingDrawerButton: React.FC<Props> = ({
  insideSafeArea = false,
}) => {
  const navigation = useNavigation<DrawerNavigationProp<AppDrawerParamList>>();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  // Siempre respetamos el inset superior para evitar superponer la status bar.
  const topOffset = insets.top + (insideSafeArea ? 8 : 12);

  return (
    <TouchableOpacity
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      activeOpacity={0.85}
      style={[
        styles.button,
        {
          top: topOffset,
          backgroundColor: `${theme.colors.surface}EB`,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.black,
        },
      ]}
    >
      <Ionicons name="menu" size={22} color={theme.colors.textPrimary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: { elevation: 6 },
    }),
  },
});
