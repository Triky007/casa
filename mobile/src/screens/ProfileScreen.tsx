import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

interface ProfileItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  color?: string;
}

function ProfileItem({ icon, title, value, color = '#6B7280' }: ProfileItemProps) {
  return (
    <View style={styles.profileItem}>
      <View style={styles.profileItemLeft}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={styles.profileItemTitle}>{title}</Text>
      </View>
      <Text style={styles.profileItemValue}>{value}</Text>
    </View>
  );
}

interface ActionItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  color?: string;
  destructive?: boolean;
}

function ActionItem({ icon, title, onPress, color = '#6B7280', destructive = false }: ActionItemProps) {
  return (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={styles.actionItemLeft}>
        <Ionicons name={icon} size={20} color={destructive ? '#EF4444' : color} />
        <Text style={[styles.actionItemTitle, destructive && styles.destructiveText]}>
          {title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleSettings = () => {
    Alert.alert('Configuración', 'Función en desarrollo');
  };

  const handleHelp = () => {
    Alert.alert('Ayuda', 'Función en desarrollo');
  };

  const handleAbout = () => {
    Alert.alert(
      'Acerca de',
      'Tareas Familiares v1.0.0\n\nAplicación para gestionar tareas familiares y sistema de recompensas.'
    );
  };

  const getRoleText = (role: string) => {
    return role === 'admin' ? 'Administrador' : 'Usuario';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.userName}>{user?.username}</Text>
          <Text style={styles.userRole}>{getRoleText(user?.role || '')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <View style={styles.sectionContent}>
            <ProfileItem
              icon="person-outline"
              title="Usuario"
              value={user?.username || ''}
            />
            <ProfileItem
              icon="shield-outline"
              title="Rol"
              value={getRoleText(user?.role || '')}
              color="#3B82F6"
            />
            <ProfileItem
              icon="star-outline"
              title="Créditos"
              value={user?.credits?.toString() || '0'}
              color="#F59E0B"
            />
            <ProfileItem
              icon="checkmark-circle-outline"
              title="Estado"
              value={user?.is_active ? 'Activo' : 'Inactivo'}
              color={user?.is_active ? '#10B981' : '#EF4444'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          <View style={styles.sectionContent}>
            <ActionItem
              icon="settings-outline"
              title="Configuración"
              onPress={handleSettings}
            />
            <ActionItem
              icon="help-circle-outline"
              title="Ayuda"
              onPress={handleHelp}
            />
            <ActionItem
              icon="information-circle-outline"
              title="Acerca de"
              onPress={handleAbout}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <ActionItem
              icon="log-out-outline"
              title="Cerrar Sesión"
              onPress={handleLogout}
              destructive
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  profileItemValue: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionItemTitle: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  destructiveText: {
    color: '#EF4444',
  },
});
