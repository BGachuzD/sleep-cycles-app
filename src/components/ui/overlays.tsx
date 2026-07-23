import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  type BottomSheetModalProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, {
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
} from 'react-native-reanimated';

import { useAppTheme } from '@/theme/ThemeProvider';

import { CircularIconButton } from './buttons';

export function ModalOverlay({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { theme } = useAppTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(theme.motion.fast)}
        exiting={FadeOut.duration(theme.motion.fast)}
        style={{
          backgroundColor: theme.colors.overlay,
          flex: 1,
          justifyContent: 'center',
          padding: theme.spacing.xl,
        }}
      >
        <Pressable
          accessibilityLabel="Cerrar modal"
          onPress={onClose}
          style={{ ...StyleSheet.absoluteFillObject }}
        />
        <Animated.View
          entering={FadeInDown.duration(theme.motion.standard)}
          exiting={FadeOutDown.duration(theme.motion.fast)}
          style={{
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
            borderCurve: 'continuous',
            borderRadius: theme.radius.xxl,
            borderWidth: 1,
            boxShadow: theme.shadows.elevated,
            overflow: 'hidden',
          }}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  snapPoints = ['50%'],
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  snapPoints?: (string | number)[];
}) {
  const { theme } = useAppTheme();
  const ref = useRef<BottomSheetModal>(null);
  const isPresented = useRef(false);
  const pointsKey = snapPoints.join('|');
  // El caller suele pasar un literal; la clave evita recrear snapPoints en cada render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const points = useMemo(() => snapPoints, [pointsKey]);

  useEffect(() => {
    if (visible) {
      const frame = requestAnimationFrame(() => {
        ref.current?.present();
        isPresented.current = true;
      });
      return () => cancelAnimationFrame(frame);
    }
    if (isPresented.current) ref.current?.dismiss();
  }, [visible]);

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.72}
      pressBehavior="close"
    />
  );

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={points}
      enableDynamicSizing={false}
      onDismiss={() => {
        isPresented.current = false;
        if (visible) onClose();
      }}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: theme.colors.surfaceElevated,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.xxl,
        borderWidth: 1,
      }}
      handleIndicatorStyle={{
        backgroundColor: theme.colors.textMuted,
        width: 40,
      }}
    >
      <BottomSheetView
        style={{
          gap: theme.spacing.lg,
          paddingBottom: theme.spacing.xxxl,
          paddingHorizontal: theme.spacing.xl,
        }}
      >
        {title ? (
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
              }}
            >
              {title}
            </Text>
            <CircularIconButton
              icon="close"
              label="Cerrar"
              onPress={onClose}
              size={44}
            />
          </View>
        ) : null}
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

type AppBottomSheetModalProps = Omit<
  BottomSheetModalProps,
  'backgroundStyle' | 'backdropComponent' | 'handleIndicatorStyle'
>;

/** Apariencia y comportamiento compartidos para sheets controlados por ref. */
export const AppBottomSheetModal = forwardRef<
  BottomSheetModal,
  AppBottomSheetModalProps
>(function AppBottomSheetModal(props, ref) {
  const { theme } = useAppTheme();
  const renderBackdrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...backdropProps}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.68}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      {...props}
      ref={ref}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: theme.colors.surfaceElevated,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.xxl,
        borderWidth: 1,
      }}
      handleIndicatorStyle={{
        backgroundColor: theme.colors.textMuted,
        width: 40,
      }}
    />
  );
});
