import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types';
import api from '../../utils/api';
import {
  CreateButton,
  ActionButtons,
  AdminModal,
  UserForm,
} from '../../components/admin';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    credits: '0',
    full_name: '',
    email: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/api/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    const action = currentStatus ? 'desactivar' : 'activar';
    Alert.alert(
      'Confirmar acción',
      `¿Estás seguro de que quieres ${action} este usuario?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await api.patch(`/api/users/${userId}`, {
                is_active: !currentStatus,
              });
              await loadUsers();
              Alert.alert('Éxito', `Usuario ${action} correctamente`);
            } catch (error) {
              console.error('Error updating user:', error);
              Alert.alert('Error', `No se pudo ${action} el usuario`);
            }
          },
        },
      ]
    );
  };

  const deleteUser = async (userId: number) => {
    Alert.alert(
      'Eliminar usuario',
      '¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/users/${userId}`);
              await loadUsers();
              Alert.alert('Éxito', 'Usuario eliminado correctamente');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'No se pudo eliminar el usuario');
            }
          },
        },
      ]
    );
  };

  const openCreateModal = () => {
    setFormData({
      username: '',
      password: '',
      role: 'user',
      credits: '0',
      full_name: '',
      email: '',
    });
    setShowCreateModal(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '', // No mostrar la contraseña actual
      role: user.role,
      credits: user.credits.toString(),
      full_name: user.full_name || '',
      email: user.email || '',
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedUser(null);
    setFormData({
      username: '',
      password: '',
      role: 'user',
      credits: '0',
      full_name: '',
      email: '',
    });
  };

  const createUser = async () => {
    if (!formData.username.trim() || !formData.password.trim()) {
      Alert.alert('Error', 'El nombre de usuario y contraseña son requeridos');
      return;
    }

    try {
      await api.post('/api/users/', {
        username: formData.username.trim(),
        password: formData.password,
        role: formData.role,
        credits: parseInt(formData.credits) || 0,
        full_name: formData.full_name?.trim() || null,
        email: formData.email?.trim() || null,
      });
      await loadUsers();
      closeModals();
      Alert.alert('Éxito', 'Usuario creado correctamente');
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Error', 'No se pudo crear el usuario');
    }
  };

  const updateUser = async () => {
    if (!selectedUser || !formData.username.trim()) {
      Alert.alert('Error', 'El nombre de usuario es requerido');
      return;
    }

    try {
      const updateData: any = {
        role: formData.role,
        credits: parseInt(formData.credits) || 0,
      };

      // Solo incluir la contraseña si se ha proporcionado una nueva
      if (formData.password?.trim() !== '') {
        updateData.password = formData.password;
      }

      await api.put(`/api/users/${selectedUser.id}`, updateData);
      await loadUsers();
      closeModals();
      Alert.alert('Éxito', 'Usuario actualizado correctamente');
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'No se pudo actualizar el usuario');
    }
  };

  const renderUserCard = (user: User) => {
    return (
      <View key={user.id} style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.username}</Text>
            <Text style={styles.userRole}>
              {user.role === 'admin' ? 'Administrador' : 'Usuario'}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: user.is_active ? '#10B981' : '#EF4444',
              },
            ]}
          >
            <Text style={styles.statusText}>
              {user.is_active ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>

        <View style={styles.userStats}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.statText}>{user.credits} créditos</Text>
          </View>
        </View>

        <View style={styles.userFooter}>
          <ActionButtons
            onEdit={() => openEditModal(user)}
            onToggleStatus={() => toggleUserStatus(user.id, user.is_active)}
            onDelete={() => deleteUser(user.id)}
            isActive={user.is_active}
            statusText={{
              active: 'Desactivar',
              inactive: 'Activar',
            }}
          />
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Cargando usuarios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CreateButton
        onCreatePress={openCreateModal}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {users.length > 0 ? (
            users.map(renderUserCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No hay usuarios registrados</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <AdminModal
        visible={showCreateModal}
        title="Nuevo Usuario"
        onClose={closeModals}
        onSave={createUser}
        isEdit={false}
      >
        <UserForm formData={formData} setFormData={setFormData} isEdit={false} />
      </AdminModal>

      <AdminModal
        visible={showEditModal}
        title="Editar Usuario"
        onClose={closeModals}
        onSave={updateUser}
        isEdit={true}
      >
        <UserForm formData={formData} setFormData={setFormData} isEdit={true} />
      </AdminModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userStats: {
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },

});
