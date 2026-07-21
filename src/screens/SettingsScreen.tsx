// src/screens/SettingsScreen.tsx
import React, { FC, useMemo } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { GradientBackground } from '../components/GradientBackground';
import { FloatingDrawerButton } from '../components/FloatingDrawerButton';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { usePressScale } from '../hooks/usePressScale';
import { usePremium } from '../context/EntitlementsContext';
import { useHealthKit } from '../hooks/useHealthKit';
import { useOnboardingFlag } from '../hooks/useOnboardingFlag';
import { useAppTheme } from '../theme/ThemeProvider';
import { resolveAutoThemeByHour } from '../theme/theme';
import type { AppTheme, ThemeMode } from '../theme/theme';

// URLs placeholder — actualizar cuando exista la landing definitiva.
const LANDING_URL = 'https://mimebien.com';
const PRIVACY_URL = 'https://mimebien.com/privacy';
const TERMS_URL = 'https://mimebien.com/terms';

// ─────────────────────────────────────────────
// ThemeOption
// ─────────────────────────────────────────────
const ThemeOption: FC<{
  value: ThemeMode;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ label, description, icon, selected, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          optionStyles.option,
          {
            backgroundColor: selected
              ? `${theme.colors.accent[500]}14`
              : theme.colors.surface,
            borderColor: selected
              ? theme.colors.accent[500]
              : theme.colors.border,
            borderWidth: selected ? 1.5 : 1,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <View
          style={[
            optionStyles.iconCircle,
            {
              backgroundColor: selected
                ? theme.colors.accent[500]
                : `${theme.colors.accent[500]}1F`,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={selected ? theme.colors.white : theme.colors.accent[400]}
          />
        </View>

        <View style={optionStyles.textCol}>
          <Text
            style={[
              optionStyles.label,
              {
                color: selected
                  ? theme.colors.textPrimary
                  : theme.colors.textSecondary,
                fontSize: theme.type.bodyLarge,
              },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              optionStyles.description,
              { color: theme.colors.textMuted, fontSize: theme.type.small },
            ]}
          >
            {description}
          </Text>
        </View>

        {selected && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={theme.colors.accent[400]}
          />
        )}
      </Pressable>
    </Animated.View>
  );
};

const optionStyles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  label: { fontWeight: '800' },
  description: { lineHeight: 17, marginTop: 2 },
});

// ─────────────────────────────────────────────
// LinkRow para legal y externos
// ─────────────────────────────────────────────
const LinkRow: FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  external?: boolean;
  onPress: () => void;
  theme: AppTheme;
}> = ({ icon, label, hint, external, onPress, theme }) => {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          linkStyles.row,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <View
          style={[
            linkStyles.iconCircle,
            { backgroundColor: `${theme.colors.accent[500]}1A` },
          ]}
        >
          <Ionicons name={icon} size={16} color={theme.colors.accent[400]} />
        </View>
        <View style={linkStyles.textCol}>
          <Text
            style={[
              linkStyles.label,
              { color: theme.colors.textPrimary, fontSize: theme.type.body },
            ]}
          >
            {label}
          </Text>
          {hint && (
            <Text
              style={[
                linkStyles.hint,
                { color: theme.colors.textMuted, fontSize: theme.type.caption },
              ]}
            >
              {hint}
            </Text>
          )}
        </View>
        <Ionicons
          name={external ? 'open-outline' : 'chevron-forward'}
          size={16}
          color={theme.colors.textMuted}
        />
      </Pressable>
    </Animated.View>
  );
};

const linkStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 2 },
  label: { fontWeight: '700' },
  hint: { fontWeight: '600' },
});

