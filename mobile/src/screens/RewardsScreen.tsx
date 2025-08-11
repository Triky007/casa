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
import { useAuth } from '../contexts/AuthContext';
import { Reward, RewardRedemption } from '../types';
import api from '../utils/api';

export default function RewardsScreen() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRewardsData();
  }, []);

  const loadRewardsData = async () => {
    try {
      console.log('Loading rewards data...');
      const [rewardsResponse, redemptionsResponse] = await Promise.all([
        api.get('/api/rewards/'),
        api.get('/api/rewards/redemptions'),
      ]);

      console.log('Rewards loaded:', rewardsResponse.data.length);
      console.log('Redemptions loaded:', redemptionsResponse.data.length);

      setRewards(rewardsResponse.data.filter((reward: Reward) => reward.is_active));
      setRedemptions(redemptionsResponse.data);
    } catch (error) {
      console.error('Error loading rewards data:', error);
      Alert.alert('Error', 'No se pudieron cargar las recompensas');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRewardsData();
    setRefreshing(false);
  };

  const redeemReward = async (rewardId: number, rewardCost: number) => {
    if (!user || user.credits < rewardCost) {
      Alert.alert('Créditos insuficientes', 'No tienes suficientes créditos para esta recompensa');
      return;
    }

    Alert.alert(
      'Confirmar Canje',
      `¿Estás seguro de que quieres canjear esta recompensa por ${rewardCost} créditos?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Canjear',
          onPress: async () => {
            try {
              console.log('Redeeming reward:', rewardId);
              await api.post(`/api/rewards/redeem/${rewardId}`);
              await loadRewardsData();
              Alert.alert('¡Éxito!', 'Recompensa canjeada exitosamente');
            } catch (error) {
              console.error('Error redeeming reward:', error);
              Alert.alert('Error', 'No se pudo canjear la recompensa');
            }
          },
        },
      ]
    );
  };

  const renderRewardCard = (reward: Reward) => {
    const canAfford = user && user.credits >= reward.cost;
    
    return (
      <View key={reward.id} style={styles.rewardCard}>
        <View style={styles.rewardHeader}>
          <Text style={styles.rewardName}>{reward.name}</Text>
          <View style={styles.costBadge}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.costText}>{reward.cost}</Text>
          </View>
        </View>

        {reward.description && (
          <Text style={styles.rewardDescription}>{reward.description}</Text>
        )}

        <TouchableOpacity
          style={[
            styles.redeemButton,
            !canAfford && styles.redeemButtonDisabled,
          ]}
          onPress={() => redeemReward(reward.id, reward.cost)}
          disabled={!canAfford}
        >
          <Ionicons 
            name="gift" 
            size={16} 
            color={canAfford ? '#FFFFFF' : '#9CA3AF'} 
          />
          <Text style={[
            styles.redeemButtonText,
            !canAfford && styles.redeemButtonTextDisabled,
          ]}>
            {canAfford ? 'Canjear' : 'Créditos insuficientes'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRedemptionCard = (redemption: RewardRedemption) => {
    return (
      <View key={redemption.id} style={styles.redemptionCard}>
        <View style={styles.redemptionHeader}>
          <Text style={styles.redemptionName}>{redemption.reward?.name}</Text>
          <Text style={styles.redemptionDate}>
            {new Date(redemption.redeemed_at).toLocaleDateString('es-ES')}
          </Text>
        </View>
        {redemption.reward?.description && (
          <Text style={styles.redemptionDescription}>
            {redemption.reward.description}
          </Text>
        )}
        <Text style={styles.redemptionCost}>
          Canjeado por {redemption.reward?.cost} créditos
        </Text>
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
      <View style={styles.header}>
        <Text style={styles.title}>Recompensas</Text>
        <View style={styles.creditsContainer}>
          <Ionicons name="star" size={20} color="#F59E0B" />
          <Text style={styles.creditsText}>{user?.credits || 0} créditos</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recompensas Disponibles</Text>
          {rewards.length > 0 ? (
            rewards.map(renderRewardCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="gift-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No hay recompensas disponibles</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Canjes</Text>
          {redemptions.length > 0 ? (
            redemptions.map(renderRedemptionCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No has canjeado ninguna recompensa</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  creditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  creditsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  costText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 2,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  redeemButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  redeemButtonTextDisabled: {
    color: '#9CA3AF',
  },
  redemptionCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  redemptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  redemptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  redemptionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  redemptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  redemptionCost: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
});
