import React, { FC } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
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

export const OnboardingScreen: FC<Props> = ({ navigation }) => {
  const scrollX = useSharedValue(0);
  const { markAsSeen } = useOnboardingFlag();

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleStart = async () => {
    await markAsSeen(); // Guardar AsyncStorage
    navigation.replace('SleepNow');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <GradientBackground />

        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
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
      </View>
    </SafeAreaView>
  );
};

const PADDING_H = 28;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  slideInner: {
    flex: 1,
    paddingTop: height * 0.12,
    paddingHorizontal: PADDING_H,
    justifyContent: 'flex-start',
  },
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
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    color: '#f9fafb',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    color: '#cbd5f5',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    opacity: 0.9,
  },
  startButton: {
    marginTop: 40,
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '700',
  },
});
