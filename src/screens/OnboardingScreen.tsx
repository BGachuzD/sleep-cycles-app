// src/screens/OnboardingScreen.tsx
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { FC, useMemo, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../App';
import { useOnboardingFlag } from '../hooks/useOnboardingFlag';
import { useAppTheme } from '../theme/ThemeProvider';
import {
  Dot,
  SlideApprox,
  SlideCycles,
  SlideHowItWorks,
} from './onboarding/components';
import { height, width } from './onboarding/constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;
// ─────────────────────────────────────────────
// OnboardingScreen
// ─────────────────────────────────────────────
export const OnboardingScreen: FC<Props> = () => {
  const { theme } = useAppTheme();
  const { markAsSeen } = useOnboardingFlag();
  const flatRef = useRef<FlatList>(null);

  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  // Solo marca el carrusel como visto: el perfil se llena en el stepper
  // (ProfileSetupScreen), al que el navigator lleva porque profile es null.
  const handleStart = async () => {
    await markAsSeen();
  };

  const slides = useMemo(
    () => [{ key: 'cycles' }, { key: 'tour' }, { key: 'approx' }],
    [],
  );

  const renderItem = ({ index }: { item: { key: string }; index: number }) => {
    switch (index) {
      case 0:
        return <SlideCycles scrollX={scrollX} index={0} theme={theme} />;
      case 1:
        return <SlideHowItWorks scrollX={scrollX} index={1} theme={theme} />;
      case 2:
        return (
          <SlideApprox
            scrollX={scrollX}
            index={2}
            onStart={handleStart}
            theme={theme}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Glow de fondo (ambient) */}
      <View style={styles.ambient} pointerEvents="none">
        <Animated.View
          style={[
            styles.ambientGlow,
            {
              backgroundColor: theme.colors.accent[600],
            },
          ]}
        />
      </View>

      <Animated.FlatList
        ref={flatRef as any}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={renderItem}
        bounces={false}
      />

      {/* Footer: dots */}
      <Animated.View entering={FadeInDown.duration(260)} style={styles.footer}>
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <Dot key={i} index={i} scrollX={scrollX} theme={theme} />
          ))}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const AMBIENT_DIAMETER = Math.max(width, height);

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambient: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    top: -AMBIENT_DIAMETER * 0.4,
    left: (width - AMBIENT_DIAMETER) / 2,
    width: AMBIENT_DIAMETER,
    height: AMBIENT_DIAMETER,
    borderRadius: AMBIENT_DIAMETER / 2,
    opacity: 0.25,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
