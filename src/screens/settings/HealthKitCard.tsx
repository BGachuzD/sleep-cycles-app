import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { useHealthKit } from '../../hooks/useHealthKit';
import { usePressScale } from '../../hooks/usePressScale';
import type { AppTheme } from '../../theme/theme';

// ─────────────────────────────────────────────
// HealthKitCard: estado de la conexión + acciones de debug
// ─────────────────────────────────────────────
export const HealthKitCard: FC<{ theme: AppTheme }> = ({ theme }) => {
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
            <Ionicons
              name="heart-outline"
              size={18}
              color={theme.colors.textMuted}
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
          Apple Salud solo está disponible en iPhone físico con iOS. En
          simulador o Android, esta sección se mantiene inactiva.
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
              hk.isAuthorized ? theme.colors.success : theme.colors.accent[400]
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
  title: { fontWeight: '700' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
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
    fontWeight: '700',
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
    fontWeight: '700',
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
