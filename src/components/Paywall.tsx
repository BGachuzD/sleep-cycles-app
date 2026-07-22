import React, { FC, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { usePremium } from '../context/EntitlementsContext';
import { useAppTheme } from '../theme/ThemeProvider';
import { useToast } from './ui';
import type { AppTheme } from '../theme/theme';
import {
  getOfferings,
  isPurchasesConfigured,
  purchasePackage,
  restorePurchases,
  type PurchasePackage,
} from '../lib/purchases';

const PREMIUM_BENEFITS: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}> = [
  { icon: 'sparkles-outline', text: 'Análisis de tus sueños con IA' },
  {
    icon: 'git-compare-outline',
    text: 'Correlaciones avanzadas de sueño y hábitos',
  },
  { icon: 'trending-up-outline', text: 'Tendencias mensuales y anuales' },
  { icon: 'cloudy-night-outline', text: 'Bitácora de sueños sin límites' },
  { icon: 'flag-outline', text: 'Metas múltiples y coach proactivo' },
  { icon: 'document-text-outline', text: 'Reportes exportables de tu sueño' },
];

const PlanCard: FC<{
  pkg: PurchasePackage;
  selected: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ pkg, selected, onPress, theme }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`${pkg.title} ${pkg.priceString}`}
    style={[
      planStyles.card,
      {
        backgroundColor: selected
          ? `${theme.colors.accent[500]}14`
          : theme.colors.surface,
        borderColor: selected ? theme.colors.accent[500] : theme.colors.border,
        borderWidth: selected ? 1.5 : 1,
        borderRadius: theme.radius.lg,
      },
    ]}
  >
    <View style={{ flex: 1 }}>
      <Text style={[planStyles.title, { color: theme.colors.textPrimary }]}>
        {pkg.title}
      </Text>
      <Text style={[planStyles.price, { color: theme.colors.textSecondary }]}>
        {pkg.priceString}
      </Text>
    </View>
    <Ionicons
      name={selected ? 'radio-button-on' : 'radio-button-off'}
      size={20}
      color={selected ? theme.colors.accent[400] : theme.colors.textMuted}
    />
  </Pressable>
);

const planStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  title: { fontSize: 15, fontWeight: '700' },
  price: { fontSize: 13, fontWeight: '600', marginTop: 2 },
});

