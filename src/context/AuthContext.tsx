import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabaseClient';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (params: {
    email: string;
    password: string;
    displayName: string;
    chronotype?: 'morning' | 'intermediate' | 'night';
  }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  /**
   * True cuando el usuario abrió un link de recuperación de contraseña y la
   * sesión se acaba de establecer desde el deep link. En este estado el
   * RootNavigator muestra ResetPasswordScreen en lugar del flujo normal de
   * app autenticada.
   */
  isInPasswordRecovery: boolean;
  /** Marca el flujo como activo (lo llama el listener de deep link). */
  enterPasswordRecovery: () => void;
  /** Limpia el flag tras éxito o cancelación del reset. */
  exitPasswordRecovery: () => void;
};

// Deep link al que Supabase debe redirigir tras el clic en el correo de
// recuperación. Debe coincidir con `scheme` en app.json y estar autorizado
// en Supabase dashboard → Authentication → URL Configuration → Redirect URLs.
export const PASSWORD_RESET_REDIRECT = 'mimebien://reset-password';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInPasswordRecovery, setIsInPasswordRecovery] = useState(false);

  const enterPasswordRecovery = () => setIsInPasswordRecovery(true);
  const exitPasswordRecovery = () => setIsInPasswordRecovery(false);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (error) {
        console.warn('Error getting session', error);
      }
      setSession(data.session ?? null);
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setSession(session ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.warn('signIn error', error);
      return { error: error.message };
    }

    setSession(data.session ?? null);
    return {};
  };

  const signUp: AuthContextValue['signUp'] = async ({
    email,
    password,
    displayName,
    chronotype,
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim(),
          chronotype: chronotype ?? null,
        },
      },
    });

    if (error) {
      console.warn('signUp error', error);
      return { error: error.message };
    }

    setSession(data.session ?? null);
    return {};
  };

  const signOut: AuthContextValue['signOut'] = async () => {
    // Limpiar la legacy key sin userId para evitar que una cuenta nueva
    // herede el perfil de la sesión anterior.
    await AsyncStorage.removeItem('sleepProfile/v1').catch(() => {});

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('signOut error', error);
    }

    setSession(null);
  };

  const deleteAccount: AuthContextValue['deleteAccount'] = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) return { error: 'No active session' };

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return { error: body.error ?? 'Error al eliminar la cuenta' };
      }
    } catch (err) {
      return { error: 'No se pudo conectar con el servidor' };
    }

    // Clear all local cache after successful server deletion
    await AsyncStorage.clear().catch(() => {});
    await supabase.auth.signOut().catch(() => {});
    setSession(null);

    return {};
  };

  const resetPassword: AuthContextValue['resetPassword'] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: PASSWORD_RESET_REDIRECT,
    });
    if (error) {
      console.warn('resetPassword error', error);
      return { error: error.message };
    }
    return {};
  };

  const updatePassword: AuthContextValue['updatePassword'] = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.warn('updatePassword error', error);
      return { error: error.message };
    }
    return {};
  };

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    deleteAccount,
    resetPassword,
    updatePassword,
    isInPasswordRecovery,
    enterPasswordRecovery,
    exitPasswordRecovery,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
