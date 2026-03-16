import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppDrawerParamList } from '../navigation/AppDrawerNavigator';
import { useAppTheme } from '../theme/ThemeProvider';

interface Props {
  insideSafeArea?: boolean;
}

export const FloatingHomeButton: React.FC<Props> = ({
  insideSafeArea = false,
}) => {
  const navigation = useNavigation<DrawerNavigationProp<AppDrawerParamList>>();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const topOffset = insets.top + (insideSafeArea ? 8 : 12);

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Home')}
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
      <Ionicons name="home-outline" size={20} color={theme.colors.textPrimary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: 16,
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
