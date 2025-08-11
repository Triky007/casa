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
import { Task } from '../../types';
import api from '../../utils/api';

export default function AdminTasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await api.get('/api/tasks/');
      setTasks(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const toggleTaskStatus = async (taskId: number, currentStatus: boolean) => {
    const action = currentStatus ? 'desactivar' : 'activar';
    Alert.alert(
      'Confirmar acción',
      `¿Estás seguro de que quieres ${action} esta tarea?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await api.patch(`/api/tasks/${taskId}`, {
                is_active: !currentStatus,
              });
              await loadTasks();
              Alert.alert('Éxito', `Tarea ${action} correctamente`);
            } catch (error) {
              console.error('Error updating task:', error);
              Alert.alert('Error', `No se pudo ${action} la tarea`);
            }
          },
        },
      ]
    );
  };

  const getPeriodicityText = (periodicity: string) => {
    switch (periodicity) {
      case 'daily':
        return 'Diaria';
      case 'weekly':
        return 'Semanal';
      case 'special':
        return 'Especial';
      default:
        return periodicity;
    }
  };

  const getTaskTypeText = (taskType: string) => {
    switch (taskType) {
      case 'individual':
        return 'Individual';
      case 'collective':
        return 'Colectiva';
      default:
        return taskType;
    }
  };

  const renderTaskCard = (task: Task) => {
    return (
      <View key={task.id} style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <View style={styles.taskInfo}>
            <Text style={styles.taskName}>{task.name}</Text>
            <View style={styles.taskBadges}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {getTaskTypeText(task.task_type)}
                </Text>
              </View>
              <View style={[styles.badge, styles.periodicityBadge]}>
                <Text style={styles.badgeText}>
                  {getPeriodicityText(task.periodicity)}
                </Text>
              </View>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: task.is_active ? '#10B981' : '#EF4444',
              },
            ]}
          >
            <Text style={styles.statusText}>
              {task.is_active ? 'Activa' : 'Inactiva'}
            </Text>
          </View>
        </View>

        {task.description && (
          <Text style={styles.taskDescription}>{task.description}</Text>
        )}

        <View style={styles.taskFooter}>
          <View style={styles.creditsContainer}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.creditsText}>{task.credits} créditos</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: task.is_active ? '#FEE2E2' : '#DCFCE7',
              },
            ]}
            onPress={() => toggleTaskStatus(task.id, task.is_active)}
          >
            <Ionicons
              name={task.is_active ? 'close-circle' : 'checkmark-circle'}
              size={16}
              color={task.is_active ? '#EF4444' : '#10B981'}
            />
            <Text
              style={[
                styles.actionButtonText,
                {
                  color: task.is_active ? '#EF4444' : '#10B981',
                },
              ]}
            >
              {task.is_active ? 'Desactivar' : 'Activar'}
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
          <Text>Cargando tareas...</Text>
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
          {tasks.length > 0 ? (
            tasks.map(renderTaskCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkbox-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No hay tareas creadas</Text>
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
  taskCard: {
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskInfo: {
    flex: 1,
    marginRight: 12,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  taskBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  periodicityBadge: {
    backgroundColor: '#DBEAFE',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
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
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 4,
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
