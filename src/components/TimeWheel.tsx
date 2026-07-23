import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import React, { FC, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '../theme/ThemeProvider';

type Props = {
  /** Hora seleccionada. Solo se usan horas/minutos; la fecha la maneja el caller. */
  value: Date;
  onChange: (date: Date) => void;
  /** Alto visible de la rueda; el excedente se recorta. */
  height?: number;
  /**
   * iOS no permite cambiar el font size del UIDatePicker; escalarlo con
   * transform agranda el texto sin perder nitidez. 1.3 ≈ look de reloj hero.
   */
  scale?: number;
};

/**
 * Rueda de hora nativa de iOS (UIDatePicker en modo spinner).
 * Minutos exactos, un solo gesto, texto en el color hero del theme.
 */
export const TimeWheel: FC<Props> = ({
  value,
  onChange,
  height = 180,
  scale = 1,
}) => {
  const { theme } = useAppTheme();

  const handleChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (!date) return;
      Haptics.selectionAsync().catch(() => {});
      onChange(date);
    },
    [onChange],
  );

  return (
    <View style={[styles.wrapper, { height }]}>
      <DateTimePicker
        value={value}
        mode="time"
        display="spinner"
        locale="es-MX"
        onChange={handleChange}
        textColor={theme.colors.heroText}
        themeVariant={theme.name}
        // Alto natural del UIDatePicker; el wrapper recorta el excedente
        // para lograr un look compacto sin deformar la rueda.
        style={{ height: 216, transform: [{ scale }] }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
