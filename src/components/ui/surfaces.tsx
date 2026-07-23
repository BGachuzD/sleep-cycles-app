import React, { type ReactNode } from 'react';
import {
  type StyleProp,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';

type SurfaceProps = ViewProps & {
  children: ReactNode;
  elevated?: boolean;
  padding?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ElevatedSurface({
  children,
  elevated = true,
  padding = true,
  style,
  ...props
}: SurfaceProps) {
  const { theme } = useAppTheme();

  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: elevated
            ? theme.colors.surfaceElevated
            : theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderCurve: 'continuous',
          borderRadius: theme.radius.lg,
          boxShadow: elevated ? theme.shadows.soft : undefined,
          padding: padding ? theme.spacing.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function RoundedCard(props: SurfaceProps) {
  const { theme } = useAppTheme();
  return (
    <ElevatedSurface
      {...props}
      style={[{ borderRadius: theme.radius.xl }, props.style]}
    />
  );
}
