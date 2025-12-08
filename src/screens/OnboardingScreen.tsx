import React, { FC, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useDerivedValue,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '../components/GradientBackground';
import { useOnboardingFlag } from '../hooks/useOnboardingFlag';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    key: '1',
    title: 'Mejores despertares',
    description:
      'Te sugerimos a qué hora despertar para salir de un ciclo de sueño ligero, no desde lo más profundo.',
    emoji: '😴',
  },
  {
    key: '2',
    title: 'Ciclos, no solo horas',
    description:
      'Basado en ciclos de 90 minutos + tiempo para conciliar el sueño, para que tu descanso se sienta más natural.',
    emoji: '🌀',
  },
  {
    key: '3',
    title: 'Diseñada para la noche',
    description:
      'Animaciones suaves, modo oscuro y una UI pensada para usarse con calma antes de dormir.',
    emoji: '🌌',
  },
];

const DOT_SIZE = 8;
const PADDING_H = 28;

// --- Componente auxiliar: Indicador de Dots ---
const DotIndicator: FC<{
  scrollX: any;
  index: number;
}> = ({ scrollX, index }) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolation.CLAMP,
    );

    const dotWidth = interpolate(
      scrollX.value,
      inputRange,
      [DOT_SIZE, DOT_SIZE * 3, DOT_SIZE],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      width: dotWidth,
      backgroundColor: '#818cf8',
    };
  });

  return <Animated.View style={[styles.dot, animatedDotStyle]} />;
};

// --- Componente auxiliar: Flecha de Deslizamiento (Solo en la primera diapositiva) ---
const SwipeIndicator: FC<{ scrollX: any }> = ({ scrollX }) => {
  const arrowTranslateX = useSharedValue(0);

  useEffect(() => {
    arrowTranslateX.value = withRepeat(
      withTiming(8, { duration: 800 }),
      -1,
      true,
    );
  }, [arrowTranslateX]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [0, width * 0.2],
      [1, 0],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [{ translateX: arrowTranslateX.value }],
    };
  });

  return (
    <Animated.View style={[styles.swipeIndicatorContainer, animatedStyle]}>
      <Text style={styles.swipeIndicatorText}>Desliza</Text>
      <Text style={styles.swipeIndicatorText}>→</Text>
    </Animated.View>
  );
};

export const OnboardingScreen: FC<Props> = ({ navigation }) => {
  const scrollX = useSharedValue(0);
  const { markAsSeen } = useOnboardingFlag();

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleStart = async () => {
    await markAsSeen();
    navigation.replace('SleepNow');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.flex}>
        <GradientBackground />

        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          {SLIDES.map((slide, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];

            const animatedSlideStyle = useAnimatedStyle(() => {
              const translateY = interpolate(
                scrollX.value,
                inputRange,
                [40, 0, 40],
                Extrapolation.CLAMP,
              );
              const opacity = interpolate(
                scrollX.value,
                inputRange,
                [0.4, 1, 0.4],
                Extrapolation.CLAMP,
              );

              return {
                transform: [{ translateY }],
                opacity,
              };
            });

            const isLast = index === SLIDES.length - 1;

            return (
              <View key={slide.key} style={{ width }}>
                <View style={styles.slideInner}>
                  <Animated.View
                    style={[styles.emojiWrapper, animatedSlideStyle]}
                  >
                    <Text style={styles.emoji}>{slide.emoji}</Text>
                  </Animated.View>

                  <Animated.View style={animatedSlideStyle}>
                    <Text style={styles.title}>{slide.title}</Text>
                    <Text style={styles.description}>{slide.description}</Text>
                  </Animated.View>

                  {/* Indicador de flecha solo en la primera slide */}
                  {index === 0 && <SwipeIndicator scrollX={scrollX} />}

                  {/* Botón de Comenzar: MOVIDO DENTRO DE LA ÚLTIMA SLIDE */}
                  {isLast && (
                    <TouchableOpacity
                      style={styles.startButton}
                      activeOpacity={0.9}
                      onPress={handleStart}
                    >
                      <Text style={styles.startButtonText}>Comenzar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </Animated.ScrollView>

        {/* Footer Fijo para los Dots (siempre visible, sin animación de opacidad/translate) */}
        <View style={styles.dotsFooter}>
          {/* Indicadores de Dots */}
          <View style={styles.dotsContainer}>
            {SLIDES.map((_, index) => (
              <DotIndicator key={index} scrollX={scrollX} index={index} />
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    // Aseguramos que haya espacio para el footer de puntos en la parte inferior
    paddingBottom: DOT_SIZE * 8,
    flexGrow: 1,
  },
  slideInner: {
    flex: 1,
    paddingTop: height * 0.12,
    paddingHorizontal: PADDING_H,
    alignItems: 'center',
  },
  // --- Swipe Indicator ---
  swipeIndicatorContainer: {
    position: 'absolute',
    bottom: height * 0.1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(99,102,241,0.1)',
  },
  swipeIndicatorText: {
    color: '#a5b4fc',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  // --- Elementos de la Slide ---
  emojiWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(129,140,248,0.7)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
      },
    }),
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    color: '#f9fafb',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    color: '#cbd5f5',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: 10,
  },
  // --- Botón de Comenzar (Se renderiza dentro de la slide) ---
  startButton: {
    marginTop: 40,
    width: width - PADDING_H * 2, // Ancho de la diapositiva menos padding
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '700',
  },
  // --- Footer Fijo SÓLO para los Dots ---
  dotsFooter: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 10, // Ajuste para SafeArea
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: PADDING_H,
    // No necesita fondo, solo los dots
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginHorizontal: 4,
  },
});
