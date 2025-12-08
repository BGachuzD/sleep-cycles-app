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
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

import { GradientBackground } from '../components/GradientBackground';
import { useSleepProfile } from '../hooks/useSleepProfile';
import type { Gender, SleepProfile } from '../domain/sleepProfile';
import {
  calculateBMI,
  categorizeBMI,
  buildDerivedProfile,
} from '../domain/sleepProfile';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'SleepProfile'>;

export const SleepProfileScreen: FC<Props> = ({ navigation }) => {
  const { profile, loading, saveProfile } = useSleepProfile();

  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [saving, setSaving] = useState(false);

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

    if (!ageNum || !weightNum || !heightNum) return null;

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
    if (!parsedProfile) return;
    setSaving(true);
    await saveProfile(parsedProfile);
    setSaving(false);
    navigation.goBack();
  };

  const isValid = Boolean(parsedProfile);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <GradientBackground />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>Volver</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Perfil de sueño</Text>
              <View style={{ width: 52 }} />
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#e5e7eb" />
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Datos básicos</Text>

                <View style={styles.row}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Edad</Text>
                    <TextInput
                      value={age}
                      onChangeText={setAge}
                      keyboardType="number-pad"
                      placeholder="Años"
                      placeholderTextColor="#6b7280"
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Género</Text>
                    <View style={styles.genderRow}>
                      {(['male', 'female', 'other'] as Gender[]).map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[
                            styles.genderChip,
                            gender === g && styles.genderChipActive,
                          ]}
                          onPress={() => setGender(g)}
                        >
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
                  </View>
                </View>

                <Text style={styles.sectionTitle}>Medidas</Text>

                <View style={styles.row}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Peso (kg)</Text>
                    <TextInput
                      value={weight}
                      onChangeText={setWeight}
                      keyboardType="numeric"
                      placeholder="70"
                      placeholderTextColor="#6b7280"
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Altura (cm)</Text>
                    <TextInput
                      value={height}
                      onChangeText={setHeight}
                      keyboardType="numeric"
                      placeholder="170"
                      placeholderTextColor="#6b7280"
                      style={styles.input}
                    />
                  </View>
                </View>

                {bmiInfo && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Resumen corporal</Text>
                    <Text style={styles.cardLine}>
                      IMC estimado:{' '}
                      <Text style={styles.cardHighlight}>
                        {bmiInfo.bmi.toFixed(1)}
                      </Text>{' '}
                      ({bmiInfo.cat})
                    </Text>
                  </View>
                )}

                {derived && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Parámetros de sueño</Text>
                    <Text style={styles.cardLine}>
                      Longitud de ciclo:{' '}
                      <Text style={styles.cardHighlight}>
                        {derived.adjustedCycleMinutes} min
                      </Text>
                    </Text>
                    <Text style={styles.cardLine}>
                      Eficiencia estimada:{' '}
                      <Text style={styles.cardHighlight}>
                        {(derived.sleepEfficiency * 100).toFixed(0)} %
                      </Text>
                    </Text>
                    <Text style={styles.cardLine}>
                      Latencia para dormir:{' '}
                      <Text style={styles.cardHighlight}>
                        {derived.latencyMinutes} min
                      </Text>
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  disabled={!isValid || saving}
                  onPress={handleSave}
                  activeOpacity={0.9}
                  style={[
                    styles.saveButton,
                    (!isValid || saving) && styles.saveButtonDisabled,
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator color="#0f172a" />
                  ) : (
                    <Text style={styles.saveButtonText}>Guardar perfil</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('Notifications')}
                  style={{
                    padding: 16,
                    backgroundColor: '#4f46e5',
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>
                    Ver mis notificaciones programadas
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  backText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  headerTitle: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingBox: {
    marginTop: 40,
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  field: {
    flex: 1,
  },
  label: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#f9fafb',
    borderWidth: 1,
    borderColor: 'rgba(55,65,81,0.9)',
    fontSize: 14,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(75,85,99,0.9)',
  },
  genderChipActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  genderChipText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  genderChipTextActive: {
    color: '#f9fafb',
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(51,65,85,0.9)',
  },
  cardTitle: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardLine: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 2,
  },
  cardHighlight: {
    color: '#c7d2fe',
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: '#022c22',
    fontSize: 15,
    fontWeight: '700',
  },
});
