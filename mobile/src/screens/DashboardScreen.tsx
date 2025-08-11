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
import { useAuth } from '../contexts/AuthContext';
import { UserStats, TaskAssignment } from '../types';
import api from '../utils/api';

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

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<TaskAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data for user:', user?.id);

      const [statsResponse, tasksResponse] = await Promise.all([
        api.get(`/api/users/${user?.id}/stats`),
        api.get('/api/tasks/assignments'),
      ]);

      console.log('Stats loaded:', statsResponse.data);
      console.log('Tasks loaded:', tasksResponse.data.length);

      setStats(statsResponse.data);
      // Tomar solo las 5 más recientes
      setRecentTasks(tasksResponse.data.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'completed':
        return '#3B82F6';
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'completed':
        return 'Completada';
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Cargando...</Text>
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
        <View style={styles.header}>
          <Text style={styles.greeting}>¡Hola, {user?.username}!</Text>
          <Text style={styles.subGreeting}>Tienes {user?.credits} créditos</Text>
        </View>

        {stats && (
          <View style={styles.statsContainer}>
            <StatsCard
              title="Tareas Completadas"
              value={stats.total_tasks_completed}
              icon="checkmark-circle"
              color="#10B981"
            />
            <StatsCard
              title="Créditos Ganados"
              value={stats.total_credits_earned}
              icon="star"
              color="#F59E0B"
            />
            <StatsCard
              title="Tareas Pendientes"
              value={stats.pending_tasks}
              icon="time"
              color="#3B82F6"
            />
            <StatsCard
              title="Tareas Aprobadas"
              value={stats.approved_tasks}
              icon="thumbs-up"
              color="#8B5CF6"
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tareas Recientes</Text>
          {recentTasks.length > 0 ? (
            recentTasks.map((assignment) => (
              <View key={assignment.id} style={styles.taskCard}>
                <View style={styles.taskCardHeader}>
                  <Text style={styles.taskName}>{assignment.task?.name}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(assignment.status) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(assignment.status) },
                      ]}
                    >
                      {getStatusText(assignment.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.taskDate}>
                  {new Date(assignment.scheduled_date).toLocaleDateString('es-ES')}
                </Text>
                {assignment.task?.description && (
                  <Text style={styles.taskDescription}>
                    {assignment.task.description}
                  </Text>
                )}
                <Text style={styles.taskCredits}>
                  {assignment.task?.credits} créditos
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No hay tareas recientes</Text>
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
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
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
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  taskCredits: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
    marginTop: 32,
  },
});
