import React, { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';

import { usePressScale } from '@/hooks/usePressScale';
import { useAppTheme } from '@/theme/ThemeProvider';

type IconName = keyof typeof Ionicons.glyphMap;

type PillButtonProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  trailingIcon?: IconName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PillButton({
  label,
  onPress,
  icon,
  trailingIcon,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: PillButtonProps) {
  const { theme } = useAppTheme();
  const press = usePressScale(theme.motion.pressScale);
  const blocked = disabled || loading;
  const isPrimary = variant === 'primary';
  const foreground = isPrimary
    ? theme.colors.white
    : variant === 'danger'
      ? theme.colors.danger
      : theme.colors.textPrimary;

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        icon && <Ionicons name={icon} size={20} color={foreground} />
      )}
      <Text
        style={{
          color: foreground,
          flex: 1,
          fontSize: theme.type.subhead,
          fontWeight: '700',
          lineHeight: theme.lineHeight.subhead,
          textAlign: icon || trailingIcon ? 'left' : 'center',
        }}
      >
        {label}
      </Text>
      {trailingIcon && !loading ? (
        <Ionicons name={trailingIcon} size={20} color={foreground} />
      ) : null}
    </>
  );

  return (
    <Animated.View style={[press.animatedStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: blocked }}
        disabled={blocked}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={{ opacity: blocked ? 0.46 : 1 }}
      >
        {isPrimary ? (
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.blue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              alignItems: 'center',
              borderCurve: 'continuous',
              borderRadius: theme.radius.full,
              boxShadow: theme.shadows.accent,
              flexDirection: 'row',
              gap: theme.spacing.md,
              minHeight: 56,
              paddingHorizontal: theme.spacing.xl,
              paddingVertical: theme.spacing.md,
            }}
          >
            {content}
          </LinearGradient>
        ) : (
          <Animated.View
            style={{
              alignItems: 'center',
              backgroundColor:
                variant === 'danger'
                  ? `${theme.colors.danger}14`
                  : variant === 'ghost'
                    ? 'transparent'
                    : theme.colors.surfaceElevated,
              borderColor:
                variant === 'danger'
                  ? `${theme.colors.danger}42`
                  : theme.colors.border,
              borderCurve: 'continuous',
              borderRadius: theme.radius.full,
              borderWidth: variant === 'ghost' ? 0 : 1,
              flexDirection: 'row',
              gap: theme.spacing.md,
              minHeight: 52,
              paddingHorizontal: theme.spacing.xl,
              paddingVertical: theme.spacing.md,
            }}
          >
            {content}
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

type CircularIconButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  size?: number;
  selected?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function CircularIconButton({
  icon,
  label,
  onPress,
  size = 48,
  selected = false,
  disabled = false,
  style,
}: CircularIconButtonProps) {
  const { theme } = useAppTheme();
  const press = usePressScale(theme.motion.pressScale);

  return (
    <Animated.View style={[press.animatedStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled, selected }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        hitSlop={4}
        style={{
          alignItems: 'center',
          backgroundColor: selected
            ? theme.colors.primary
            : `${theme.colors.surfaceElevated}F2`,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          borderRadius: size / 2,
          borderWidth: 1,
          boxShadow: theme.shadows.soft,
          height: Math.max(44, size),
          justifyContent: 'center',
          opacity: disabled ? 0.46 : 1,
          width: Math.max(44, size),
        }}
      >
        <Ionicons
          name={icon}
          size={Math.round(size * 0.45)}
          color={selected ? theme.colors.white : theme.colors.textPrimary}
        />
      </Pressable>
    </Animated.View>
  );
}

export function FloatingActionButton(props: CircularIconButtonProps) {
  return <CircularIconButton {...props} size={props.size ?? 60} selected />;
}
