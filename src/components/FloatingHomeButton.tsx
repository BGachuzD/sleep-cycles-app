import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/ThemeProvider';

interface Props {
  insideSafeArea?: boolean;
}

/**
 * Botón flotante de "atrás" (esquina superior izquierda).
 *
 * Solo se muestra cuando la pantalla fue EMPUJADA sobre su stack (index > 0);
 * en las raíces de tab devuelve null. Antes navegaba a 'Home' y eso fallaba al
 * presionarlo desde ciertos lugares tras la migración a tabs. Ahora usa
 * `goBack()`, que siempre es válido cuando el botón es visible.
 *
 * Conserva el nombre por compatibilidad con las pantallas que ya lo renderizan.
 */
export const FloatingHomeButton: React.FC<Props> = ({
  insideSafeArea = false,
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const topOffset = insets.top + (insideSafeArea ? 8 : 12);

  const state = navigation.getState();
  const canPop = state?.type === 'stack' && state.index > 0;
  if (!canPop) return null;

  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Volver"
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
      <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
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
