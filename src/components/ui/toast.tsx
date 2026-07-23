import { Ionicons } from '@expo/vector-icons';
import React, {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/ThemeProvider';

type ToastTone = 'success' | 'info' | 'warning' | 'danger';

type ToastInput = {
  title: string;
  message?: string;
  tone?: ToastTone;
  duration?: number;
};

type ToastValue = {
  showToast: (toast: ToastInput) => void;
  dismissToast: () => void;
};

const ToastContext = createContext<ToastValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastInput & { id: number }) | null>(
    null,
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setToast(null);
  }, []);

  const showToast = useCallback(
    (next: ToastInput) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast({ ...next, id: Date.now() });
      timeoutRef.current = setTimeout(dismissToast, next.duration ?? 2800);
    },
    [dismissToast],
  );

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const value = useMemo(
    () => ({ showToast, dismissToast }),
    [dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toast={toast} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toast,
}: {
  toast: (ToastInput & { id: number }) | null;
}) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  if (!toast) return null;

  const tone = toast.tone ?? 'success';
  const color = theme.colors[tone];
  const icon: keyof typeof Ionicons.glyphMap =
    tone === 'success'
      ? 'checkmark-circle'
      : tone === 'danger'
        ? 'alert-circle'
        : tone === 'warning'
          ? 'warning'
          : 'information-circle';

  return (
    <View
      pointerEvents="none"
      style={{
        left: theme.spacing.lg,
        position: 'absolute',
        right: theme.spacing.lg,
        top: insets.top + theme.spacing.sm,
        zIndex: 1000,
      }}
    >
      <Animated.View
        key={toast.id}
        accessibilityLiveRegion="polite"
        accessible
        accessibilityLabel={`${toast.title}${toast.message ? `. ${toast.message}` : ''}`}
        entering={FadeInDown.duration(theme.motion.standard)}
        exiting={FadeOutUp.duration(theme.motion.fast)}
        style={{
          alignItems: 'center',
          backgroundColor: `${theme.colors.surfaceSecondary}FA`,
          borderColor: theme.colors.borderStrong,
          borderCurve: 'continuous',
          borderRadius: theme.radius.md,
          borderWidth: 1,
          boxShadow: theme.shadows.floating,
          flexDirection: 'row',
          gap: theme.spacing.md,
          minHeight: 60,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        }}
      >
        <View
          style={{
            alignItems: 'center',
            backgroundColor: `${color}1F`,
            borderRadius: 18,
            height: 36,
            justifyContent: 'center',
            width: 36,
          }}
        >
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              color: theme.colors.textPrimary,
              fontSize: theme.type.body,
              fontWeight: '600',
            }}
          >
            {toast.title}
          </Text>
          {toast.message ? (
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.type.caption,
                lineHeight: theme.lineHeight.caption,
              }}
            >
              {toast.message}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

export function useToast(): ToastValue {
  const context = use(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
