import React from 'react';
import { Text, View } from 'react-native';
import { StackActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircularIconButton } from './ui';
import { useAppTheme } from '../theme/ThemeProvider';

interface Props {
  insideSafeArea?: boolean;
  fallbackRoute?: string;
}

const ROUTE_TITLES: Record<string, string> = {
  DeleteAccount: 'Eliminar cuenta',
  DreamJournal: 'Bitácora de sueños',
  Nap: 'Siesta',
  Notifications: 'Notificaciones',
  Settings: 'Configuración',
  SleepNow: 'Dormir ahora',
  SleepProfile: 'Perfil de sueño',
  SleepRoutine: 'Rutina',
  SmartWake: 'Despertar inteligente',
  Stats: 'Estadísticas',
  WakeAt: 'Hora de despertar',
};

/** Cabecera flotante contextual, visible únicamente en rutas apiladas. */
export const FloatingHomeButton: React.FC<Props> = ({
  insideSafeArea = false,
  fallbackRoute,
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const state = navigation.getState();
  const canPop = state?.type === 'stack' && state.index > 0;
  if (!canPop && !fallbackRoute) return null;

  const routeName = state ? state.routes[state.index]?.name : undefined;
  const title = routeName ? ROUTE_TITLES[routeName] : undefined;

  return (
    <View
      pointerEvents="box-none"
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        gap: theme.spacing.sm,
        left: theme.spacing.lg,
        position: 'absolute',
        right: theme.spacing.lg,
        top: insets.top + (insideSafeArea ? 8 : 12),
        zIndex: 100,
      }}
    >
      <CircularIconButton
        icon="chevron-back"
        label="Volver"
        onPress={() => {
          if (canPop) {
            navigation.goBack();
            return;
          }
          if (fallbackRoute) {
            navigation.dispatch(StackActions.replace(fallbackRoute));
          }
        }}
      />
      {title ? (
        <View
          style={{
            backgroundColor: `${theme.colors.surfaceElevated}F2`,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.full,
            borderWidth: 1,
            boxShadow: theme.shadows.soft,
            justifyContent: 'center',
            minHeight: 44,
            paddingHorizontal: theme.spacing.lg,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              color: theme.colors.textPrimary,
              fontSize: theme.type.small,
              fontWeight: '600',
            }}
          >
            {title}
          </Text>
        </View>
      ) : null}
    </View>
  );
};
