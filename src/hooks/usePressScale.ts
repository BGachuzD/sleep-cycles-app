import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

/**
 * Spring scale on press — devuelve un animatedStyle + handlers
 * `onPressIn` / `onPressOut` para aplicar a cualquier Pressable.
 * Configuración por defecto se siente "iOS nativa" (mass 0.4, damping 14, stiffness 220).
 */
export function usePressScale(min = 0.97) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const onPressIn = () => {
    scale.value = withSpring(min, { mass: 0.4, damping: 14, stiffness: 220 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { mass: 0.4, damping: 14, stiffness: 220 });
  };
  return { animatedStyle, onPressIn, onPressOut };
}
