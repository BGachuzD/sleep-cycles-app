// src/screens/OnboardingScreen.tsx
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../App';
import { WheelTimePicker } from '../components/WheelTimePicker';
import { PrimaryCTA } from '../components/PrimaryCTA';
import { usePressScale } from '../hooks/usePressScale';
import { useOnboardingFlag } from '../hooks/useOnboardingFlag';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import { defaultProfile } from '../hooks/useSleepProfile';
import { useAuth } from '../context/AuthContext';
import type { Chronotype, SleepProfile } from '../domain/sleepProfile';
import { getOptimalSleepWindow } from '../domain/sleepProfile';
import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width, height } = Dimensions.get('window');
const HERO_DIAMETER = Math.min(width * 0.46, 180);

// ─────────────────────────────────────────────
// Partícula que orbita el hero con su propio loop
// ─────────────────────────────────────────────
const Particle: FC<{
  index: number;
  total: number;
  radius: number;
  size: number;
}> = ({ index, total, radius, size }) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, {
        duration: 6000 + (index % 3) * 1500,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [t, index]);

  const baseAngle = (index / total) * Math.PI * 2;
  const animatedStyle = useAnimatedStyle(() => {
    const sway = interpolate(t.value, [0, 1], [-0.3, 0.3]);
    const r = radius + interpolate(t.value, [0, 1], [-6, 6]);
    const angle = baseAngle + sway;
    return {
      transform: [
        { translateX: Math.cos(angle) * r },
        { translateY: Math.sin(angle) * r },
      ],
      opacity: interpolate(t.value, [0, 1], [0.4, 0.85]),
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#ffffff',
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
};

// ─────────────────────────────────────────────
// HeroComposition: glow respirante + capas + icon + partículas
// El parallax viene de fuera vía el `parallaxOffset` prop.
// ─────────────────────────────────────────────
const HeroComposition: FC<{
  icon: keyof typeof Ionicons.glyphMap;
  scrollX: SharedValue<number>;
  index: number;
  theme: AppTheme;
}> = ({ icon, scrollX, index, theme }) => {
  // Glow breath
  const breath = useSharedValue(0);
  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breath]);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breath.value, [0, 1], [0.96, 1.06]) }],
    opacity: interpolate(breath.value, [0, 1], [0.55, 0.85]),
  }));

  // Parallax / scale del slide entero según scrollX
  const containerStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.85, 1, 0.85],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [40, 0, 40],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  return (
    <Animated.View style={[heroStyles.hero, containerStyle]}>
      {/* Capa externa: gradient violeta con glow */}
      <Animated.View
        style={[
          heroStyles.outerGlow,
          {
            shadowColor: theme.colors.accent[500],
            backgroundColor: theme.colors.accent[500],
          },
          breathStyle,
        ]}
      />

      {/* Anillo intermedio */}
      <View
        style={[
          heroStyles.middleRing,
          {
            borderColor: `${theme.colors.accent[400]}55`,
            backgroundColor: `${theme.colors.accent[500]}1A`,
          },
        ]}
      />

      {/* Gradient violeta central como background del icono */}
      <LinearGradient
        colors={[theme.colors.accent[500], theme.colors.accent[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={heroStyles.innerCircle}
      >
        <Ionicons
          name={icon}
          size={HERO_DIAMETER * 0.36}
          color={theme.colors.white}
        />
      </LinearGradient>

      {/* Partículas orbitando */}
      <View style={heroStyles.particleLayer} pointerEvents="none">
        {Array.from({ length: 6 }).map((_, i) => (
          <Particle
            key={i}
            index={i}
            total={6}
            radius={HERO_DIAMETER * 0.55}
            size={3 + (i % 3)}
          />
        ))}
      </View>
    </Animated.View>
  );
};

const heroStyles = StyleSheet.create({
  hero: {
    width: HERO_DIAMETER,
    height: HERO_DIAMETER,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  outerGlow: {
    position: 'absolute',
    width: HERO_DIAMETER * 1.4,
    height: HERO_DIAMETER * 1.4,
    borderRadius: HERO_DIAMETER,
    opacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
  },
  middleRing: {
    position: 'absolute',
    width: HERO_DIAMETER * 0.95,
    height: HERO_DIAMETER * 0.95,
    borderRadius: HERO_DIAMETER,
    borderWidth: 1,
  },
  innerCircle: {
    width: HERO_DIAMETER * 0.6,
    height: HERO_DIAMETER * 0.6,
    borderRadius: HERO_DIAMETER,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  particleLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─────────────────────────────────────────────
// SlideTextLayer: title + description con entries escalonados
// Anima translateX por scrollX para parallax horizontal sutil.
// ─────────────────────────────────────────────
const SlideTextLayer: FC<{
  title: string;
  description: string;
  scrollX: SharedValue<number>;
  index: number;
  theme: AppTheme;
}> = ({ title, description, scrollX, index, theme }) => {
  const titleStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      transform: [
        {
          translateX: interpolate(
            scrollX.value,
            inputRange,
            [-60, 0, 60],
            Extrapolation.CLAMP,
          ),
        },
      ],
      opacity: interpolate(
        scrollX.value,
        inputRange,
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  const descStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      transform: [
        {
          translateX: interpolate(
            scrollX.value,
            inputRange,
            [-30, 0, 30],
            Extrapolation.CLAMP,
          ),
        },
      ],
      opacity: interpolate(
        scrollX.value,
        inputRange,
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <View style={textStyles.wrapper}>
      <Animated.Text
        style={[
          textStyles.title,
          {
            color: theme.colors.textPrimary,
            fontSize: theme.type.title1,
          },
          titleStyle,
        ]}
      >
        {title}
      </Animated.Text>
      <Animated.Text
        style={[
          textStyles.description,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.type.body,
          },
          descStyle,
        ]}
      >
        {description}
      </Animated.Text>
    </View>
  );
};

const textStyles = StyleSheet.create({
  wrapper: { paddingHorizontal: 28, alignItems: 'center' },
  title: {
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
  },
});

// ─────────────────────────────────────────────
// Slides
// ─────────────────────────────────────────────
const SlideWelcome: FC<{
  scrollX: SharedValue<number>;
  index: number;
  theme: AppTheme;
}> = ({ scrollX, index, theme }) => (
  <SlideShell>
    <HeroComposition icon="moon-outline" scrollX={scrollX} index={index} theme={theme} />
    <SlideTextLayer
      title="Mejores despertares"
      description="Calculamos las horas exactas para que despiertes al final de un ciclo de sueño ligero, no desde lo más profundo."
      scrollX={scrollX}
      index={index}
      theme={theme}
    />
  </SlideShell>
);

const SlideCycles: FC<{
  scrollX: SharedValue<number>;
  index: number;
  theme: AppTheme;
}> = ({ scrollX, index, theme }) => {
  const chipsStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      transform: [
        {
          translateY: interpolate(
            scrollX.value,
            inputRange,
            [40, 0, 40],
            Extrapolation.CLAMP,
          ),
        },
      ],
      opacity: interpolate(
        scrollX.value,
        inputRange,
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  const data = [
    { n: '4', d: '6h', label: 'mínimo' },
    { n: '5', d: '7.5h', label: 'ideal' },
    { n: '6', d: '9h', label: 'pleno' },
  ];

  return (
    <SlideShell>
      <HeroComposition icon="infinite-outline" scrollX={scrollX} index={index} theme={theme} />
      <SlideTextLayer
        title="Ciclos, no solo horas"
        description="Tu sueño se organiza en ciclos de ~90 min. Completarlos importa más que la cantidad total de horas."
        scrollX={scrollX}
        index={index}
        theme={theme}
      />
      <Animated.View style={[cyclesStyles.row, chipsStyle]}>
        {data.map((c, i) => (
          <View
            key={c.n}
            style={[
              cyclesStyles.chip,
              {
                backgroundColor: theme.colors.surface,
                borderColor:
                  i === 1 ? theme.colors.accent[500] : theme.colors.border,
                borderWidth: i === 1 ? 1.5 : 1,
                borderRadius: theme.radius.lg,
              },
            ]}
          >
            <Text
              style={[
                cyclesStyles.chipN,
                {
                  color: theme.colors.heroText,
                  fontSize: theme.type.title2,
                },
              ]}
            >
              {c.n}
            </Text>
            <Text
              style={[
                cyclesStyles.chipD,
                { color: theme.colors.textSecondary, fontSize: theme.type.small },
              ]}
            >
              {c.d}
            </Text>
            <Text
              style={[
                cyclesStyles.chipLabel,
                { color: theme.colors.textMuted, fontSize: theme.type.caption },
              ]}
            >
              {c.label}
            </Text>
          </View>
        ))}
      </Animated.View>
    </SlideShell>
  );
};

const cyclesStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 28,
    marginTop: 28,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  chipN: {
    fontWeight: '900',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  chipD: { fontWeight: '700' },
  chipLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

// ─────────────────────────────────────────────
// SlideHowItWorks: recorrido de las pantallas clave
// ─────────────────────────────────────────────
const TOUR_ITEMS: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
}> = [
  {
    icon: 'moon-outline',
    label: 'Dormir ahora',
    desc: 'Si te acuestas ya, te decimos a qué horas conviene despertar.',
  },
  {
    icon: 'alarm-outline',
    label: 'Despertar a las',
    desc: 'Eliges tu hora de despertar y calculamos cuándo acostarte.',
  },
  {
    icon: 'journal-outline',
    label: 'Diario de sueño',
    desc: 'Registra cómo dormiste y cómo te sentiste al despertar.',
  },
  {
    icon: 'stats-chart-outline',
    label: 'Estadísticas',
    desc: 'Mira tu progreso, tu racha y tus tendencias de descanso.',
  },
];

const SlideHowItWorks: FC<{
  scrollX: SharedValue<number>;
  index: number;
  theme: AppTheme;
}> = ({ scrollX, index, theme }) => {
  const listStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      transform: [
        {
          translateY: interpolate(
            scrollX.value,
            inputRange,
            [40, 0, 40],
            Extrapolation.CLAMP,
          ),
        },
      ],
      opacity: interpolate(
        scrollX.value,
        inputRange,
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <SlideShell>
      <HeroComposition icon="map-outline" scrollX={scrollX} index={index} theme={theme} />
      <SlideTextLayer
        title="Tu kit para dormir mejor"
        description="Dos calculadoras, un diario y tus estadísticas. Todo gira alrededor de tus ciclos."
        scrollX={scrollX}
        index={index}
        theme={theme}
      />
      <Animated.View style={[tourStyles.list, listStyle]}>
        {TOUR_ITEMS.map((item) => (
          <View
            key={item.label}
            style={[
              tourStyles.row,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
              },
            ]}
          >
            <View
              style={[
                tourStyles.iconCircle,
                { backgroundColor: `${theme.colors.accent[500]}1F` },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={theme.colors.accent[400]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  tourStyles.label,
                  {
                    color: theme.colors.textPrimary,
                    fontSize: theme.type.bodyLarge,
                  },
                ]}
              >
                {item.label}
              </Text>
              <Text
                style={[
                  tourStyles.desc,
                  { color: theme.colors.textMuted, fontSize: theme.type.small },
                ]}
              >
                {item.desc}
              </Text>
            </View>
          </View>
        ))}
      </Animated.View>
    </SlideShell>
  );
};

const tourStyles = StyleSheet.create({
  list: {
    paddingHorizontal: 28,
    marginTop: 20,
    gap: 10,
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 12,
    borderWidth: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontWeight: '700' },
  desc: { lineHeight: 16, marginTop: 2 },
});

// ─────────────────────────────────────────────
// SlideApprox: expectativas honestas sobre las horas sugeridas
// ─────────────────────────────────────────────
const SlideApprox: FC<{
  scrollX: SharedValue<number>;
  index: number;
  theme: AppTheme;
}> = ({ scrollX, index, theme }) => {
  const cardStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      transform: [
        {
          translateY: interpolate(
            scrollX.value,
            inputRange,
            [40, 0, 40],
            Extrapolation.CLAMP,
          ),
        },
      ],
      opacity: interpolate(
        scrollX.value,
        inputRange,
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <SlideShell>
      <HeroComposition icon="telescope-outline" scrollX={scrollX} index={index} theme={theme} />
      <SlideTextLayer
        title="Horas aproximadas, resultados reales"
        description="Cada sugerencia es una aproximación pensada para que despiertes en fase ligera, no una promesa exacta. Síguelas con constancia y registra cómo te sientes: la meta es que notes la diferencia al despertar."
        scrollX={scrollX}
        index={index}
        theme={theme}
      />
      <Animated.View
        style={[
          approxStyles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.accent[500],
            borderRadius: theme.radius.xl,
          },
          cardStyle,
        ]}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={[
              approxStyles.time,
              { color: theme.colors.textPrimary, fontSize: theme.type.title3 },
            ]}
          >
            8:55 p.m.
          </Text>
          <Text
            style={[
              approxStyles.cycles,
              { color: theme.colors.textMuted, fontSize: theme.type.caption },
            ]}
          >
            5 CICLOS · 7 h 30 min
          </Text>
        </View>
        <View style={approxStyles.right}>
          <View style={approxStyles.stars}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons
                key={i}
                name="star"
                size={12}
                color={theme.colors.accent[400]}
              />
            ))}
          </View>
          <View
            style={[
              approxStyles.badge,
              {
                backgroundColor: `${theme.colors.accent[500]}1F`,
                borderColor: `${theme.colors.accent[500]}55`,
              },
            ]}
          >
            <Text
              style={[
                approxStyles.badgeText,
                { color: theme.colors.accent[300] },
              ]}
            >
              ÓPTIMO
            </Text>
          </View>
        </View>
      </Animated.View>
      <Text
        style={[
          approxStyles.hint,
          { color: theme.colors.textMuted, fontSize: theme.type.caption },
        ]}
      >
        Las estrellas indican qué tan reparadora es cada opción.
      </Text>
    </SlideShell>
  );
};

const approxStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 28,
    marginTop: 28,
    padding: 18,
    borderWidth: 1.5,
    alignSelf: 'stretch',
  },
  time: { fontWeight: '900', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  cycles: { fontWeight: '700', letterSpacing: 0.5 },
  right: { alignItems: 'flex-end', gap: 8 },
  stars: { flexDirection: 'row', gap: 2 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  hint: {
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 40,
    fontWeight: '600',
  },
});

const SlideWakeTime: FC<{
  scrollX: SharedValue<number>;
  index: number;
  value: Date;
  onChange: (date: Date) => void;
  theme: AppTheme;
}> = ({ scrollX, index, value, onChange, theme }) => {
  const pickerStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      transform: [
        {
          translateY: interpolate(
            scrollX.value,
            inputRange,
            [40, 0, 40],
            Extrapolation.CLAMP,
          ),
        },
      ],
      opacity: interpolate(
        scrollX.value,
        inputRange,
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <SlideShell>
      <HeroComposition icon="alarm-outline" scrollX={scrollX} index={index} theme={theme} />
      <SlideTextLayer
        title="¿A qué hora despiertas?"
        description="Esto nos ayudará a darte recomendaciones listas de inmediato."
        scrollX={scrollX}
        index={index}
        theme={theme}
      />
      <Animated.View style={[wakeStyles.pickerWrapper, pickerStyle]}>
        <WheelTimePicker value={value} onChange={onChange} />
      </Animated.View>
    </SlideShell>
  );
};

const wakeStyles = StyleSheet.create({
  pickerWrapper: {
    alignSelf: 'stretch',
    marginTop: 16,
  },
});

const CHRONO_OPTIONS: Array<{
  id: Chronotype;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
}> = [
  {
    id: 'morning',
    icon: 'sunny-outline',
    label: 'Matutino',
    desc: 'Me duermo y me levanto temprano naturalmente.',
  },
  {
    id: 'intermediate',
    icon: 'partly-sunny-outline',
    label: 'Intermedio',
    desc: 'Sin preferencia clara de horario.',
  },
  {
    id: 'night',
    icon: 'moon-outline',
    label: 'Nocturno',
    desc: 'Me desvelo fácilmente y me cuesta madrugar.',
  },
];

const ChronotypeOption: FC<{
  option: (typeof CHRONO_OPTIONS)[number];
  active: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ option, active, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        style={[
          chronoStyles.option,
          {
            backgroundColor: active
              ? `${theme.colors.accent[500]}14`
              : theme.colors.surface,
            borderColor: active
              ? theme.colors.accent[500]
              : theme.colors.border,
            borderWidth: active ? 1.5 : 1,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <View
          style={[
            chronoStyles.iconCircle,
            {
              backgroundColor: `${theme.colors.accent[500]}1F`,
            },
          ]}
        >
          <Ionicons
            name={option.icon}
            size={20}
            color={theme.colors.accent[400]}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              chronoStyles.label,
              {
                color: active
                  ? theme.colors.textPrimary
                  : theme.colors.textSecondary,
                fontSize: theme.type.bodyLarge,
              },
            ]}
          >
            {option.label}
          </Text>
          <Text
            style={[
              chronoStyles.desc,
              { color: theme.colors.textMuted, fontSize: theme.type.small },
            ]}
          >
            {option.desc}
          </Text>
        </View>
        {active && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={theme.colors.accent[400]}
          />
        )}
      </Pressable>
    </Animated.View>
  );
};

const chronoStyles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontWeight: '700' },
  desc: { lineHeight: 16, marginTop: 2 },
});

