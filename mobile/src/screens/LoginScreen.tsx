import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Family } from '../types';
import api from '../utils/api';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFamilies, setLoadingFamilies] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);

  const { login } = useAuth();

  useEffect(() => {
    loadFamilies();
  }, []);

  const loadFamilies = async () => {
    try {
      console.log('🔄 Cargando familias...');
      console.log('📡 API URL:', api.defaults.baseURL);

      const response = await api.get('/api/families/public');
      console.log('✅ Familias cargadas:', response.data);
      console.log('📊 Número de familias:', response.data.length);

      setFamilies(response.data);
    } catch (error: any) {
      console.error('❌ Error loading families:', error);
      console.error('📍 Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });

      let errorMessage = 'No se pudieron cargar las familias disponibles';
      if (error.message.includes('timeout')) {
        errorMessage = 'Timeout: El servidor tardó demasiado en responder';
      } else if (error.message.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Error de red: No se puede conectar al servidor';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoadingFamilies(false);
    }
  };

  const handleLogin = async () => {
    // Validar campos básicos
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
      return;
    }

    // Determinar si es superadmin PRIMERO
    const isSuperAdmin = username.toLowerCase() === 'superadmin';

    // Validar familia solo para usuarios que NO son superadmin
    if (!isSuperAdmin && families.length > 0 && selectedFamilyId === null) {
      Alert.alert('Error', 'Por favor selecciona una familia');
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim(), password, selectedFamilyId || undefined);
    } catch (error: any) {
      console.error('Login error:', error);

      let errorMessage = 'Usuario o contraseña incorrectos';

      if (error.response) {
        // El servidor respondió con un error
        if (error.response.status === 422) {
          errorMessage = 'Datos de login inválidos. Verifica usuario y contraseña.';
        } else if (error.response.data?.detail) {
          if (Array.isArray(error.response.data.detail)) {
            errorMessage = 'Error en los datos enviados';
          } else {
            errorMessage = error.response.data.detail;
          }
        }
      } else if (error.request) {
        // No se pudo conectar al servidor
        errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión.';
      }

      Alert.alert('Error de inicio de sesión', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Ionicons name="home" size={80} color="#3B82F6" />
            <Text style={styles.title}>Tareas Familiares</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
          </View>

          <View style={styles.form}>
            {/* Selector de familia - PRIMERO */}
            {loadingFamilies ? (
              <View style={styles.familyLoadingContainer}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.familyLoadingText}>Cargando familias...</Text>
              </View>
            ) : families.length > 0 && username.toLowerCase() !== 'superadmin' ? (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Familia *</Text>
                <TouchableOpacity
                  style={styles.familySelector}
                  onPress={() => {
                    console.log('🔄 Abriendo modal de familias...');
                    console.log('📊 Familias disponibles:', families.length);
                    console.log('📋 Familias:', families.map(f => ({ id: f.id, name: f.name })));
                    setShowFamilyModal(true);
                  }}
                  disabled={isLoading}
                >
                  <Ionicons name="home-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <Text style={[
                    styles.familySelectorText,
                    !selectedFamilyId && styles.familySelectorPlaceholder
                  ]}>
                    {selectedFamilyId
                      ? families.find(f => f.id === selectedFamilyId)?.name || 'Selecciona una familia'
                      : 'Selecciona una familia'
                    }
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Mensaje para superadmin */}
            {!loadingFamilies && families.length > 0 && username.toLowerCase() === 'superadmin' && (
              <View style={styles.superadminMessage}>
                <Text style={styles.superadminText}>
                  👑 Como superadministrador, tienes acceso a todas las familias del sistema.
                </Text>
              </View>
            )}

            {/* Campo de usuario - SEGUNDO */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Usuario"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Campo de contraseña - TERCERO */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal para seleccionar familia */}
      <Modal
        visible={showFamilyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFamilyModal(false)}
        onShow={() => {
          console.log('👁️ Modal mostrado');
          console.log('📊 Familias en modal:', families.length);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Familia</Text>
              <TouchableOpacity
                onPress={() => setShowFamilyModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Debug: Mostrar info de familias */}
            <View style={{ padding: 10, backgroundColor: '#F0F0F0', borderBottomWidth: 1, borderBottomColor: '#DDD' }}>
              <Text style={{ fontSize: 12, color: '#666' }}>
                Debug: {families.length} familias cargadas
              </Text>
              {families.map(f => (
                <Text key={f.id} style={{ fontSize: 10, color: '#999' }}>
                  • {f.name} (ID: {f.id})
                </Text>
              ))}
            </View>

            {families.length > 0 ? (
              <FlatList
                data={families}
                keyExtractor={(item) => item.id.toString()}
                onLayout={() => console.log('📋 FlatList renderizado')}
                renderItem={({ item }) => {
                  console.log('🏠 Renderizando familia:', item.name);
                  return (
                  <TouchableOpacity
                    style={[
                      styles.familyOption,
                      selectedFamilyId === item.id && styles.familyOptionSelected
                    ]}
                    onPress={() => {
                      console.log('✅ Familia seleccionada:', item.name);
                      setSelectedFamilyId(item.id);
                      setShowFamilyModal(false);
                    }}
                  >
                    <View style={styles.familyOptionContent}>
                      <Text style={[
                        styles.familyOptionName,
                        selectedFamilyId === item.id && styles.familyOptionNameSelected
                      ]}>
                        {item.name}
                      </Text>
                      {item.description && (
                        <Text style={[
                          styles.familyOptionDescription,
                          selectedFamilyId === item.id && styles.familyOptionDescriptionSelected
                        ]}>
                          {item.description}
                        </Text>
                      )}
                    </View>
                    {selectedFamilyId === item.id && (
                      <Ionicons name="checkmark" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                  );
                }}
                style={styles.familyList}
              />
            ) : (
              <View style={styles.noFamiliesContainer}>
                <Text style={styles.noFamiliesText}>
                  No hay familias disponibles
                </Text>
                <Text style={styles.noFamiliesSubtext}>
                  Contacta al administrador del sistema
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 16,
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  familyLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  familyLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  superadminMessage: {
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#BEE3F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  superadminText: {
    fontSize: 14,
    color: '#2B6CB0',
    textAlign: 'center',
  },
  familySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  familySelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  familySelectorPlaceholder: {
    color: '#9CA3AF',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    position: 'absolute',
    top: -8,
    left: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 300,
    maxHeight: '70%',
    paddingBottom: 34, // Safe area padding
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  modalCloseButton: {
    padding: 4,
  },
  familyList: {
    flex: 1,
    minHeight: 200,
  },
  familyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF', // Fondo blanco para debug
    minHeight: 60, // Altura mínima para asegurar visibilidad
  },
  familyOptionSelected: {
    backgroundColor: '#EBF8FF',
  },
  familyOptionContent: {
    flex: 1,
  },
  familyOptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  familyOptionNameSelected: {
    color: '#3B82F6',
  },
  familyOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  familyOptionDescriptionSelected: {
    color: '#60A5FA',
  },
  noFamiliesContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noFamiliesText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  noFamiliesSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
