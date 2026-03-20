// src/screens/DeleteAccountScreen.tsx
import React, { FC, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { GradientBackground } from '../components/GradientBackground';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useAppTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/theme';

type Step = 'warning' | 'reauth' | 'deleting' | 'done';

export const DeleteAccountScreen: FC = () => {
  const navigation = useNavigation();
  const { user, deleteAccount } = useAuth();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const [step, setStep] = useState<Step>('warning');
  const [password, setPassword] = useState('');
  const [reauthError, setReauthError] = useState('');
  const [reauthLoading, setReauthLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleReauth = async () => {
    if (!password.trim()) {
      setReauthError('Ingresa tu contraseña para continuar.');
      return;
    }
    if (!user?.email) {
      setReauthError('No se pudo obtener el correo del usuario.');
      return;
    }

    setReauthLoading(true);
    setReauthError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    setReauthLoading(false);

    if (error) {
      setReauthError('Contraseña incorrecta. Inténtalo de nuevo.');
      return;
    }

    setStep('deleting');
    performDeletion();
  };

  const performDeletion = async () => {
    const { error } = await deleteAccount();
    if (error) {
      setDeleteError(error);
      setStep('reauth');
    } else {
      setStep('done');
    }
  };

  if (step === 'done') {
    return (
      <View style={styles.doneContainer}>
        <GradientBackground />
        <View style={styles.doneContent}>
          <View style={styles.doneIconCircle}>
            <Ionicons name="checkmark" size={40} color="#34d399" />
          </View>
          <Text style={styles.doneTitle}>Cuenta eliminada</Text>
          <Text style={styles.doneText}>
            Tu cuenta y todos tus datos han sido eliminados de forma permanente.
            Esperamos verte de nuevo pronto.
          </Text>
        </View>
      </View>
    );
  }

  if (step === 'deleting') {
    return (
      <View style={styles.doneContainer}>
        <GradientBackground />
        <View style={styles.doneContent}>
          <ActivityIndicator size="large" color={theme.colors.danger} />
          <Text style={styles.deletingText}>Eliminando tu cuenta...</Text>
          <Text style={styles.deletingSubText}>Esto puede tardar unos segundos.</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <GradientBackground />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Eliminar cuenta</Text>
          </View>

          {step === 'warning' && <WarningStep onConfirm={() => setStep('reauth')} theme={theme} styles={styles} />}

          {step === 'reauth' && (
            <ReauthStep
              email={user?.email ?? ''}
              password={password}
              onChangePassword={(v) => {
                setPassword(v);
                setReauthError('');
              }}
              error={reauthError || deleteError}
              loading={reauthLoading}
              onSubmit={handleReauth}
              onCancel={() => navigation.goBack()}
              theme={theme}
              styles={styles}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Step 1: Warning ─────────────────────────────────────────────────────────

const WarningStep: FC<{ onConfirm: () => void; theme: AppTheme; styles: ReturnType<typeof createStyles> }> = ({ onConfirm, theme, styles }) => (
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
        { icon: 'person-circle-outline', text: 'Tu perfil de sueño (edad, peso, etc.)' },
        { icon: 'notifications-outline', text: 'Tus recordatorios y preferencias' },
      ].map((item) => (
        <View key={item.text} style={styles.listRow}>
          <Ionicons name={item.icon as any} size={16} color={theme.colors.danger} style={{ marginRight: 10 }} />
          <Text style={styles.listRowText}>{item.text}</Text>
        </View>
      ))}
    </View>

    <View style={styles.infoCard}>
      <Ionicons name="information-circle-outline" size={18} color={theme.colors.info} style={{ marginRight: 8, marginTop: 1 }} />
      <Text style={styles.infoText}>
        No se conserva ningún dato. Esta operación no se puede deshacer.
      </Text>
    </View>

    <TouchableOpacity style={styles.continueBtn} onPress={onConfirm} activeOpacity={0.8}>
      <Ionicons name="trash-outline" size={18} color={theme.colors.white} style={{ marginRight: 8 }} />
      <Text style={styles.continueBtnText}>Quiero eliminar mi cuenta</Text>
    </TouchableOpacity>
  </View>
);

// ─── Step 2: Re-authentication ────────────────────────────────────────────────

const ReauthStep: FC<{
  email: string;
  password: string;
  onChangePassword: (v: string) => void;
  error: string;
  loading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  theme: AppTheme;
  styles: ReturnType<typeof createStyles>;
}> = ({ email, password, onChangePassword, error, loading, onSubmit, onCancel, theme, styles }) => (
  <View style={styles.stepContainer}>
    <View style={styles.lockIconCircle}>
      <Ionicons name="lock-closed" size={32} color="#f97316" />
    </View>

    <Text style={styles.stepTitle}>Confirma tu identidad</Text>
    <Text style={styles.stepSubtitle}>
      Por seguridad, ingresa tu contraseña para autorizar la eliminación de la cuenta.
    </Text>

    <View style={styles.emailRow}>
      <Ionicons name="mail-outline" size={16} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
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
        <Ionicons name="alert-circle-outline" size={16} color="#fca5a5" style={{ marginRight: 8 }} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )}

    <TouchableOpacity
      style={[styles.deleteBtn, loading && { opacity: 0.6 }]}
      onPress={onSubmit}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={theme.colors.white} size="small" />
        : (
          <>
            <Ionicons name="trash-outline" size={18} color={theme.colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.deleteBtnText}>Eliminar mi cuenta</Text>
          </>
        )}
    </TouchableOpacity>

    <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
      <Text style={styles.cancelBtnText}>Cancelar</Text>
    </TouchableOpacity>
  </View>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    marginBottom: 28,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: '800' },

  stepContainer: { alignItems: 'center', paddingTop: 8 },

  dangerIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(248,113,113,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  lockIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(249,115,22,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(249,115,22,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  stepTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  stepSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },

  listCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
    gap: 12,
  },
  listRow: { flexDirection: 'row', alignItems: 'center' },
  listRowText: { color: theme.colors.textPrimary, fontSize: 14, flex: 1 },

  infoCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(96,165,250,0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.25)',
    marginBottom: 28,
  },
  infoText: { color: '#93c5fd', fontSize: 13, flex: 1, lineHeight: 20 },

  continueBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.danger,
    paddingVertical: 16,
    borderRadius: 999,
  },
  continueBtnText: { color: theme.colors.white, fontWeight: '800', fontSize: 16 },

  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignSelf: 'stretch',
  },
  emailText: { color: theme.colors.textSecondary, fontSize: 14 },

  inputWrapper: { width: '100%', marginBottom: 16 },
  inputLabel: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  errorBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    marginBottom: 16,
  },
  errorText: { color: '#fca5a5', fontSize: 13, flex: 1 },

  deleteBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.danger,
    paddingVertical: 16,
    borderRadius: 999,
    marginBottom: 12,
  },
  deleteBtnText: { color: theme.colors.white, fontWeight: '800', fontSize: 16 },

  cancelBtn: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: { color: theme.colors.textMuted, fontSize: 15, fontWeight: '600' },

  doneContainer: { flex: 1, backgroundColor: theme.colors.background },
  doneContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  doneIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(52,211,153,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  doneTitle: {
    color: theme.colors.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  doneText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  deletingText: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 6,
  },
  deletingSubText: { color: theme.colors.textSecondary, fontSize: 14 },
});