const PaywallContent: FC<{
  context?: string;
  onClose: () => void;
  onPurchased: () => Promise<void>;
}> = ({ context, onClose, onPurchased }) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const configured = isPurchasesConfigured();
  const { showToast } = useToast();

  const [packages, setPackages] = useState<PurchasePackage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOfferings().then((offerings) => {
      if (cancelled || !offerings) return;
      setPackages(offerings.packages);
      setSelectedId(offerings.packages[0]?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const notReady = () =>
    Alert.alert(
      'Muy pronto',
      'Las suscripciones estarán disponibles en cuanto activemos los pagos. ¡Gracias por tu interés en Mimebien Premium!',
      [{ text: 'Entendido', style: 'default' }],
    );

  const handleSubscribe = async () => {
    if (!configured || !selectedId) {
      notReady();
      return;
    }
    setBusy(true);
    try {
      const res = await purchasePackage(selectedId);
      if (res.isPremium) {
        await onPurchased();
        onClose();
        return;
      }
      if (res.error && res.error !== 'cancelled') {
        Alert.alert('No se pudo completar', 'Inténtalo de nuevo más tarde.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (!configured) {
      notReady();
      return;
    }
    setBusy(true);
    try {
      const res = await restorePurchases();
      if (res.isPremium) {
        await onPurchased();
        showToast({
          title: 'Suscripción restaurada',
          message: 'Tus funciones Premium ya están disponibles.',
        });
        onClose();
      } else {
        Alert.alert(
          'Sin compras',
          'No encontramos una suscripción activa para restaurar.',
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.closeRow}>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        >
          <Ionicons name="close" size={26} color={theme.colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[theme.colors.accent[500], theme.colors.accent[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { borderRadius: theme.radius.xl }]}
        >
          <View style={styles.heroBadge}>
            <Ionicons
              name="sparkles"
              size={11}
              color={theme.colors.accent[700]}
            />
            <Text style={styles.heroBadgeText}>PREMIUM</Text>
          </View>
          <Text style={styles.heroTitle}>
            Lleva tu sueño al siguiente nivel
          </Text>
          <Text style={styles.heroSubtitle}>
            {context ??
              'Desbloquea análisis profundo, IA de sueños e historial ilimitado.'}
          </Text>
        </LinearGradient>

        <View style={styles.benefits}>
          {PREMIUM_BENEFITS.map((b) => (
            <View key={b.text} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Ionicons
                  name={b.icon}
                  size={16}
                  color={theme.colors.accent[400]}
                />
              </View>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        {packages.length > 0 ? (
          <View style={styles.plans}>
            {packages.map((pkg) => (
              <PlanCard
                key={pkg.id}
                pkg={pkg}
                selected={selectedId === pkg.id}
                onPress={() => setSelectedId(pkg.id)}
                theme={theme}
              />
            ))}
          </View>
        ) : (
          <View style={styles.soonCard}>
            <Ionicons
              name="time-outline"
              size={18}
              color={theme.colors.accent[400]}
            />
            <Text style={styles.soonText}>
              Estamos afinando los planes. Muy pronto podrás suscribirte a
              Mimebien Premium.
            </Text>
          </View>
        )}

        <Pressable
          onPress={handleSubscribe}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Suscribirme a Premium"
          style={[
            styles.cta,
            {
              backgroundColor: theme.colors.accent[500],
              borderRadius: theme.radius.lg,
              opacity: busy ? 0.7 : 1,
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.ctaText}>
              {packages.length > 0 ? 'Suscribirme' : 'Quiero enterarme'}
            </Text>
          )}
        </Pressable>

        {configured && (
          <Pressable
            onPress={handleRestore}
            disabled={busy}
            style={styles.restoreBtn}
            accessibilityRole="button"
          >
            <Text style={styles.restoreText}>Restaurar compras</Text>
          </Pressable>
        )}

        <Text style={styles.finePrint}>
          La suscripción se renueva automáticamente. Puedes cancelarla cuando
          quieras desde los Ajustes de tu cuenta de Apple.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * Host del paywall: un modal montado una sola vez (en App.tsx) que se abre con
 * `presentPaywall()` desde cualquier parte de la app.
 */
export const PaywallHost: FC = () => {
  const { paywallVisible, paywallContext, dismissPaywall, refreshEntitlement } =
    usePremium();

  return (
    <Modal
      visible={paywallVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={dismissPaywall}
    >
      {paywallVisible && (
        <PaywallContent
          context={paywallContext}
          onClose={dismissPaywall}
          onPurchased={refreshEntitlement}
        />
      )}
    </Modal>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    closeRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
    },
    content: {
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing.huge,
      gap: theme.spacing.lg,
    },
    hero: {
      padding: theme.spacing.xl,
      gap: 8,
      boxShadow: theme.shadows.accent,
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.95)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    heroBadgeText: {
      color: theme.colors.accent[700],
      fontSize: theme.type.caption,
      fontWeight: '700',
      letterSpacing: 0.8,
    },
    heroTitle: {
      color: '#ffffff',
      fontSize: theme.type.title2,
      fontWeight: '700',
      letterSpacing: -0.5,
      marginTop: 6,
    },
    heroSubtitle: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: theme.type.body,
      lineHeight: 20,
    },
    benefits: { gap: theme.spacing.sm },
    benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    benefitIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: `${theme.colors.accent[500]}1F`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    benefitText: {
      flex: 1,
      color: theme.colors.textPrimary,
      fontSize: theme.type.body,
      fontWeight: '600',
    },
    plans: { gap: theme.spacing.sm },
    soonCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: theme.spacing.lg,
      backgroundColor: `${theme.colors.accent[500]}14`,
      borderColor: `${theme.colors.accent[500]}40`,
      borderWidth: 1,
      borderRadius: theme.radius.lg,
    },
    soonText: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: theme.type.small,
      lineHeight: 18,
    },
    cta: {
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaText: {
      color: '#ffffff',
      fontSize: theme.type.bodyLarge,
      fontWeight: '700',
    },
    restoreBtn: { alignItems: 'center', paddingVertical: 6 },
    restoreText: {
      color: theme.colors.accent[400],
      fontSize: theme.type.small,
      fontWeight: '700',
    },
    finePrint: {
      color: theme.colors.textMuted,
      fontSize: theme.type.caption,
      lineHeight: 16,
      textAlign: 'center',
    },
  });
