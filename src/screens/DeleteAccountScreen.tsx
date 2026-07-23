// src/screens/DeleteAccountScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { FC, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '../components/GradientBackground';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useTabBarContentPadding } from '../navigation/tabBarLayout';
import { useAppTheme } from '../theme/ThemeProvider';
import { ReauthStep, WarningStep } from './deleteAccount/steps';
import { createStyles } from './deleteAccount/styles';

type Step = 'warning' | 'reauth' | 'deleting' | 'done';

export const DeleteAccountScreen: FC = () => {
  const navigation = useNavigation();
  const { user, deleteAccount } = useAuth();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const bottomContentPadding = useTabBarContentPadding();

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
          <Text style={styles.deletingSubText}>
            Esto puede tardar unos segundos.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <GradientBackground />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: bottomContentPadding },
          ]}
          scrollIndicatorInsets={{ bottom: bottomContentPadding }}
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
              <Ionicons
                name="arrow-back"
                size={22}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Eliminar cuenta</Text>
          </View>

          {step === 'warning' && (
            <WarningStep
              onConfirm={() => setStep('reauth')}
              theme={theme}
              styles={styles}
            />
          )}

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
