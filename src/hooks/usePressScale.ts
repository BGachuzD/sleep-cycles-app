import * as Haptics from 'expo-haptics';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

/**
 * Spring scale on press — devuelve un animatedStyle + handlers
 * `onPressIn` / `onPressOut` para aplicar a cualquier Pressable.
 * Configuración por defecto se siente "iOS nativa" (mass 0.4, damping 14, stiffness 220).
 *
 * Incluye un impacto háptico ligero en el pressIn (desactivable con
 * `haptic: false` para elementos de tap repetido donde vibrar cansa).
 */
export function usePressScale(min = 0.97, opts?: { haptic?: boolean }) {
  const haptic = opts?.haptic ?? true;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const onPressIn = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    scale.value = withSpring(min, { mass: 0.4, damping: 14, stiffness: 220 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { mass: 0.4, damping: 14, stiffness: 220 });
  };
  return { animatedStyle, onPressIn, onPressOut };
}
