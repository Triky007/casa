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
import { TaskAssignment, Task, PhotoUploadResponse } from '../types';
import api from '../utils/api';
import { TaskPhotoViewer } from '../components/TaskPhotoViewer';
import { PhotoCapture } from '../components/PhotoCapture';

export default function TasksScreen() {
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TaskAssignment | null>(null);
  const [activeTab, setActiveTab] = useState<'assigned' | 'available'>('assigned');
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      console.log('Loading tasks...');
      const [assignmentsResponse, allTasksResponse] = await Promise.all([
        api.get('/api/tasks/assignments'),
        api.get('/api/tasks/')
      ]);

      console.log('Assignments loaded:', assignmentsResponse.data.length);
      console.log('All tasks loaded:', allTasksResponse.data.length);

      // Debug: Log assignments with photos
      assignmentsResponse.data.forEach((assignment: TaskAssignment) => {
        if (assignment.photos && assignment.photos.length > 0) {
          console.log(`📸 Assignment ${assignment.id} has ${assignment.photos.length} photos:`, assignment.photos);
        }
      });

      setAssignments(assignmentsResponse.data);

      // Filtrar tareas disponibles (no asignadas al usuario actual)
      const assignedTaskIds = assignmentsResponse.data.map((a: TaskAssignment) => a.task_id);
      const available = allTasksResponse.data.filter((task: Task) =>
        !assignedTaskIds.includes(task.id)
      );

      setAvailableTasks(available);
      console.log('Available tasks:', available.length);
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

  const assignTask = async (taskId: number) => {
    try {
      console.log('Assigning task:', taskId);
      await api.post(`/api/tasks/assign/${taskId}`);
      await loadTasks(); // Reload tasks
      Alert.alert('¡Éxito!', 'Tarea asignada correctamente');
    } catch (error) {
      console.error('Error assigning task:', error);
      Alert.alert('Error', 'No se pudo asignar la tarea');
    }
  };

  const completeTask = async (assignmentId: number) => {
    Alert.alert(
      'Completar Tarea',
      '¿Cómo quieres completar esta tarea?',
      [
        {
          text: 'Sin foto',
          onPress: () => completeTaskWithoutPhoto(assignmentId),
        },
        {
          text: 'Con foto',
          onPress: () => {
            setSelectedAssignmentId(assignmentId);
            setShowPhotoCapture(true);
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const completeTaskWithoutPhoto = async (assignmentId: number) => {
    try {
      console.log('Completing task without photo:', assignmentId);
      await api.patch(`/api/tasks/complete/${assignmentId}`);
      await loadTasks(); // Reload tasks
      Alert.alert('¡Éxito!', 'Tarea marcada como completada');
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('Error', 'No se pudo completar la tarea');
    }
  };

  const completeTaskWithPhoto = async (photoUri: string) => {
    if (!selectedAssignmentId) return;

    setIsUploading(true);
    try {
      console.log('Completing task with photo:', selectedAssignmentId);

      // Crear FormData para enviar la foto
      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        type: 'image/jpeg',
        name: `task_${selectedAssignmentId}_${Date.now()}.jpg`,
      } as any);

      await api.post(`/api/tasks/complete-with-photo/${selectedAssignmentId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await loadTasks(); // Reload tasks
      setShowPhotoCapture(false);
      setSelectedAssignmentId(null);
      Alert.alert('¡Éxito!', 'Tarea completada con foto');
    } catch (error) {
      console.error('Error completing task with photo:', error);
      Alert.alert('Error', 'No se pudo completar la tarea con foto');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoCaptureCancel = () => {
    setShowPhotoCapture(false);
    setSelectedAssignmentId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Asignada';
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

  const renderAssignmentCard = (assignment: TaskAssignment) => {
    const canComplete = assignment.status.toLowerCase() === 'pending';

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

          <View style={styles.taskActions}>
            {canComplete && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => completeTask(assignment.id)}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.completeButtonText}>Completar</Text>
              </TouchableOpacity>
            )}

            {assignment.photos && assignment.photos.length > 0 && (
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => {
                  setSelectedAssignment(assignment);
                  setShowPhotoViewer(true);
                }}
              >
                <Ionicons name="camera" size={16} color="#007AFF" />
                <Text style={styles.photoButtonText}>
                  Ver fotos ({assignment.photos.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderAvailableTaskCard = (task: Task) => {
    return (
      <View key={task.id} style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskName}>{task.name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: '#10B981' + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: '#10B981' },
              ]}
            >
              Disponible
            </Text>
          </View>
        </View>

        {task.description && (
          <Text style={styles.taskDescription}>
            {task.description}
          </Text>
        )}

        <View style={styles.taskFooter}>
          <View style={styles.taskInfo}>
            <Text style={styles.taskCredits}>
              {task.credits} créditos
            </Text>
            <Text style={styles.taskPeriodicity}>
              {getPeriodicityText(task.periodicity || '')}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.assignButton}
            onPress={() => assignTask(task.id)}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.assignButtonText}>Asignarme</Text>
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
      <View style={styles.header}>
        <Text style={styles.title}>Tareas</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'assigned' && styles.activeTab]}
          onPress={() => setActiveTab('assigned')}
        >
          <Text style={[styles.tabText, activeTab === 'assigned' && styles.activeTabText]}>
            Mis Tareas ({assignments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Disponibles ({availableTasks.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {activeTab === 'assigned' ? (
            assignments.length > 0 ? (
              assignments.map(renderAssignmentCard)
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkbox-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No tienes tareas asignadas</Text>
              </View>
            )
          ) : (
            availableTasks.length > 0 ? (
              availableTasks.map(renderAvailableTaskCard)
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-done-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No hay tareas disponibles</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>

      <PhotoCapture
        visible={showPhotoCapture}
        onPhotoSelected={completeTaskWithPhoto}
        onCancel={handlePhotoCaptureCancel}
        isUploading={isUploading}
      />

      <TaskPhotoViewer
        visible={showPhotoViewer}
        photos={selectedAssignment?.photos || []}
        onClose={() => {
          setShowPhotoViewer(false);
          setSelectedAssignment(null);
        }}
        baseUrl={api.defaults.baseURL || 'http://192.168.9.101:3110'}
      />
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
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#1F2937',
    fontWeight: '600',
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
  taskActions: {
    flexDirection: 'column',
    gap: 8,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  photoButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});
