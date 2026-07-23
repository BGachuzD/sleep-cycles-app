import { Ionicons } from '@expo/vector-icons';
import React, { type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';

type IconName = keyof typeof Ionicons.glyphMap;

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  const { theme } = useAppTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        gap: theme.spacing.md,
      }}
    >
      <Text
        style={{
          color: theme.colors.textPrimary,
          flex: 1,
          fontSize: theme.type.title3,
          fontWeight: '600',
          lineHeight: theme.lineHeight.title3,
        }}
      >
        {title}
      </Text>
      {action}
    </View>
  );
}

export function Badge({
  label,
  tone = 'accent',
}: {
  label: string;
  tone?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const { theme } = useAppTheme();
  const color =
    tone === 'neutral'
      ? theme.colors.textSecondary
      : tone === 'accent'
        ? theme.colors.violet
        : theme.colors[tone];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: `${color}18`,
        borderColor: `${color}42`,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
      }}
    >
      <Text style={{ color, fontSize: theme.type.caption, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

export function ListItem({
  title,
  subtitle,
  icon,
  onPress,
  trailing,
  destructive = false,
  style,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  onPress?: () => void;
  trailing?: ReactNode;
  destructive?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useAppTheme();
  const color = destructive ? theme.colors.danger : theme.colors.textPrimary;
  const body = (
    <View
      style={[
        {
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderCurve: 'continuous',
          borderRadius: theme.radius.md,
          borderWidth: 1,
          flexDirection: 'row',
          gap: theme.spacing.md,
          minHeight: 60,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        },
        style,
      ]}
    >
      {icon ? (
        <View
          style={{
            alignItems: 'center',
            backgroundColor: `${destructive ? theme.colors.danger : theme.colors.violet}18`,
            borderRadius: 18,
            height: 36,
            justifyContent: 'center',
            width: 36,
          }}
        >
          <Ionicons
            name={icon}
            size={19}
            color={destructive ? theme.colors.danger : theme.colors.violet}
          />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color, fontSize: theme.type.body, fontWeight: '600' }}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.type.caption,
              lineHeight: theme.lineHeight.caption,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ??
        (onPress ? (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.textMuted}
          />
        ) : null)}
    </View>
  );

  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {body}
    </Pressable>
  ) : (
    body
  );
}

export function EmptyState({
  icon = 'moon-outline',
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const { theme } = useAppTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.xxl,
        paddingVertical: theme.spacing.xxxl,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: `${theme.colors.violet}18`,
          borderRadius: 32,
          height: 64,
          justifyContent: 'center',
          width: 64,
        }}
      >
        <Ionicons name={icon} size={28} color={theme.colors.violet} />
      </View>
      <Text
        style={{
          color: theme.colors.textPrimary,
          fontSize: theme.type.title3,
          fontWeight: '600',
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.type.body,
          lineHeight: theme.lineHeight.body,
          textAlign: 'center',
        }}
      >
        {description}
      </Text>
      {action}
    </View>
  );
}

export function AvatarItem({
  label,
  image,
  onPress,
}: {
  label: string;
  image?: ReactNode;
  onPress?: () => void;
}) {
  const { theme } = useAppTheme();
  const avatar = image ?? (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: `${theme.colors.violet}1F`,
        borderColor: `${theme.colors.violet}42`,
        borderRadius: 26,
        borderWidth: 1,
        height: 52,
        justifyContent: 'center',
        width: 52,
      }}
    >
      <Text
        style={{
          color: theme.colors.violet,
          fontSize: theme.type.title3,
          fontWeight: '600',
        }}
      >
        {label.trim().charAt(0).toUpperCase() || '•'}
      </Text>
    </View>
  );
  return (
    <View style={{ alignItems: 'center', gap: 6, width: 68 }}>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
        >
          {avatar}
        </Pressable>
      ) : (
        avatar
      )}
      <Text
        numberOfLines={1}
        style={{
          color: theme.colors.textSecondary,
          fontSize: 12,
          textAlign: 'center',
          width: '100%',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function HorizontalAvatarList({ children }: { children: ReactNode }) {
  const { theme } = useAppTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
      }}
    >
      {children}
    </ScrollView>
  );
}
