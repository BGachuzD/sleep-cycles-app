import React, { type ReactNode } from 'react';
import { ScrollView, type StyleProp, View, type ViewStyle } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/ThemeProvider';

export function ScreenContainer({
  children,
  scroll = true,
  edges = ['top', 'bottom'],
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { theme } = useAppTheme();
  const content = {
    flexGrow: scroll ? 1 : undefined,
    gap: theme.spacing.xxl,
    paddingBottom: theme.spacing.huge,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  } satisfies ViewStyle;

  return (
    <SafeAreaView
      edges={edges}
      style={{ backgroundColor: theme.colors.background, flex: 1 }}
    >
      {scroll ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
