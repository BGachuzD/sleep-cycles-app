import React, { FC, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '../theme/ThemeProvider';

type Props = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  /** Si true, oculta el texto. Si además `showToggle` está activo, muestra un botón ojo. */
  secureTextEntry?: boolean;
  showToggle?: boolean;
  /** Tipografía del valor — bold/grande por default (subhead 17). */
  large?: boolean;
};

/**
 * Card con label uppercase pequeño arriba + TextInput estilizado.
 * Estado focused → borde violeta accent[500]. Soporta password con eye toggle.
 */
export const FieldInput: FC<Props> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  showToggle,
  large = true,
}) => {
  const { theme } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const hide = secureTextEntry && !visible;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: focused
            ? theme.colors.accent[500]
            : theme.colors.border,
          borderWidth: focused ? 1.5 : 1,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: theme.colors.textMuted, fontSize: theme.type.micro },
        ]}
      >
        {label}
      </Text>
      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={hide}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            {
              color: theme.colors.textPrimary,
              fontSize: large ? theme.type.subhead : theme.type.body,
              fontWeight: large ? '800' : '600',
            },
          ]}
        />
        {showToggle && secureTextEntry && (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            style={styles.toggle}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={theme.colors.accent[400]}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 4,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 0,
    fontVariant: ['tabular-nums'],
  },
  toggle: { paddingHorizontal: 4, paddingVertical: 4 },
});
