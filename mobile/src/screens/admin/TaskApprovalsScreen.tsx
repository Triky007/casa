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
import { TaskAssignment } from '../../types';
import api from '../../utils/api';
import { TaskPhotoViewer } from '../../components/TaskPhotoViewer';

export default function TaskApprovalsScreen() {
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TaskAssignment | null>(null);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      console.log('Loading pending approvals...');

      let pendingApprovals = [];

      try {
        // Intentar el endpoint específico primero
        const response = await api.get('/api/tasks/pending-approvals');
        pendingApprovals = response.data;
        console.log('Pending approvals loaded:', pendingApprovals.length);
      } catch (pendingError) {
        console.log('Pending approvals endpoint failed, using alternative...');
        // Alternativa: obtener todas las asignaciones y filtrar
        const allResponse = await api.get('/api/tasks/assignments/all');
        const allAssignments = allResponse.data;
        pendingApprovals = allAssignments.filter((assignment: any) =>
          assignment.status === 'completed'
        );
        console.log('Pending approvals from all assignments:', pendingApprovals.length);
      }

      setAssignments(pendingApprovals);
    } catch (error: any) {
      console.error('Error loading pending approvals:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });

      Alert.alert('Error', 'No se pudieron cargar las aprobaciones pendientes');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingApprovals();
    setRefreshing(false);
  };

  const handleApproval = async (assignmentId: number, action: 'approve' | 'reject') => {
    const actionText = action === 'approve' ? 'aprobar' : 'rechazar';
    Alert.alert(
      'Confirmar acción',
      `¿Estás seguro de que quieres ${actionText} esta tarea?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await api.patch(`/api/tasks/${action}/${assignmentId}`);
              await loadPendingApprovals();
              Alert.alert('Éxito', `Tarea ${actionText}da correctamente`);
            } catch (error) {
              console.error(`Error ${action}ing task:`, error);
              Alert.alert('Error', `No se pudo ${actionText} la tarea`);
            }
          },
        },
      ]
    );
  };

  const renderAssignmentCard = (assignment: TaskAssignment) => {
    return (
      <View key={assignment.id} style={styles.assignmentCard}>
        <View style={styles.assignmentHeader}>
          <Text style={styles.taskName}>{assignment.task?.name}</Text>
          <Text style={styles.userName}>
            {assignment.user?.username}
          </Text>
        </View>

        <View style={styles.assignmentDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              Programada: {new Date(assignment.scheduled_date).toLocaleDateString('es-ES')}
            </Text>
          </View>
          
          {assignment.completed_at && (
            <View style={styles.detailRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>
                Completada: {new Date(assignment.completed_at).toLocaleDateString('es-ES')}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="star-outline" size={16} color="#F59E0B" />
            <Text style={styles.detailText}>
              {assignment.task?.credits} créditos
            </Text>
          </View>
        </View>

        {assignment.task?.description && (
          <Text style={styles.taskDescription}>
            {assignment.task.description}
          </Text>
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

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleApproval(assignment.id, 'reject')}
          >
            <Ionicons name="close" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Rechazar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApproval(assignment.id, 'approve')}
          >
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Aprobar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Cargando aprobaciones...</Text>
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
          {assignments.length > 0 ? (
            assignments.map(renderAssignmentCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                No hay tareas pendientes de aprobación
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  assignmentCard: {
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
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  assignmentDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginVertical: 8,
  },
  photoButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
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
