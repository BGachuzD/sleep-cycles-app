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

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSignUp = async () => {
    setError(null);
    setInfoMessage(null);

    if (!email.trim() || !password || !passwordConfirm) {
      setError('Completa todos los campos.');
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
    const { error } = await signUp(email.trim(), password);
    setLoading(false);

    if (error) {
      setError(error);
      return;
    }

    // Aquí manejamos ambos escenarios:
    //  - Si Supabase tiene confirmación de email habilitada:
    //      -> no habrá sesión y el usuario debe validar su correo.
    //  - Si está deshabilitada:
    //      -> se crea sesión automáticamente y RootNavigator enviará al flujo principal.
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
          Regístrate para guardar tu perfil de sueño y sincronizar tus datos.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#6b7280"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#6b7280"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          placeholderTextColor="#6b7280"
          secureTextEntry
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}
        {infoMessage && <Text style={styles.infoText}>{infoMessage}</Text>}

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={handleSignUp}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color="#f9fafb" />
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
            ¿Ya tienes cuenta?
            <Text style={styles.linkTextHighlight}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  inner: {
    backgroundColor: 'rgba(15,23,42,0.98)',
    padding: 24,
    borderRadius: 24,
  },
  title: {
    color: '#f9fafb',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f9fafb',
    marginBottom: 12,
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
    backgroundColor: '#4f46e5',
  },
  buttonTextPrimary: {
    color: '#f9fafb',
    fontWeight: '700',
    fontSize: 15,
  },
  linkButton: {
    marginTop: 18,
    alignItems: 'center',
  },
  linkText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  linkTextHighlight: {
    color: '#e5e7eb',
    fontWeight: '600',
  },
});
