import { Ionicons } from '@expo/vector-icons';
import { FC } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { AppTheme } from '../../theme/theme';
import { createStyles } from './styles';

// ─── Step 1: Warning ─────────────────────────────────────────────────────────

export const WarningStep: FC<{
  onConfirm: () => void;
  theme: AppTheme;
  styles: ReturnType<typeof createStyles>;
}> = ({ onConfirm, theme, styles }) => (
  <View style={styles.stepContainer}>
    <View style={styles.dangerIconCircle}>
      <Ionicons name="warning" size={36} color={theme.colors.danger} />
    </View>

    <Text style={styles.stepTitle}>Esta acción es permanente</Text>
    <Text style={styles.stepSubtitle}>
      Al eliminar tu cuenta se borrarán de forma permanente:
    </Text>

    <View style={styles.listCard}>
      {[
        { icon: 'person-outline', text: 'Tu cuenta y credenciales de acceso' },
        { icon: 'journal-outline', text: 'Todo tu diario de sueño' },
        { icon: 'list-outline', text: 'Tu rutina pre-sueño personalizada' },
        {
          icon: 'person-circle-outline',
          text: 'Tu perfil de sueño (edad, peso, etc.)',
        },
        {
          icon: 'notifications-outline',
          text: 'Tus recordatorios y preferencias',
        },
      ].map((item) => (
        <View key={item.text} style={styles.listRow}>
          <Ionicons
            name={item.icon as any}
            size={16}
            color={theme.colors.danger}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.listRowText}>{item.text}</Text>
        </View>
      ))}
    </View>

    <View style={styles.infoCard}>
      <Ionicons
        name="information-circle-outline"
        size={18}
        color={theme.colors.info}
        style={{ marginRight: 8, marginTop: 1 }}
      />
      <Text style={styles.infoText}>
        No se conserva ningún dato. Esta operación no se puede deshacer.
      </Text>
    </View>

    <TouchableOpacity
      style={styles.continueBtn}
      onPress={onConfirm}
      activeOpacity={0.8}
    >
      <Ionicons
        name="trash-outline"
        size={18}
        color={theme.colors.white}
        style={{ marginRight: 8 }}
      />
      <Text style={styles.continueBtnText}>Quiero eliminar mi cuenta</Text>
    </TouchableOpacity>
  </View>
);

// ─── Step 2: Re-authentication ────────────────────────────────────────────────

export const ReauthStep: FC<{
  email: string;
  password: string;
  onChangePassword: (v: string) => void;
  error: string;
  loading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  theme: AppTheme;
  styles: ReturnType<typeof createStyles>;
}> = ({
  email,
  password,
  onChangePassword,
  error,
  loading,
  onSubmit,
  onCancel,
  theme,
  styles,
}) => (
  <View style={styles.stepContainer}>
    <View style={styles.lockIconCircle}>
      <Ionicons name="lock-closed" size={32} color="#f97316" />
    </View>

    <Text style={styles.stepTitle}>Confirma tu identidad</Text>
    <Text style={styles.stepSubtitle}>
      Por seguridad, ingresa tu contraseña para autorizar la eliminación de la
      cuenta.
    </Text>

    <View style={styles.emailRow}>
      <Ionicons
        name="mail-outline"
        size={16}
        color={theme.colors.textSecondary}
        style={{ marginRight: 8 }}
      />
      <Text style={styles.emailText}>{email}</Text>
    </View>

    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>Contraseña actual</Text>
      <TextInput
        value={password}
        onChangeText={onChangePassword}
        secureTextEntry
        placeholder="••••••••"
        placeholderTextColor={theme.colors.textMuted}
        style={styles.input}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        editable={!loading}
      />
    </View>

    {!!error && (
      <View style={styles.errorBox}>
        <Ionicons
          name="alert-circle-outline"
          size={16}
          color="#fca5a5"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )}

    <TouchableOpacity
      style={[styles.deleteBtn, loading && { opacity: 0.6 }]}
      onPress={onSubmit}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.white} size="small" />
      ) : (
        <>
          <Ionicons
            name="trash-outline"
            size={18}
            color={theme.colors.white}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.deleteBtnText}>Eliminar mi cuenta</Text>
        </>
      )}
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.cancelBtn}
      onPress={onCancel}
      disabled={loading}
    >
      <Text style={styles.cancelBtnText}>Cancelar</Text>
    </TouchableOpacity>
  </View>
);