// ─────────────────────────────────────────────
// HealthKitCard: estado de la conexión + acciones de debug
// ─────────────────────────────────────────────
const HealthKitCard: FC<{ theme: AppTheme }> = ({ theme }) => {
  const hk = useHealthKit();
  const connectScale = usePressScale(0.97);
  const resetScale = usePressScale(0.97);
  const resyncScale = usePressScale(0.97);
  const openSettingsScale = usePressScale(0.97);

  if (!hk.isAvailable) {
    return (
      <View
        style={[
          hkStyles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <View style={hkStyles.headerRow}>
          <View
            style={[
              hkStyles.iconCircle,
              { backgroundColor: `${theme.colors.textMuted}1F` },
            ]}
          >
            <Ionicons name="heart-outline" size={18} color={theme.colors.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                hkStyles.title,
                { color: theme.colors.textPrimary, fontSize: theme.type.body },
              ]}
            >
              Apple Salud
            </Text>
            <Text
              style={[
                hkStyles.status,
                { color: theme.colors.textMuted, fontSize: theme.type.caption },
              ]}
            >
              No disponible en este dispositivo
            </Text>
          </View>
        </View>
        <Text
          style={[
            hkStyles.hint,
            { color: theme.colors.textMuted, fontSize: theme.type.caption },
          ]}
        >
          Apple Salud solo está disponible en iPhone físico con iOS. En simulador
          o Android, esta sección se mantiene inactiva.
        </Text>
      </View>
    );
  }

  const statusLabel = hk.isLoading
    ? 'Verificando…'
    : hk.isAuthorized
      ? 'Conectado'
      : 'No conectado';
  const statusColor = hk.isLoading
    ? theme.colors.textMuted
    : hk.isAuthorized
      ? theme.colors.success
      : theme.colors.warning;

  const handleConnect = async () => {
    // Si Apple ya tiene la decisión guardada (porque antes diste permiso y
    // luego solo "Reseteaste" la conexión local), `requestAuthorization` ni
    // siquiera muestra el diálogo y resuelve casi instantáneamente. Usamos
    // un timestamp para detectarlo y dar feedback claro al usuario.
    const startedAt = Date.now();
    const ok = await hk.requestPermissions();
    const elapsed = Date.now() - startedAt;
    const wasSilent = ok && elapsed < 400;

    if (!ok) {
      Alert.alert(
        'Permiso no concedido',
        'Si rechazaste el permiso, iOS no volverá a mostrar el diálogo. Actívalo manualmente en Ajustes → Privacidad y seguridad → Salud → Mimebien.',
        [
          { text: 'Entendido', style: 'default' },
          {
            text: 'Abrir Ajustes',
            onPress: () => Linking.openSettings().catch(() => {}),
          },
        ],
      );
      return;
    }

    if (wasSilent) {
      Alert.alert(
        'Reconectado',
        'iOS recordaba tu permiso anterior, así que la app se reconectó sin pedir confirmación.',
      );
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Resetear conexión local',
      'Mimebien olvidará la conexión con Salud. El banner volverá a aparecer y los datos importados perderán su etiqueta.\n\nImportante: el permiso que diste en iOS NO se revoca desde aquí (Apple no lo permite por seguridad). Si tap "Conectar" de nuevo, se reconectará automáticamente sin pedir confirmación.\n\nPara revocar el permiso completamente, abre Ajustes del sistema después.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetear',
          style: 'destructive',
          onPress: async () => {
            await hk.resetConnection();
            // Después del reset, ofrecer ir directo a Ajustes para que
            // la desconexión sea efectiva tanto local como en iOS.
            Alert.alert(
              'Conexión local reseteada',
              '¿Quieres ir a Ajustes para revocar también el permiso de iOS? Es el único lugar donde puedes hacerlo.',
              [
                { text: 'Después', style: 'cancel' },
                {
                  text: 'Abrir Ajustes',
                  onPress: () => Linking.openSettings().catch(() => {}),
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handleResync = () => {
    Alert.alert(
      'Resincronizar histórico',
      'Volveremos a importar las últimas 30 noches de Salud al diario. Las noches que ya tengas registradas no se duplican.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resincronizar',
          onPress: () => {
            // force re-ejecuta aunque el flag de sync ya exista; el propio
            // import muestra el resumen (n noches o "sin noches nuevas").
            hk.runHistoricalImport({ force: true });
          },
        },
      ],
    );
  };

  return (
    <View
      style={[
        hkStyles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <View style={hkStyles.headerRow}>
        <View
          style={[
            hkStyles.iconCircle,
            {
              backgroundColor: hk.isAuthorized
                ? `${theme.colors.success}1F`
                : `${theme.colors.accent[500]}1F`,
            },
          ]}
        >
          <Ionicons
            name="heart"
            size={18}
            color={
              hk.isAuthorized
                ? theme.colors.success
                : theme.colors.accent[400]
            }
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              hkStyles.title,
              { color: theme.colors.textPrimary, fontSize: theme.type.body },
            ]}
          >
            Apple Salud
          </Text>
          <View style={hkStyles.statusRow}>
            <View
              style={[hkStyles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text
              style={[
                hkStyles.status,
                { color: statusColor, fontSize: theme.type.caption },
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>
      </View>

      <Text
        style={[
          hkStyles.hint,
          { color: theme.colors.textMuted, fontSize: theme.type.caption },
        ]}
      >
        {hk.isAuthorized
          ? 'Importa tus registros de sueño automáticamente. Tus datos no salen de tu dispositivo.'
          : 'Conecta con Salud para importar tus noches automáticamente desde el Apple Watch o iPhone Bedtime. La gestión real del permiso vive en Ajustes del sistema.'}
      </Text>

      {/* Acciones */}
      <View style={hkStyles.actions}>
        {!hk.isAuthorized ? (
          <Animated.View style={[{ flex: 1 }, connectScale.animatedStyle]}>
            <Pressable
              onPress={handleConnect}
              onPressIn={connectScale.onPressIn}
              onPressOut={connectScale.onPressOut}
              disabled={hk.isLoading}
              accessibilityRole="button"
              accessibilityLabel="Conectar con Salud"
              style={[
                hkStyles.primaryBtn,
                {
                  backgroundColor: theme.colors.accent[500],
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <Ionicons name="link" size={14} color={theme.colors.white} />
              <Text style={hkStyles.primaryBtnText}>Conectar</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <>
            <Animated.View style={[{ flex: 1 }, resyncScale.animatedStyle]}>
              <Pressable
                onPress={handleResync}
                onPressIn={resyncScale.onPressIn}
                onPressOut={resyncScale.onPressOut}
                accessibilityRole="button"
                accessibilityLabel="Resincronizar histórico"
                style={[
                  hkStyles.secondaryBtn,
                  {
                    backgroundColor: `${theme.colors.accent[500]}1A`,
                    borderColor: `${theme.colors.accent[500]}40`,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <Ionicons
                  name="refresh"
                  size={14}
                  color={theme.colors.accent[400]}
                />
                <Text
                  style={[
                    hkStyles.secondaryBtnText,
                    { color: theme.colors.accent[300] },
                  ]}
                >
                  Resincronizar
                </Text>
              </Pressable>
            </Animated.View>
            <Animated.View style={[{ flex: 1 }, resetScale.animatedStyle]}>
              <Pressable
                onPress={handleReset}
                onPressIn={resetScale.onPressIn}
                onPressOut={resetScale.onPressOut}
                accessibilityRole="button"
                accessibilityLabel="Resetear conexión"
                style={[
                  hkStyles.secondaryBtn,
                  {
                    backgroundColor: `${theme.colors.danger}14`,
                    borderColor: `${theme.colors.danger}40`,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={14}
                  color={theme.colors.danger}
                />
                <Text
                  style={[
                    hkStyles.secondaryBtnText,
                    { color: theme.colors.danger },
                  ]}
                >
                  Resetear
                </Text>
              </Pressable>
            </Animated.View>
          </>
        )}
      </View>

      {/* Link a Ajustes de iOS */}
      <Animated.View style={openSettingsScale.animatedStyle}>
        <Pressable
          onPress={() => Linking.openSettings().catch(() => {})}
          onPressIn={openSettingsScale.onPressIn}
          onPressOut={openSettingsScale.onPressOut}
          accessibilityRole="button"
          style={hkStyles.systemLink}
        >
          <Ionicons
            name="settings-outline"
            size={13}
            color={theme.colors.textMuted}
          />
          <Text
            style={[
              hkStyles.systemLinkText,
              { color: theme.colors.textMuted, fontSize: theme.type.caption },
            ]}
          >
            Abrir Ajustes del sistema
          </Text>
          <Ionicons
            name="open-outline"
            size={12}
            color={theme.colors.textMuted}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
};

const hkStyles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 12,
    borderWidth: 1,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: '800' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  status: { fontWeight: '700', letterSpacing: 0.3 },
  hint: { lineHeight: 16 },
  actions: { flexDirection: 'row', gap: 8 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  systemLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  systemLinkText: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

// ─────────────────────────────────────────────
// SettingsScreen
// ─────────────────────────────────────────────
export const SettingsScreen: FC = () => {
  const { theme, mode, setMode } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { resetOnboarding } = useOnboardingFlag();
  const { presentPaywall } = usePremium();

  // Al resetear el flag, el navigator raíz muestra el recorrido de nuevo.
  const handleReplayTour = () => {
    Alert.alert(
      'Ver recorrido',
      'Volverás a ver la introducción de la app. Tu perfil y tus registros no se tocan.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ver recorrido',
          onPress: () => {
            resetOnboarding().catch(() => {});
          },
        },
      ],
    );
  };

  const themeOptions: Array<{
    value: ThemeMode;
    label: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    {
      value: 'auto',
      label: 'Automático',
      description: 'Claro de 7am a 7pm · Oscuro el resto',
      icon: 'partly-sunny-outline',
    },
    {
      value: 'light',
      label: 'Claro',
      description: 'Siempre tema claro',
      icon: 'sunny-outline',
    },
    {
      value: 'dark',
      label: 'Oscuro',
      description: 'Siempre tema oscuro',
      icon: 'moon-outline',
    },
  ];

  const resolvedFromAuto = mode === 'auto' ? resolveAutoThemeByHour() : null;
  const activeThemeName = theme.name === 'dark' ? 'Oscuro' : 'Claro';

  const openExternal = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'No se pudo abrir el enlace',
        'Verifica tu conexión a internet o inténtalo más tarde.',
      );
    });
  };

  const openPremium = () => presentPaywall();

  const premiumScale = usePressScale(0.97);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <GradientBackground />
      <FloatingDrawerButton insideSafeArea />
      <FloatingHomeButton insideSafeArea />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
          <Text style={styles.heroEyebrow}>CONFIGURACIÓN</Text>
          <Text style={styles.heroTitle}>Apariencia y cuenta</Text>
          <Text style={styles.heroSubtitle}>
            Personaliza la app, gestiona tu plan y revisa nuestros términos.
          </Text>
        </Animated.View>

        {/* Premium hero */}
        <Animated.View
          entering={FadeInUp.delay(60).duration(500)}
          style={premiumScale.animatedStyle}
        >
          <Pressable
            onPress={openPremium}
            onPressIn={premiumScale.onPressIn}
            onPressOut={premiumScale.onPressOut}
            accessibilityRole="button"
            accessibilityLabel="Conocer Mimebien Premium"
          >
            <LinearGradient
              colors={[theme.colors.accent[500], theme.colors.accent[700]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.premiumCard,
                {
                  borderRadius: theme.radius.xl,
                  shadowColor: theme.colors.accent[600],
                },
              ]}
            >
              <View style={styles.premiumTopRow}>
                <View style={styles.premiumBadge}>
                  <Ionicons
                    name="sparkles"
                    size={11}
                    color={theme.colors.accent[700]}
                  />
                  <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                </View>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={theme.colors.white}
                />
              </View>
              <Text style={styles.premiumTitle}>
                Lleva tu sueño al siguiente nivel
              </Text>
              <Text style={styles.premiumSubtitle}>
                Análisis profundo, sincronización extendida y funciones
                exclusivas para suscriptores.
              </Text>
              <View style={styles.premiumPillsRow}>
                <View style={styles.premiumPill}>
                  <Ionicons
                    name="analytics-outline"
                    size={12}
                    color={theme.colors.white}
                  />
                  <Text style={styles.premiumPillText}>Análisis avanzado</Text>
                </View>
                <View style={styles.premiumPill}>
                  <Ionicons
                    name="cloud-outline"
                    size={12}
                    color={theme.colors.white}
                  />
                  <Text style={styles.premiumPillText}>
                    Historial ilimitado
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Preview tema activo */}
        <Animated.View entering={FadeInUp.delay(120).duration(500)}>
          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.xl,
              },
            ]}
          >
            <View
              style={[
                styles.previewIconCircle,
                { backgroundColor: `${theme.colors.accent[500]}1F` },
              ]}
            >
              <Ionicons
                name={theme.name === 'dark' ? 'moon' : 'sunny'}
                size={22}
                color={theme.colors.accent[400]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewEyebrow}>TEMA ACTIVO</Text>
              <Text style={styles.previewName}>{activeThemeName}</Text>
              {mode === 'auto' && resolvedFromAuto && (
                <Text style={styles.previewSubtitle}>
                  resuelto desde modo automático
                </Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Sección tema */}
        <Animated.View entering={FadeInUp.delay(180).duration(500)}>
          <Text style={styles.sectionEyebrow}>TEMA DE COLOR</Text>
          <View style={styles.optionsList}>
            {themeOptions.map((opt) => (
              <ThemeOption
                key={opt.value}
                {...opt}
                selected={mode === opt.value}
                onPress={() => setMode(opt.value)}
                theme={theme}
              />
            ))}
          </View>
        </Animated.View>

        {/* Sección Conexiones (HealthKit) */}
        <Animated.View entering={FadeInUp.delay(220).duration(500)}>
          <Text style={styles.sectionEyebrow}>CONEXIONES</Text>
          <HealthKitCard theme={theme} />
        </Animated.View>

        {/* Sección Ayuda */}
        <Animated.View entering={FadeInUp.delay(240).duration(500)}>
          <Text style={styles.sectionEyebrow}>AYUDA</Text>
          <View style={styles.optionsList}>
            <LinkRow
              icon="map-outline"
              label="Ver recorrido de la app"
              hint="Repasa cómo funciona Mimebien"
              onPress={handleReplayTour}
              theme={theme}
            />
          </View>
        </Animated.View>

        {/* Sección Legal y enlaces */}
        <Animated.View entering={FadeInUp.delay(260).duration(500)}>
          <Text style={styles.sectionEyebrow}>LEGAL Y ENLACES</Text>
          <View style={styles.optionsList}>
            <LinkRow
              icon="globe-outline"
              label="Sitio web"
              hint="mimebien.com"
              external
              onPress={() => openExternal(LANDING_URL)}
              theme={theme}
            />
            <LinkRow
              icon="document-text-outline"
              label="Términos y condiciones"
              external
              onPress={() => openExternal(TERMS_URL)}
              theme={theme}
            />
            <LinkRow
              icon="shield-checkmark-outline"
              label="Política de privacidad"
              external
              onPress={() => openExternal(PRIVACY_URL)}
              theme={theme}
            />
          </View>
        </Animated.View>

        <View style={{ height: theme.spacing.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.huge + theme.spacing.xxl,
      paddingBottom: theme.spacing.huge,
      gap: theme.spacing.lg,
    },
    hero: { gap: 4 },
    heroEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    heroTitle: {
      color: theme.colors.textPrimary,
      fontSize: theme.type.title2,
      fontWeight: '900',
      letterSpacing: -0.5,
      marginTop: 4,
    },
    heroSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.type.body,
      lineHeight: 20,
      marginTop: 6,
    },
    // Premium
    premiumCard: {
      padding: theme.spacing.xl,
      gap: 10,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 6,
    },
    premiumTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    premiumBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255,255,255,0.95)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    premiumBadgeText: {
      color: theme.colors.accent[700],
      fontSize: theme.type.caption,
      fontWeight: '900',
      letterSpacing: 0.8,
    },
    premiumTitle: {
      color: '#ffffff',
      fontSize: theme.type.title3,
      fontWeight: '900',
      letterSpacing: -0.3,
      marginTop: 4,
    },
    premiumSubtitle: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: theme.type.small,
      lineHeight: 18,
    },
    premiumPillsRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
      flexWrap: 'wrap',
    },
    premiumPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderColor: 'rgba(255,255,255,0.28)',
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
    },
    premiumPillText: {
      color: '#ffffff',
      fontSize: theme.type.caption,
      fontWeight: '700',
    },
    // Preview tema
    previewCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: theme.spacing.lg,
      borderWidth: 1,
    },
    previewIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    previewName: {
      color: theme.colors.heroText,
      fontSize: theme.type.title3,
      fontWeight: '900',
      letterSpacing: -0.5,
      marginTop: 2,
    },
    previewSubtitle: {
      color: theme.colors.textMuted,
      fontSize: theme.type.caption,
      fontWeight: '600',
      marginTop: 2,
    },
    sectionEyebrow: {
      color: theme.colors.textMuted,
      fontSize: theme.type.micro,
      fontWeight: '700',
      letterSpacing: 1.2,
      marginBottom: 8,
    },
    optionsList: { gap: theme.spacing.sm },
  });
