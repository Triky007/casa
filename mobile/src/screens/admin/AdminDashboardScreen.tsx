import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AdminStackParamList } from '../../types';
import api from '../../utils/api';

type AdminDashboardNavigationProp = StackNavigationProp<AdminStackParamList, 'AdminDashboard'>;

interface AdminStats {
  total_users: number;
  active_users: number;
  total_tasks: number;
  pending_approvals: number;
  total_rewards: number;
}

interface QuickActionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

function QuickAction({ title, icon, color, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

function StatsCard({ title, value, icon, color }: StatsCardProps) {
  return (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsCardContent}>
        <View style={styles.statsCardText}>
          <Text style={styles.statsCardTitle}>{title}</Text>
          <Text style={styles.statsCardValue}>{value}</Text>
        </View>
        <View style={[styles.statsCardIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
      </View>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const navigation = useNavigation<AdminDashboardNavigationProp>();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      console.log('Loading admin stats...');

      // Cargar datos uno por uno para identificar cuál falla
      let users = [];
      let rewards = [];
      let tasks = [];
      let pendingApprovals = [];

      try {
        console.log('Loading users...');
        const usersResponse = await api.get('/api/users/');
        users = usersResponse.data;
        console.log('Users loaded:', users.length);
      } catch (error) {
        console.error('Error loading users:', error);
      }

      try {
        console.log('Loading rewards...');
        const rewardsResponse = await api.get('/api/rewards/');
        rewards = rewardsResponse.data;
        console.log('Rewards loaded:', rewards.length);
      } catch (error) {
        console.error('Error loading rewards:', error);
      }

      try {
        console.log('Loading tasks...');
        const tasksResponse = await api.get('/api/tasks/');
        tasks = tasksResponse.data;
        console.log('Tasks loaded:', tasks.length);
      } catch (error) {
        console.error('Error loading tasks:', error);
      }

      try {
        console.log('Loading pending approvals...');
        // Intentar primero el endpoint específico
        try {
          const approvalsResponse = await api.get('/api/tasks/pending-approvals');
          pendingApprovals = approvalsResponse.data;
          console.log('Pending approvals loaded:', pendingApprovals.length);
        } catch (pendingError) {
          console.log('Pending approvals endpoint failed, trying alternative...');
          // Alternativa: obtener todas las asignaciones y filtrar por completed
          const allAssignmentsResponse = await api.get('/api/tasks/assignments/all');
          const allAssignments = allAssignmentsResponse.data;
          pendingApprovals = allAssignments.filter((assignment: any) =>
            assignment.status === 'completed'
          );
          console.log('Pending approvals from all assignments:', pendingApprovals.length);
        }
      } catch (error) {
        console.error('Error loading pending approvals:', error);
        // Si falla todo, usar 0 como fallback
        pendingApprovals = [];
      }

      const activeUsers = users.filter((u: any) => u.is_active).length;

      setStats({
        total_users: users.length,
        active_users: activeUsers,
        total_tasks: tasks.length,
        pending_approvals: pendingApprovals.length,
        total_rewards: rewards.length,
      });

      console.log('Stats loaded successfully');
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Cargando estadísticas...</Text>
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
          <Text style={styles.welcomeText}>Panel de Administración</Text>

          {stats && (
            <View style={styles.statsContainer}>
              <StatsCard
                title="Total Usuarios"
                value={stats.total_users}
                icon="people"
                color="#3B82F6"
              />
              <StatsCard
                title="Usuarios Activos"
                value={stats.active_users}
                icon="person-add"
                color="#10B981"
              />
              <StatsCard
                title="Total Tareas"
                value={stats.total_tasks}
                icon="checkbox"
                color="#8B5CF6"
              />
              <StatsCard
                title="Aprobaciones Pendientes"
                value={stats.pending_approvals}
                icon="time"
                color="#F59E0B"
              />
              <StatsCard
                title="Total Recompensas"
                value={stats.total_rewards}
                icon="gift"
                color="#EF4444"
              />
            </View>
          )}

          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
            <View style={styles.quickActionsGrid}>
              <QuickAction
                title="Gestionar Usuarios"
                icon="people"
                color="#3B82F6"
                onPress={() => navigation.navigate('AdminUsers')}
              />
              <QuickAction
                title="Gestionar Tareas"
                icon="checkbox"
                color="#8B5CF6"
                onPress={() => navigation.navigate('AdminTasks')}
              />
              <QuickAction
                title="Aprobar Tareas"
                icon="checkmark-circle"
                color="#10B981"
                onPress={() => navigation.navigate('TaskApprovals')}
              />
              <QuickAction
                title="Recompensas"
                icon="gift"
                color="#EF4444"
                onPress={() => navigation.navigate('AdminRewards')}
              />
            </View>
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
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
  },
  statsContainer: {
    marginBottom: 32,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsCardText: {
    flex: 1,
  },
  statsCardTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statsCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statsCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
});
