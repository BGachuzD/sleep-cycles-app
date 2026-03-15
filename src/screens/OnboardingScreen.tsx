// src/screens/OnboardingScreen.tsx
import React, { FC, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  ScrollView,
  FlatList,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { GradientBackground } from '../components/GradientBackground';
import { useOnboardingFlag } from '../hooks/useOnboardingFlag';
import { useSleepProfileContext } from '../context/SleepProfileContext';
import { useAuth } from '../context/AuthContext';
import type { Chronotype } from '../domain/sleepProfile';
import { getOptimalSleepWindow } from '../domain/sleepProfile';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width, height } = Dimensions.get('window');
const PADDING_H = 28;
const DOT_SIZE = 8;

// ── Slide 1: Bienvenida
const SlideWelcome: FC = () => (
  <View style={slideStyles.inner}>
    <View style={slideStyles.emojiWrapper}>
      <Text style={slideStyles.emoji}>😴</Text>
    </View>
    <Text style={slideStyles.title}>Mejores despertares</Text>
    <Text style={slideStyles.description}>
      Calculamos las horas exactas para que despiertes al final de un ciclo de sueño ligero — no desde lo más profundo.
    </Text>
  </View>
);

// ── Slide 2: Ciencia de ciclos
const SlideCycles: FC = () => (
  <View style={slideStyles.inner}>
    <View style={slideStyles.emojiWrapper}>
      <Text style={slideStyles.emoji}>🌀</Text>
    </View>
    <Text style={slideStyles.title}>Ciclos, no solo horas</Text>
    <Text style={slideStyles.description}>
      Tu sueño se organiza en ciclos de ~90 min. Completarlos es más importante que la cantidad total de horas.
    </Text>
    <View style={slideStyles.scienceBox}>
      <Text style={slideStyles.scienceItem}>💤 4 ciclos = 6 h — mínimo aceptable</Text>
      <Text style={slideStyles.scienceItem}>🌙 5 ciclos = 7.5 h — objetivo ideal</Text>
      <Text style={slideStyles.scienceItem}>⭐ 6 ciclos = 9 h — recuperación máxima</Text>
    </View>
  </View>
);

// ── Slide 3: Hora de despertar
const SlideWakeTime: FC<{
  wakeHour: number;
  wakeMinute: number;
  onAdjustHour: (d: number) => void;
  onAdjustMinute: (d: number) => void;
}> = ({ wakeHour, wakeMinute, onAdjustHour, onAdjustMinute }) => {
  const hStr = String(wakeHour).padStart(2, '0');
  const mStr = String(wakeMinute).padStart(2, '0');
  return (
    <View style={slideStyles.inner}>
      <View style={slideStyles.emojiWrapper}>
        <Text style={slideStyles.emoji}>⏰</Text>
      </View>
      <Text style={slideStyles.title}>¿A qué hora sueles despertar?</Text>
      <Text style={slideStyles.description}>
        Esto nos ayudará a darte recomendaciones listas de inmediato.
      </Text>
      <View style={slideStyles.pickerRow}>
        {/* Hour */}
        <View style={slideStyles.pickerCol}>
          <TouchableOpacity style={slideStyles.pickerBtn} onPress={() => onAdjustHour(1)}>
            <Ionicons name="chevron-up" size={24} color="#818cf8" />
          </TouchableOpacity>
          <Text style={slideStyles.pickerVal}>{hStr}</Text>
          <TouchableOpacity style={slideStyles.pickerBtn} onPress={() => onAdjustHour(-1)}>
            <Ionicons name="chevron-down" size={24} color="#818cf8" />
          </TouchableOpacity>
        </View>
        <Text style={slideStyles.pickerSep}>:</Text>
        {/* Minute */}
        <View style={slideStyles.pickerCol}>
          <TouchableOpacity style={slideStyles.pickerBtn} onPress={() => onAdjustMinute(15)}>
            <Ionicons name="chevron-up" size={24} color="#818cf8" />
          </TouchableOpacity>
          <Text style={slideStyles.pickerVal}>{mStr}</Text>
          <TouchableOpacity style={slideStyles.pickerBtn} onPress={() => onAdjustMinute(-15)}>
            <Ionicons name="chevron-down" size={24} color="#818cf8" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ── Slide 4: Cronotipo
const SlideChronotype: FC<{
  value: Chronotype;
  onChange: (c: Chronotype) => void;
}> = ({ value, onChange }) => {
  const OPTIONS: { id: Chronotype; emoji: string; label: string; desc: string }[] = [
    { id: 'morning', emoji: '🌅', label: 'Matutino', desc: 'Me duermo y me levanto temprano naturalmente.' },
    { id: 'intermediate', emoji: '🌤', label: 'Intermedio', desc: 'Sin preferencia clara de horario.' },
    { id: 'night', emoji: '🌙', label: 'Nocturno', desc: 'Me desvelo fácilmente y me cuesta madrugar.' },
  ];
  const win = getOptimalSleepWindow(value);
  return (
    <View style={slideStyles.inner}>
      <View style={slideStyles.emojiWrapper}>
        <Text style={slideStyles.emoji}>🦉</Text>
      </View>
      <Text style={slideStyles.title}>¿Cuál es tu cronotipo?</Text>
      <Text style={slideStyles.description}>
        Tu reloj biológico natural. Ajustaremos tu latencia y ventanas óptimas con base en esto.
      </Text>
      {OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.id}
          style={[slideStyles.chronoOption, value === opt.id && slideStyles.chronoActive]}
          onPress={() => onChange(opt.id)}
        >
          <Text style={slideStyles.chronoEmoji}>{opt.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[slideStyles.chronoLabel, value === opt.id && { color: '#e0e7ff' }]}>{opt.label}</Text>
            <Text style={slideStyles.chronoDesc}>{opt.desc}</Text>
          </View>
          {value === opt.id && <Ionicons name="checkmark-circle" size={20} color="#818cf8" />}
        </TouchableOpacity>
      ))}
      <Text style={slideStyles.windowHint}>
        Ventana óptima para dormir: {win.bedtimeStart} – {win.bedtimeEnd}
      </Text>
    </View>
  );
};

