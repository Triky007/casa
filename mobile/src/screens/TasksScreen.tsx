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
import { TaskAssignment } from '../types';
import api from '../utils/api';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await api.get('/api/user/task-assignments');
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

  const completeTask = async (taskId: number) => {
    try {
      await api.post(`/api/user/task-assignments/${taskId}/complete`);
      await loadTasks(); // Reload tasks
      Alert.alert('¡Éxito!', 'Tarea marcada como completada');
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('Error', 'No se pudo completar la tarea');
    }
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

  const renderTaskCard = (assignment: TaskAssignment) => {
    const canComplete = assignment.status === 'pending';
    
    return (
      <View key={assignment.id} style={styles.taskCard}>
        <View style={styles.taskHeader}>
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
          Fecha: {new Date(assignment.scheduled_date).toLocaleDateString('es-ES')}
        </Text>

        {assignment.task?.description && (
          <Text style={styles.taskDescription}>
            {assignment.task.description}
          </Text>
        )}

        <View style={styles.taskFooter}>
          <View style={styles.taskInfo}>
            <Text style={styles.taskCredits}>
              {assignment.task?.credits} créditos
            </Text>
            <Text style={styles.taskPeriodicity}>
              {getPeriodicityText(assignment.task?.periodicity || '')}
            </Text>
          </View>

          {canComplete && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => completeTask(assignment.id)}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>Completar</Text>
            </TouchableOpacity>
          )}
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
      <View style={styles.header}>
        <Text style={styles.title}>Mis Tareas</Text>
      </View>

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
              <Text style={styles.emptyText}>No tienes tareas asignadas</Text>
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
    padding: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
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
    marginBottom: 8,
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
  taskInfo: {
    flex: 1,
  },
  taskCredits: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 2,
  },
  taskPeriodicity: {
    fontSize: 12,
    color: '#6B7280',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
