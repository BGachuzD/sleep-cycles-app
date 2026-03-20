import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../App';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../theme/ThemeProvider';
import type { AppTheme } from '../../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;
type Chronotype = 'morning' | 'intermediate' | 'night';

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const { signUp } = useAuth();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [chronotype, setChronotype] = useState<Chronotype>('intermediate');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSignUp = async () => {
    setError(null);
    setInfoMessage(null);

    if (!displayName.trim() || !email.trim() || !password || !passwordConfirm) {
      setError('Completa todos los campos.');
      return;
    }

    if (displayName.trim().length < 2) {
      setError('Ingresa un nombre válido (mínimo 2 caracteres).');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const { error } = await signUp({
      email: email.trim(),
      password,
      displayName: displayName.trim(),
      chronotype,
    });
    setLoading(false);

    if (error) {
      setError(error);
      return;
    }

    setInfoMessage(
      'Cuenta creada. Si la verificación por correo está habilitada, revisa tu bandeja de entrada y confirma tu email antes de iniciar sesión.',
    );
  };

  const goToSignIn = () => {
    navigation.replace('SignIn');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>
          Regístrate para guardar tu perfil de sueño y personalizar tu
          experiencia desde el inicio.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre para mostrar"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="words"
          value={displayName}
          onChangeText={setDisplayName}
        />

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
        />

        <Text style={styles.fieldLabel}>Cronotipo (recomendado)</Text>
        <View style={styles.chronotypeRow}>
          <TouchableOpacity
            style={[
              styles.chronotypeChip,
              chronotype === 'morning' && styles.chronotypeChipActive,
            ]}
            onPress={() => setChronotype('morning')}
          >
            <Text
              style={[
                styles.chronotypeChipText,
                chronotype === 'morning' && styles.chronotypeChipTextActive,
              ]}
            >
              Matutino
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.chronotypeChip,
              chronotype === 'intermediate' && styles.chronotypeChipActive,
            ]}
            onPress={() => setChronotype('intermediate')}
          >
            <Text
              style={[
                styles.chronotypeChipText,
                chronotype === 'intermediate' &&
                  styles.chronotypeChipTextActive,
              ]}
            >
              Intermedio
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.chronotypeChip,
              chronotype === 'night' && styles.chronotypeChipActive,
            ]}
            onPress={() => setChronotype('night')}
          >
            <Text
              style={[
                styles.chronotypeChipText,
                chronotype === 'night' && styles.chronotypeChipTextActive,
              ]}
            >
              Nocturno
            </Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
        {infoMessage && <Text style={styles.infoText}>{infoMessage}</Text>}

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={handleSignUp}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.buttonTextPrimary}>Crear cuenta</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={goToSignIn}
          disabled={loading}
        >
          <Text style={styles.linkText}>
            ¿Ya tienes cuenta?{' '}
            <Text style={styles.linkTextHighlight}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  inner: {
    backgroundColor: theme.colors.surface,
    padding: 24,
    borderRadius: 24,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 20,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  fieldLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 8,
    fontWeight: '600',
  },
  chronotypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chronotypeChip: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  chronotypeChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryStrong,
  },
  chronotypeChipText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chronotypeChipTextActive: {
    color: theme.colors.white,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    marginBottom: 8,
  },
  infoText: {
    color: '#a5b4fc',
    fontSize: 13,
    marginBottom: 8,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonTextPrimary: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  linkButton: {
    marginTop: 18,
    alignItems: 'center',
  },
  linkText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  linkTextHighlight: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
});
