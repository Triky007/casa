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
import { Reward } from '../../types';
import api from '../../utils/api';
import {
  AdminHeader,
  ActionButtons,
  AdminModal,
  RewardForm,
} from '../../components/admin';

export default function AdminRewardsScreen() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost: '20',
  });

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const response = await api.get('/api/rewards/admin/all');
      setRewards(response.data);
    } catch (error) {
      console.error('Error loading rewards:', error);
      Alert.alert('Error', 'No se pudieron cargar las recompensas');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRewards();
    setRefreshing(false);
  };

  const toggleRewardStatus = async (rewardId: number, currentStatus: boolean) => {
    const action = currentStatus ? 'desactivar' : 'activar';
    Alert.alert(
      'Confirmar acción',
      `¿Estás seguro de que quieres ${action} esta recompensa?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await api.patch(`/api/rewards/${rewardId}`, {
                is_active: !currentStatus,
              });
              await loadRewards();
              Alert.alert('Éxito', `Recompensa ${action} correctamente`);
            } catch (error) {
              console.error('Error updating reward:', error);
              Alert.alert('Error', `No se pudo ${action} la recompensa`);
            }
          },
        },
      ]
    );
  };

  const deleteReward = async (rewardId: number) => {
    Alert.alert(
      'Eliminar recompensa',
      '¿Estás seguro de que quieres eliminar esta recompensa? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/rewards/${rewardId}`);
              await loadRewards();
              Alert.alert('Éxito', 'Recompensa eliminada correctamente');
            } catch (error) {
              console.error('Error deleting reward:', error);
              Alert.alert('Error', 'No se pudo eliminar la recompensa');
            }
          },
        },
      ]
    );
  };

  const openCreateModal = () => {
    setFormData({ name: '', description: '', cost: '20' });
    setShowCreateModal(true);
  };

  const openEditModal = (reward: Reward) => {
    setSelectedReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description || '',
      cost: reward.cost.toString(),
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedReward(null);
    setFormData({ name: '', description: '', cost: '20' });
  };

  const createReward = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    try {
      await api.post('/api/rewards/', {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        cost: parseInt(formData.cost) || 20,
      });
      await loadRewards();
      closeModals();
      Alert.alert('Éxito', 'Recompensa creada correctamente');
    } catch (error) {
      console.error('Error creating reward:', error);
      Alert.alert('Error', 'No se pudo crear la recompensa');
    }
  };

  const updateReward = async () => {
    if (!selectedReward || !formData.name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    try {
      await api.put(`/api/rewards/${selectedReward.id}`, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        cost: parseInt(formData.cost) || 20,
      });
      await loadRewards();
      closeModals();
      Alert.alert('Éxito', 'Recompensa actualizada correctamente');
    } catch (error) {
      console.error('Error updating reward:', error);
      Alert.alert('Error', 'No se pudo actualizar la recompensa');
    }
  };

  const renderRewardCard = (reward: Reward) => {
    return (
      <View key={reward.id} style={styles.rewardCard}>
        <View style={styles.rewardHeader}>
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardName}>{reward.name}</Text>
            <View style={styles.costContainer}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.costText}>{reward.cost} créditos</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: reward.is_active ? '#10B981' : '#EF4444',
              },
            ]}
          >
            <Text style={styles.statusText}>
              {reward.is_active ? 'Activa' : 'Inactiva'}
            </Text>
          </View>
        </View>

        {reward.description && (
          <Text style={styles.rewardDescription}>{reward.description}</Text>
        )}

        <View style={styles.rewardFooter}>
          <Text style={styles.createdDate}>
            Creada: {new Date(reward.created_at).toLocaleDateString('es-ES')}
          </Text>

          <ActionButtons
            onEdit={() => openEditModal(reward)}
            onToggleStatus={() => toggleRewardStatus(reward.id, reward.is_active)}
            onDelete={() => deleteReward(reward.id)}
            isActive={reward.is_active}
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
          <Text>Cargando recompensas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AdminHeader
        title="Gestión de Recompensas"
        onCreatePress={openCreateModal}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {rewards.length > 0 ? (
            rewards.map(renderRewardCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="gift-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No hay recompensas creadas</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <AdminModal
        visible={showCreateModal}
        title="Nueva Recompensa"
        onClose={closeModals}
        onSave={createReward}
        isEdit={false}
      >
        <RewardForm formData={formData} setFormData={setFormData} />
      </AdminModal>

      <AdminModal
        visible={showEditModal}
        title="Editar Recompensa"
        onClose={closeModals}
        onSave={updateReward}
        isEdit={true}
      >
        <RewardForm formData={formData} setFormData={setFormData} />
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
  rewardCard: {
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
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rewardInfo: {
    flex: 1,
    marginRight: 12,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  costText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 4,
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
  rewardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createdDate: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
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
