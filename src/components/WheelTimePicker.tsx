import React, {
  FC,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '../theme/ThemeProvider';

const ITEM_HEIGHT = 60;
const VISIBLE_ROWS = 3; // impar, para que la fila central quede al medio
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;
const PAD = ITEM_HEIGHT * ((VISIBLE_ROWS - 1) / 2);

// ─────────────────────────────────────────────
// WheelItem: un valor de la columna. Se desvanece,
// encoge y rota según su distancia a la fila central.
// ─────────────────────────────────────────────
const WheelItem: FC<{
  label: string;
  index: number;
  scrollY: SharedValue<number>;
  fontSize: number;
  color: string;
  letterSpacing: number;
}> = React.memo(({ label, index, scrollY, fontSize, color, letterSpacing }) => {
  const animatedStyle = useAnimatedStyle(() => {
    // Distancia con signo a la fila central: arriba negativa, abajo positiva.
    const offset = index * ITEM_HEIGHT - scrollY.value;
    const dist = Math.abs(offset);
    return {
      opacity: interpolate(
        dist,
        [0, ITEM_HEIGHT, ITEM_HEIGHT * 1.8],
        [1, 0.35, 0.06],
        Extrapolation.CLAMP,
      ),
      transform: [
        { perspective: 600 },
        // Curvatura de cilindro, como la rueda física de iOS.
        {
          rotateX: `${interpolate(
            offset,
            [-ITEM_HEIGHT * 1.5, 0, ITEM_HEIGHT * 1.5],
            [55, 0, -55],
            Extrapolation.CLAMP,
          )}deg`,
        },
        {
          scale: interpolate(
            dist,
            [0, ITEM_HEIGHT * 1.5],
            [1, 0.82],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <Animated.View style={[styles.item, animatedStyle]}>
      <Text
        style={[styles.itemText, { fontSize, color, letterSpacing }]}
        allowFontScaling={false}
      >
        {label}
      </Text>
    </Animated.View>
  );
});
WheelItem.displayName = 'WheelItem';

// ─────────────────────────────────────────────
// WheelColumn: columna scrolleable con snap.
// `loop` repite los datos para giro continuo (horas/minutos).
// ─────────────────────────────────────────────
type ColumnHandle = {
  /** Posiciona la columna sin animación (sync externo, no emite onSettle). */
  setIndex: (dataIndex: number) => void;
};

const LOOP_REPEAT = 5;

const WheelColumn = forwardRef<
  ColumnHandle,
  {
    data: string[];
    initialIndex: number;
    loop?: boolean;
    width: number;
    fontSize: number;
    color: string;
    letterSpacing?: number;
    onSettle: (dataIndex: number) => void;
  }
>(
  (
    {
      data,
      initialIndex,
      loop = false,
      width,
      fontSize,
      color,
      letterSpacing = 0,
      onSettle,
    },
    ref,
  ) => {
    const len = data.length;
    const repeat = loop ? LOOP_REPEAT : 1;
    const base = loop ? len * Math.floor(repeat / 2) : 0;
    const extended = useMemo(
      () => Array.from({ length: repeat }, () => data).flat(),
      [data, repeat],
    );

    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const scrollY = useSharedValue((base + initialIndex) * ITEM_HEIGHT);

    const scrollHandler = useAnimatedScrollHandler((event) => {
      scrollY.value = event.contentOffset.y;
    });

    // Ventana manual: solo se montan las filas cercanas al centro; el resto
    // se sustituye por espaciadores del alto exacto. Evita anidar una
    // VirtualizedList dentro del ScrollView de la pantalla.
    const WINDOW_BUFFER = 14; // filas montadas a cada lado del centro
    const makeWindow = useCallback(
      (center: number) => ({
        start: Math.max(0, center - WINDOW_BUFFER),
        end: Math.min(extended.length, center + WINDOW_BUFFER + 1),
      }),
      [extended.length],
    );
    const [window, setWindow] = useState(() =>
      makeWindow(base + initialIndex),
    );
    const applyWindow = useCallback(
      (center: number) => setWindow(makeWindow(center)),
      [makeWindow],
    );
    const lastWindowCenter = useSharedValue(base + initialIndex);
    useAnimatedReaction(
      () => Math.round(scrollY.value / ITEM_HEIGHT),
      (curr) => {
        if (Math.abs(curr - lastWindowCenter.value) > WINDOW_BUFFER / 2) {
          lastWindowCenter.value = curr;
          runOnJS(applyWindow)(curr);
        }
      },
    );

    // Tick háptico al pasar cada fila, como la rueda nativa. Throttled:
    // en un flick rápido, disparar haptics por cada fila satura el puente
    // JS y el motor háptico, y eso se siente como jank.
    const lastTickRef = useRef(0);
    const tick = useCallback(() => {
      const now = Date.now();
      if (now - lastTickRef.current < 45) return;
      lastTickRef.current = now;
      Haptics.selectionAsync().catch(() => {});
    }, []);
    useAnimatedReaction(
      () => Math.round(scrollY.value / ITEM_HEIGHT),
      (curr, prev) => {
        if (prev !== null && curr !== prev) {
          runOnJS(tick)();
        }
      },
    );

    const settleAt = useCallback(
      (offsetY: number) => {
        const idx = Math.max(
          0,
          Math.min(extended.length - 1, Math.round(offsetY / ITEM_HEIGHT)),
        );
        const dataIdx = ((idx % len) + len) % len;
        // Cerca de los bordes del loop: recentrar en el bloque medio.
        if (loop && (idx < len || idx >= len * (repeat - 1))) {
          scrollRef.current?.scrollTo({
            y: (base + dataIdx) * ITEM_HEIGHT,
            animated: false,
          });
          lastWindowCenter.value = base + dataIdx;
          applyWindow(base + dataIdx);
        }
        onSettle(dataIdx);
      },
      [
        extended.length,
        len,
        loop,
        repeat,
        base,
        onSettle,
        scrollRef,
        applyWindow,
        lastWindowCenter,
      ],
    );

    const handleMomentumEnd = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        settleAt(e.nativeEvent.contentOffset.y);
      },
      [settleAt],
    );

    // Si el drag termina ya alineado (sin inercia), no llega momentum end.
    const handleDragEnd = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = e.nativeEvent.contentOffset.y;
        const velocity = e.nativeEvent.velocity?.y ?? 0;
        if (velocity === 0 && y % ITEM_HEIGHT === 0) {
          settleAt(y);
        }
      },
      [settleAt],
    );

    useImperativeHandle(
      ref,
      () => ({
        setIndex: (dataIndex: number) => {
          scrollRef.current?.scrollTo({
            y: (base + dataIndex) * ITEM_HEIGHT,
            animated: false,
          });
          lastWindowCenter.value = base + dataIndex;
          applyWindow(base + dataIndex);
        },
      }),
      [base, scrollRef, applyWindow, lastWindowCenter],
    );

    const items = [];
    for (let i = window.start; i < window.end; i++) {
      items.push(
        <WheelItem
          key={i}
          label={extended[i]}
          index={i}
          scrollY={scrollY}
          fontSize={fontSize}
          color={color}
          letterSpacing={letterSpacing}
        />,
      );
    }

    return (
      <Animated.ScrollView
        ref={scrollRef}
        style={{ width, height: WHEEL_HEIGHT }}
        contentContainerStyle={{ paddingVertical: PAD }}
        contentOffset={{ x: 0, y: (base + initialIndex) * ITEM_HEIGHT }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollEndDrag={handleDragEnd}
      >
        <View style={{ height: window.start * ITEM_HEIGHT }} />
        {items}
        <View style={{ height: (extended.length - window.end) * ITEM_HEIGHT }} />
      </Animated.ScrollView>
    );
  },
);
WheelColumn.displayName = 'WheelColumn';

// ─────────────────────────────────────────────
// WheelTimePicker: hora + minuto + a.m./p.m. con
// la tipografía hero de la app. 100% JS.
// ─────────────────────────────────────────────
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, '0'),
);
const MERIDIEM = ['a.m.', 'p.m.'];

function to12h(hour24: number): number {
  const h = hour24 % 12;
  return h === 0 ? 12 : h;
}

function to24h(hour12: number, pm: boolean): number {
  return (hour12 % 12) + (pm ? 12 : 0);
}

type Props = {
  /** Hora seleccionada. Solo se usan horas/minutos; la fecha la maneja el caller. */
  value: Date;
  onChange: (date: Date) => void;
};

export const WheelTimePicker: FC<Props> = ({ value, onChange }) => {
  const { theme } = useAppTheme();

  // Selección vigente; evita re-scrolls cuando el cambio vino de aquí mismo.
  const selRef = useRef({
    h12: to12h(value.getHours()),
    min: value.getMinutes(),
    pm: value.getHours() >= 12,
  });
  const initial = useRef({ ...selRef.current }).current;

  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const hourRef = useRef<ColumnHandle>(null);
  const minuteRef = useRef<ColumnHandle>(null);
  const meridiemRef = useRef<ColumnHandle>(null);

  const emit = useCallback(() => {
    const { h12, min, pm } = selRef.current;
    const next = new Date(valueRef.current);
    next.setHours(to24h(h12, pm), min, 0, 0);
    onChangeRef.current(next);
  }, []);

  const settleHour = useCallback(
    (i: number) => {
      selRef.current.h12 = i + 1;
      emit();
    },
    [emit],
  );
  const settleMinute = useCallback(
    (i: number) => {
      selRef.current.min = i;
      emit();
    },
    [emit],
  );
  const settleMeridiem = useCallback(
    (i: number) => {
      selRef.current.pm = i === 1;
      emit();
    },
    [emit],
  );

  // Sync externo (p. ej. el perfil carga async y cambia la hora inicial).
  useEffect(() => {
    const h12 = to12h(value.getHours());
    const min = value.getMinutes();
    const pm = value.getHours() >= 12;
    const sel = selRef.current;
    if (sel.h12 === h12 && sel.min === min && sel.pm === pm) return;
    selRef.current = { h12, min, pm };
    hourRef.current?.setIndex(h12 - 1);
    minuteRef.current?.setIndex(min);
    meridiemRef.current?.setIndex(pm ? 1 : 0);
  }, [value]);

  const digitSize = theme.type.display - 8; // 44: hero sin desbordar 3 columnas
  const digitColor = theme.colors.heroText;

  return (
    <View
      style={styles.container}
      accessibilityLabel="Selector de hora. Desliza las columnas para elegir hora, minutos y a.m. o p.m."
    >
      {/* Lente central, detrás de las columnas */}
      <View
        pointerEvents="none"
        style={[
          styles.lens,
          {
            backgroundColor: `${theme.colors.accent[500]}14`,
            borderRadius: theme.radius.lg,
          },
        ]}
      />

      <WheelColumn
        ref={hourRef}
        data={HOURS}
        initialIndex={initial.h12 - 1}
        loop
        width={76}
        fontSize={digitSize}
        color={digitColor}
        letterSpacing={-2}
        onSettle={settleHour}
      />
      <Text
        style={[
          styles.separator,
          { color: digitColor, fontSize: digitSize },
        ]}
        allowFontScaling={false}
      >
        :
      </Text>
      <WheelColumn
        ref={minuteRef}
        data={MINUTES}
        initialIndex={initial.min}
        loop
        width={76}
        fontSize={digitSize}
        color={digitColor}
        letterSpacing={-2}
        onSettle={settleMinute}
      />
      <WheelColumn
        ref={meridiemRef}
        data={MERIDIEM}
        initialIndex={initial.pm ? 1 : 0}
        width={64}
        fontSize={theme.type.title3}
        color={digitColor}
        onSettle={settleMeridiem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    height: WHEEL_HEIGHT,
  },
  lens: {
    position: 'absolute',
    top: PAD,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  separator: {
    fontWeight: '800',
    marginHorizontal: 2,
    marginTop: -6,
  },
});