const SlideChronotype: FC<{
  scrollX: SharedValue<number>;
  index: number;
  value: Chronotype;
  onChange: (c: Chronotype) => void;
  theme: AppTheme;
}> = ({ scrollX, index, value, onChange, theme }) => {
  const listStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      transform: [
        {
          translateY: interpolate(
            scrollX.value,
            inputRange,
            [40, 0, 40],
            Extrapolation.CLAMP,
          ),
        },
      ],
      opacity: interpolate(
        scrollX.value,
        inputRange,
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  const win = getOptimalSleepWindow(value);

  return (
    <SlideShell>
      <HeroComposition icon="compass-outline" scrollX={scrollX} index={index} theme={theme} />
      <SlideTextLayer
        title="¿Cuál es tu cronotipo?"
        description="Tu reloj biológico natural. Ajustaremos tu latencia y ventanas óptimas."
        scrollX={scrollX}
        index={index}
        theme={theme}
      />
      <Animated.View style={[chronoListStyles.list, listStyle]}>
        {CHRONO_OPTIONS.map((opt) => (
          <ChronotypeOption
            key={opt.id}
            option={opt}
            active={value === opt.id}
            onPress={() => onChange(opt.id)}
            theme={theme}
          />
        ))}
        <Text
          style={[
            chronoListStyles.hint,
            { color: theme.colors.accent[300], fontSize: theme.type.caption },
          ]}
        >
          Ventana óptima: {win.bedtimeStart} a {win.bedtimeEnd}
        </Text>
      </Animated.View>
    </SlideShell>
  );
};

const chronoListStyles = StyleSheet.create({
  list: {
    paddingHorizontal: 28,
    marginTop: 20,
    gap: 12,
    alignSelf: 'stretch',
  },
  hint: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 8,
  },
});

