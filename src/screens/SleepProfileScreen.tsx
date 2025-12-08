import React, { FC, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '../components/GradientBackground';
import { useSleepProfile } from '../hooks/useSleepProfile';
import type { Gender, SleepProfile } from '../domain/sleepProfile';
import {
  calculateBMI,
  categorizeBMI,
  buildDerivedProfile,
} from '../domain/sleepProfile';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'SleepProfile'>;

const { height } = Dimensions.get('window');

const DataRow: FC<{
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = ({ label, value, icon }) => (
  <View style={dataRowStyles.row}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons
        name={icon}
        size={16}
        color="#9ca3af"
        style={dataRowStyles.icon}
      />
      <Text style={dataRowStyles.label}>{label}</Text>
    </View>
    <Text style={dataRowStyles.value}>{value}</Text>
  </View>
);

const dataRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(55,65,81,0.5)',
  },
  icon: {
    marginRight: 8,
    opacity: 0.8,
  },
  label: {
    color: '#9ca3af',
    fontSize: 14,
  },
  value: {
    color: '#c7d2fe',
    fontWeight: '700',
    fontSize: 14,
  },
});

export const SleepProfileScreen: FC<Props> = ({ navigation }) => {
  const { profile, loading, saveProfile } = useSleepProfile();
  const { signOut } = useAuth();

  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setAge(String(profile.age));
      setWeight(String(profile.weightKg));
      setHeight(String(profile.heightCm));
      setGender(profile.gender);
    }
  }, [profile]);

  const parsedProfile: SleepProfile | null = useMemo(() => {
    const ageNum = Number(age);
    const weightNum = Number(weight);
    const heightNum = Number(height);
    let error: string | null = null;

    if (!age || !weight || !height) {
      error = 'Por favor, completa todos los campos.';
    } else if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      error = 'La edad debe ser un número válido.';
    } else if (isNaN(weightNum) || weightNum <= 0) {
      error = 'El peso debe ser mayor a 0.';
    } else if (isNaN(heightNum) || heightNum <= 0) {
      error = 'La altura debe ser mayor a 0.';
    }

    setValidationError(error);

    if (error) return null;

    return {
      age: ageNum,
      weightKg: weightNum,
      heightCm: heightNum,
      gender,
    };
  }, [age, weight, height, gender]);

  const derived = useMemo(() => {
    if (!parsedProfile) return null;
    return buildDerivedProfile(parsedProfile);
  }, [parsedProfile]);

  const bmiInfo = useMemo(() => {
    if (!parsedProfile) return null;
    const bmi = calculateBMI(parsedProfile.weightKg, parsedProfile.heightCm);
    const cat = categorizeBMI(bmi);
    return { bmi, cat };
  }, [parsedProfile]);

  const handleSave = async () => {
    if (!parsedProfile || validationError) return;
    setSaving(true);
    await saveProfile(parsedProfile);
    setSaving(false);
  };

  const isValid = Boolean(parsedProfile) && !validationError;

  const handleLogout = () => {
    signOut();
  };

  const getGenderIcon = (g: Gender) => {
    switch (g) {
      case 'male':
        return 'man';
      case 'female':
        return 'woman';
      default:
        return 'happy';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <GradientBackground />
        <View style={styles.loadingCenter}>
          <ActivityIndicator color="#6366f1" size="large" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.flex}>
        <GradientBackground />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -height * 0.15}
        >
          {/* --- SCROLLVIEW DE CONTENIDO --- */}
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Tu Perfil</Text>
              <TouchableOpacity
                onPress={handleLogout}
                style={styles.logoutButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color="#9ca3af"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
            {/* --- SECCIÓN DATOS BÁSICOS --- */}
            <View style={styles.sectionHeader}>
              <Ionicons
                name="person-circle-outline"
                size={20}
                color="#e5e7eb"
              />
              <Text style={styles.sectionTitle}>Datos Personales</Text>
            </View>
            {/* Edad y Género */}
            <View style={styles.row}>
              {/* Edad */}
              <View style={styles.inputCard}>
                <Text style={styles.label}>Edad (años)</Text>
                <TextInput
                  value={age}
                  onChangeText={setAge}
                  keyboardType="number-pad"
                  placeholder="Ej. 30"
                  placeholderTextColor="#6b7280"
                  style={styles.input}
                />
              </View>
              {/* Medidas */}
              <View style={styles.inputCard}>
                <Text style={styles.label}>Peso (kg)</Text>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder="Ej. 70.5"
                  placeholderTextColor="#6b7280"
                  style={styles.input}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.inputCard}>
                <Text style={styles.label}>Altura (cm)</Text>
                <TextInput
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholder="Ej. 175"
                  placeholderTextColor="#6b7280"
                  style={styles.input}
                />
              </View>
            </View>
            {/* Chips de Género (Segmented Control) */}
            <Text style={styles.label}>Género biológico</Text>
            <View style={styles.genderRowContainer}>
              {(['male', 'female', 'other'] as Gender[]).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderChip,
                    gender === g && styles.genderChipActive,
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Ionicons
                    name={getGenderIcon(g)}
                    size={18}
                    color={gender === g ? '#0f172a' : '#9ca3af'}
                  />
                  <Text
                    style={[
                      styles.genderChipText,
                      gender === g && styles.genderChipTextActive,
                    ]}
                  >
                    {g === 'male'
                      ? 'Masculino'
                      : g === 'female'
                        ? 'Femenino'
                        : 'Otro'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* --- MENSAJE DE ERROR --- */}
            {validationError && (
              <View style={styles.errorBox}>
                <Ionicons
                  name="warning-outline"
                  size={18}
                  color="#fca5a5"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.errorText}>{validationError}</Text>
              </View>
            )}
            {/* --- DATOS CALCULADOS: IMC --- */}
            {bmiInfo && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="scale-outline" size={20} color="#e5e7eb" />
                  <Text style={styles.cardTitle}>Índice de Masa Corporal</Text>
                </View>
                <Text style={styles.cardHighlightBig}>
                  {bmiInfo.bmi.toFixed(1)}
                </Text>
                <Text style={styles.cardLine}>
                  Clasificación:
                  <Text style={styles.cardCategory}>{bmiInfo.cat}</Text>
                </Text>
              </View>
            )}
            {/* --- DATOS CALCULADOS: PARÁMETROS DE SUEÑO --- */}
            {derived && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="moon-outline" size={20} color="#e5e7eb" />
                  <Text style={styles.cardTitle}>
                    Parámetros de Sueño Derivados
                  </Text>
                </View>
                <DataRow
                  label="Longitud de Ciclo"
                  value={`${derived.adjustedCycleMinutes} min`}
                  icon="sync-outline"
                />
                <DataRow
                  label="Eficiencia Estimada"
                  value={`${(derived.sleepEfficiency * 100).toFixed(0)} %`}
                  icon="analytics-outline"
                />
                <DataRow
                  label="Latencia para Dormir"
                  value={`${derived.latencyMinutes} min`}
                  icon="time-outline"
                />
              </View>
            )}
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={styles.notificationsButton}
            >
              <Ionicons
                name="notifications-outline"
                size={18}
                color="#e5e7eb"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.notificationsButtonText}>
                Ver mis Recordatorios
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* --- FOOTER FIJO (Botón de Guardar) --- */}
          <View style={styles.footer}>
            <TouchableOpacity
              disabled={!isValid || saving}
              onPress={handleSave}
              activeOpacity={0.8}
              style={[
                styles.saveButton,
                (!isValid || saving) && styles.saveButtonDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={20}
                    color="#0f172a"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.saveButtonText}>Guardar Perfil</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const PADDING_H = 24;
const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 10,
    fontSize: 15,
  },
  content: {
    paddingHorizontal: PADDING_H,
    paddingTop: 20,
    paddingBottom: 90,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  headerTitle: {
    color: '#e5e7eb',
    fontSize: 28,
    fontWeight: '900',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  logoutText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 25,
  },
  sectionTitle: {
    color: '#e5e7eb',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 0,
  },
  inputCard: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  label: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    paddingVertical: 4,
    paddingHorizontal: 0,
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '700',
  },
  genderRowContainer: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 999,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  genderChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 999,
  },
  genderChipActive: {
    backgroundColor: '#6366f1',
  },
  genderChipText: {
    color: '#9ca3af',
    fontSize: 13,
    marginLeft: 4,
  },
  genderChipTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 18,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(55,65,81,0.7)',
  },
  cardTitle: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  cardHighlightBig: {
    color: '#a5b4fc',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 4,
  },
  cardLine: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 2,
  },
  cardCategory: {
    fontWeight: '700',
    color: '#4ade80',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginBottom: 16,
    marginTop: 8,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    flex: 1,
  },
  notificationsButton: {
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: '#374151',
  },
  notificationsButtonText: {
    color: '#e5e7eb',
    fontWeight: '600',
    fontSize: 15,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: PADDING_H,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
    backgroundColor: 'rgba(2, 6, 23, 0.95)',
    borderTopWidth: 1,
    borderColor: 'rgba(55,65,81,0.5)',
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
});
