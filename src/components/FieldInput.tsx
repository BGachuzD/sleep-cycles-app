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
  helperText?: string;
  error?: string;
  returnKeyType?: TextInputProps['returnKeyType'];
  textContentType?: TextInputProps['textContentType'];
  autoComplete?: TextInputProps['autoComplete'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
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
  helperText,
  error,
  returnKeyType,
  textContentType,
  autoComplete,
  onSubmitEditing,
  large = true,
}) => {
  const { theme } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const hide = secureTextEntry && !visible;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: error
              ? theme.colors.danger
              : focused
                ? theme.colors.accent[500]
                : theme.colors.border,
            borderWidth: focused || error ? 1.5 : 1,
            borderRadius: theme.radius.md,
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
            accessibilityLabel={label}
            aria-invalid={Boolean(error)}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            secureTextEntry={hide}
            returnKeyType={returnKeyType}
            textContentType={textContentType}
            autoComplete={autoComplete}
            onSubmitEditing={onSubmitEditing}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={[
              styles.input,
              {
                color: theme.colors.textPrimary,
                fontSize: large ? theme.type.subhead : theme.type.body,
                fontWeight: large ? '600' : '400',
              },
            ]}
          />
          {showToggle && secureTextEntry && (
            <Pressable
              onPress={() => setVisible((v) => !v)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={
                visible ? 'Ocultar contraseña' : 'Mostrar contraseña'
              }
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
      {error || helperText ? (
        <Text
          accessibilityLiveRegion={error ? 'polite' : 'none'}
          style={{
            color: error ? theme.colors.danger : theme.colors.textMuted,
            fontSize: theme.type.caption,
            lineHeight: theme.lineHeight.caption,
            paddingHorizontal: theme.spacing.md,
          }}
        >
          {error ?? helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 16,
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
  toggle: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