const SlideDone: FC<{
  scrollX: SharedValue<number>;
  index: number;
  onStart: () => void;
  theme: AppTheme;
}> = ({ scrollX, index, onStart, theme }) => {
  const ctaStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      transform: [
        {
          translateY: interpolate(
            scrollX.value,
            inputRange,
            [40, 0, 40],
            Extrapolation.CLAMP,
          ),
        },
      ],
      opacity: interpolate(
        scrollX.value,
        inputRange,
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <SlideShell>
      <HeroComposition icon="sparkles-outline" scrollX={scrollX} index={index} theme={theme} />
      <SlideTextLayer
        title="Todo listo"
        description="Tu app está personalizada. Empieza a dormir mejor desde esta misma noche."
        scrollX={scrollX}
        index={index}
        theme={theme}
      />
      <Animated.View style={[doneStyles.ctaWrapper, ctaStyle]}>
        <PrimaryCTA
          label="Empezar a dormir mejor"
          icon="arrow-forward"
          trailingIcon="sparkles-outline"
          onPress={onStart}
        />
      </Animated.View>
    </SlideShell>
  );
};

const doneStyles = StyleSheet.create({
  ctaWrapper: {
    paddingHorizontal: 28,
    width: '100%',
    marginTop: 32,
  },
});

