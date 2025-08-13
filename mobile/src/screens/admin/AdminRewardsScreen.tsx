import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Reward } from '../../types';
import api from '../../utils/api';

export default function AdminRewardsScreen() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const response = await api.get('/api/rewards/');
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

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: reward.is_active ? '#FEE2E2' : '#DCFCE7',
              },
            ]}
            onPress={() => toggleRewardStatus(reward.id, reward.is_active)}
          >
            <Ionicons
              name={reward.is_active ? 'close-circle' : 'checkmark-circle'}
              size={16}
              color={reward.is_active ? '#EF4444' : '#10B981'}
            />
            <Text
              style={[
                styles.actionButtonText,
                {
                  color: reward.is_active ? '#EF4444' : '#10B981',
                },
              ]}
            >
              {reward.is_active ? 'Desactivar' : 'Activar'}
            </Text>
          </TouchableOpacity>
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
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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
