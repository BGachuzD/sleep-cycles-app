import { Ionicons } from '@expo/vector-icons';
import React, { type ReactNode } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';

type SearchPillProps = Pick<
  TextInputProps,
  'value' | 'onChangeText' | 'placeholder' | 'onSubmitEditing'
>;

export function SearchPill(props: SearchPillProps) {
  const { theme } = useAppTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: `${theme.colors.surfaceElevated}F2`,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        flex: 1,
        flexDirection: 'row',
        gap: theme.spacing.sm,
        minHeight: 48,
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      <Ionicons
        name="search-outline"
        size={20}
        color={theme.colors.textMuted}
      />
      <TextInput
        {...props}
        accessibilityLabel={props.placeholder ?? 'Buscar'}
        placeholderTextColor={theme.colors.textMuted}
        returnKeyType="search"
        style={{
          color: theme.colors.textPrimary,
          flex: 1,
          fontSize: theme.type.body,
          minHeight: 44,
          paddingVertical: 0,
        }}
      />
    </View>
  );
}

export function FloatingHeader({
  leading,
  center,
  trailing,
}: {
  leading?: ReactNode;
  center?: ReactNode;
  trailing?: ReactNode;
}) {
  const { theme } = useAppTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        gap: theme.spacing.md,
        minHeight: 48,
        paddingHorizontal: theme.spacing.xl,
      }}
    >
      {leading}
      <View style={{ flex: 1 }}>{center}</View>
      {trailing}
    </View>
  );
}