// ─────────────────────────────────────────────
// DotIndicator
// ─────────────────────────────────────────────
const Dot: FC<{
  index: number;
  scrollX: SharedValue<number>;
  theme: AppTheme;
}> = ({ index, scrollX, theme }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const widthVal = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.35, 1, 0.35],
      Extrapolation.CLAMP,
    );
    return { width: widthVal, opacity };
  });

  return (
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 4,
          marginHorizontal: 4,
          backgroundColor: theme.colors.accent[400],
        },
        animatedStyle,
      ]}
    />
  );
};

const slideStyles = StyleSheet.create({
  inner: {
    width,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: height * 0.04,
    paddingBottom: 120, // espacio explícito sobre los dots
  },
});

// Wrapper común para todos los slides: ScrollView con paging-friendly content.
const SlideShell: FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={slideStyles.inner}>
    <ScrollView
      contentContainerStyle={slideStyles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
      nestedScrollEnabled
    >
      {children}
    </ScrollView>
  </View>
);

// ─────────────────────────────────────────────
// OnboardingScreen
// ─────────────────────────────────────────────
export const OnboardingScreen: FC<Props> = () => {
  const { theme } = useAppTheme();
  const { markAsSeen } = useOnboardingFlag();
  const { profile, saveProfile } = useSleepProfileContext();
  const { user } = useAuth();
  const flatRef = useRef<FlatList>(null);

  const [wakeHour, setWakeHour] = useState(profile?.wakeHour ?? 7);
  const [wakeMinute, setWakeMinute] = useState(profile?.wakeMinute ?? 0);
  const metaChronotype = user?.user_metadata?.chronotype as Chronotype | undefined;
  const [chronotype, setChronotype] = useState<Chronotype>(
    profile?.chronotype ?? metaChronotype ?? 'intermediate',
  );

  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const wakeDate = useMemo(() => {
    const d = new Date();
    d.setHours(wakeHour, wakeMinute, 0, 0);
    return d;
  }, [wakeHour, wakeMinute]);

  const handleWakeChange = (picked: Date) => {
    setWakeHour(picked.getHours());
    setWakeMinute(picked.getMinutes());
  };

  const handleStart = async () => {
    const next: SleepProfile = {
      ...(profile ?? defaultProfile),
      chronotype,
      wakeHour,
      wakeMinute,
    };
    await saveProfile(next);
    await markAsSeen();
  };

  const slides = useMemo(
    () => [
      { key: 'welcome' },
      { key: 'cycles' },
      { key: 'tour' },
      { key: 'approx' },
      { key: 'wake' },
      { key: 'chrono' },
      { key: 'done' },
    ],
    [],
  );

  const renderItem = ({ index }: { item: { key: string }; index: number }) => {
    switch (index) {
      case 0:
        return <SlideWelcome scrollX={scrollX} index={0} theme={theme} />;
      case 1:
        return <SlideCycles scrollX={scrollX} index={1} theme={theme} />;
      case 2:
        return <SlideHowItWorks scrollX={scrollX} index={2} theme={theme} />;
      case 3:
        return <SlideApprox scrollX={scrollX} index={3} theme={theme} />;
      case 4:
        return (
          <SlideWakeTime
            scrollX={scrollX}
            index={4}
            value={wakeDate}
            onChange={handleWakeChange}
            theme={theme}
          />
        );
      case 5:
        return (
          <SlideChronotype
            scrollX={scrollX}
            index={5}
            value={chronotype}
            onChange={setChronotype}
            theme={theme}
          />
        );
      case 6:
        return (
          <SlideDone
            scrollX={scrollX}
            index={6}
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
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
      edges={['top', 'bottom']}
    >
      {/* Glow de fondo (ambient) */}
      <View style={styles.ambient} pointerEvents="none">
        <Animated.View
          style={[
            styles.ambientGlow,
            {
              backgroundColor: theme.colors.accent[600],
              shadowColor: theme.colors.accent[600],
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
      <Animated.View
        entering={FadeInDown.duration(500)}
        style={styles.footer}
      >
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
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 200,
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