// ── Slide 5: Listo
const SlideDone: FC<{ onStart: () => void }> = ({ onStart }) => (
  <View style={slideStyles.inner}>
    <View style={slideStyles.emojiWrapper}>
      <Text style={slideStyles.emoji}>🌌</Text>
    </View>
    <Text style={slideStyles.title}>Todo listo</Text>
    <Text style={slideStyles.description}>
      Tu app está personalizada. Úsala antes de dormir para calcular tus ciclos o por la mañana para registrar cómo dormiste.
    </Text>
    <TouchableOpacity style={slideStyles.startButton} onPress={onStart}>
      <Text style={slideStyles.startButtonText}>Empezar a dormir mejor</Text>
    </TouchableOpacity>
  </View>
);

const slideStyles = StyleSheet.create({
  inner: {
    paddingTop: height * 0.1,
    paddingHorizontal: PADDING_H,
    alignItems: 'center',
  },
  emojiWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(129,140,248,0.7)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
      },
    }),
  },
  emoji: { fontSize: 52 },
  title: { color: '#f9fafb', fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  description: { color: '#cbd5f5', fontSize: 15, lineHeight: 22, textAlign: 'center', paddingHorizontal: 10, marginBottom: 20 },
  scienceBox: {
    backgroundColor: '#1f2937',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#374151',
    width: '100%',
    gap: 8,
  },
  scienceItem: { color: '#a5b4fc', fontSize: 14, fontWeight: '600' },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  pickerCol: { alignItems: 'center', gap: 6 },
  pickerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(129,140,248,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerVal: { color: '#f9fafb', fontSize: 52, fontWeight: '900', minWidth: 80, textAlign: 'center' },
  pickerSep: { color: '#818cf8', fontSize: 52, fontWeight: '900', paddingBottom: 10 },
  chronoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#374151',
    width: '100%',
    gap: 12,
  },
  chronoActive: { borderColor: '#818cf8', backgroundColor: 'rgba(129,140,248,0.1)' },
  chronoEmoji: { fontSize: 28 },
  chronoLabel: { color: '#9ca3af', fontWeight: '700', fontSize: 15 },
  chronoDesc: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  windowHint: {
    color: '#a78bfa',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  startButton: {
    marginTop: 30,
    width: width - PADDING_H * 2,
    backgroundColor: '#4f46e5',
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: 'center',
  },
  startButtonText: { color: '#f9fafb', fontSize: 16, fontWeight: '700' },
});

// ── Dot indicator
const DotIndicator: FC<{ scrollX: any; index: number; total: number }> = ({
  scrollX,
  index,
}) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], Extrapolation.CLAMP);
    const dotWidth = interpolate(scrollX.value, inputRange, [DOT_SIZE, DOT_SIZE * 3, DOT_SIZE], Extrapolation.CLAMP);
    return { opacity, width: dotWidth, backgroundColor: '#818cf8' };
  });
  return <Animated.View style={[{ height: DOT_SIZE, borderRadius: DOT_SIZE / 2, marginHorizontal: 4 }, animatedDotStyle]} />;
};

const TOTAL_SLIDES = 5;

export const OnboardingScreen: FC<Props> = () => {
  const scrollX = useSharedValue(0);
  const { markAsSeen } = useOnboardingFlag();
  const { saveProfile } = useSleepProfileContext();
  const { user } = useAuth();
  const flatRef = useRef<FlatList>(null);

  // Wake time captured during onboarding
  const [wakeHour, setWakeHour] = useState(7);
  const [wakeMinute, setWakeMinute] = useState(0);

  // Chronotype (pre-fill from auth metadata if available)
  const metaChronotype = user?.user_metadata?.chronotype as Chronotype | undefined;
  const [chronotype, setChronotype] = useState<Chronotype>(metaChronotype ?? 'intermediate');

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const adjustHour = (delta: number) =>
    setWakeHour((h) => ((h + delta + 24) % 24));

  const adjustMinute = (delta: number) =>
    setWakeMinute((m) => {
      const next = Math.round((m + delta) / 15) * 15;
      return ((next % 60) + 60) % 60;
    });

  const handleStart = async () => {
    // Save minimal profile with just what we collected if none exists yet
    // (the full profile setup will be forced after onboarding if no profile exists)
    await markAsSeen();
  };

  const slides = [
    { key: '1', component: <SlideWelcome /> },
    { key: '2', component: <SlideCycles /> },
    {
      key: '3',
      component: (
        <SlideWakeTime
          wakeHour={wakeHour}
          wakeMinute={wakeMinute}
          onAdjustHour={adjustHour}
          onAdjustMinute={adjustMinute}
        />
      ),
    },
    {
      key: '4',
      component: (
        <SlideChronotype value={chronotype} onChange={setChronotype} />
      ),
    },
    { key: '5', component: <SlideDone onStart={handleStart} /> },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.flex}>
        <GradientBackground />

        <Animated.FlatList
          ref={flatRef as any}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View style={{ width }}>{item.component}</View>
          )}
        />

        <View style={styles.dotsFooter}>
          <View style={styles.dotsContainer}>
            {slides.map((_, index) => (
              <DotIndicator key={index} scrollX={scrollX} index={index} total={TOTAL_SLIDES} />
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#020617' },
  dotsFooter: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dotsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
