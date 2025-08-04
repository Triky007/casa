import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Task, TaskAssignment } from '../types';
import TaskCard from '../components/TaskCard';
import api from '../utils/api';
import { FaSearch, FaFilter, FaPlus } from 'react-icons/fa';
import { MdOutlineRestartAlt, MdDoneOutline } from 'react-icons/md';
import { GiSandsOfTime } from 'react-icons/gi';

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'assigned' | 'history' | 'completed'>('all');

  const urlParams = new URLSearchParams(location.search);
  const initialTab = urlParams.get('tab') === 'history' ? 'history' : 'all';
  useEffect(() => {
    setFilter(initialTab as 'all' | 'available' | 'assigned' | 'history' | 'completed');
  }, [initialTab]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const assignmentsEndpoint = user?.role === 'admin' 
        ? '/api/tasks/assignments/all' 
        : '/api/tasks/assignments';
      
      const [tasksResponse, assignmentsResponse] = await Promise.all([
        api.get('/api/tasks/'),
        api.get(assignmentsEndpoint)
      ]);

      setTasks(tasksResponse.data);
      setAssignments(assignmentsResponse.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTask = async (taskId: number) => {
    try {
      console.log('Attempting to assign task:', taskId);
      const response = await api.post(`/api/tasks/assign/${taskId}`);
      console.log('Task assigned successfully:', response.data);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error assigning task:', error);
      
      // Show specific error messages to user
      if (error.response?.status === 400) {
        alert('Esta tarea ya está asignada a ti.');
      } else if (error.response?.status === 404) {
        alert('La tarea no fue encontrada.');
      } else if (error.response?.status === 401) {
        alert('No tienes autorización. Por favor, inicia sesión nuevamente.');
      } else {
        alert('Error al asignar la tarea. Por favor, intenta nuevamente.');
      }
    }
  };

  const handleCompleteTask = async (assignmentId: number) => {
    try {
      await api.patch(`/api/tasks/complete/${assignmentId}`);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error completing task:', error);
    }
  };

  const handleResetAllTasks = async () => {
    if (!confirm('¿Estás seguro de que quieres resetear todas las tareas? Esto eliminará todas las asignaciones y las tareas volverán a estar disponibles.')) {
      return;
    }
    
    try {
      console.log('Resetting all tasks...');
      const response = await api.post('/api/tasks/reset-all');
      console.log('Tasks reset successfully:', response.data);
      alert('Todas las tareas han sido reseteadas exitosamente.');
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error resetting tasks:', error);
      
      if (error.response?.status === 403) {
        alert('No tienes permisos para resetear las tareas.');
      } else {
        alert('Error al resetear las tareas. Por favor, intenta nuevamente.');
      }
    }
  };

  const handleApproveTask = async (assignmentId: number) => {
    try {
      console.log('Approving task assignment:', assignmentId);
      const response = await api.patch(`/api/tasks/approve/${assignmentId}`);
      console.log('Task approved successfully:', response.data);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error approving task:', error);
      
      if (error.response?.status === 403) {
        alert('No tienes permisos para aprobar tareas.');
      } else if (error.response?.status === 404) {
        alert('La asignación de tarea no fue encontrada.');
      } else {
        alert('Error al aprobar la tarea. Por favor, intenta nuevamente.');
      }
    }
  };

  const handleRejectTask = async (assignmentId: number) => {
    try {
      console.log('Rejecting task assignment:', assignmentId);
      const response = await api.patch(`/api/tasks/reject/${assignmentId}`);
      console.log('Task rejected successfully:', response.data);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error rejecting task:', error);
      
      if (error.response?.status === 403) {
        alert('No tienes permisos para rechazar tareas.');
      } else if (error.response?.status === 404) {
        alert('La asignación de tarea no fue encontrada.');
      } else {
        alert('Error al rechazar la tarea. Por favor, intenta nuevamente.');
      }
    }
  };

  const getTaskAssignment = (taskId: number): TaskAssignment | undefined => {
    // Para usuarios normales, buscar solo sus asignaciones
    if (user?.role !== 'admin') {
      // Buscar asignaciones para la tarea específica que pertenecen al usuario actual
      const userAssignments = assignments.filter(assignment => 
        assignment.task_id === taskId && 
        assignment.user_id === user?.id &&
        assignment.status !== 'rejected'
      );
      
      return userAssignments.length > 0 ? userAssignments[0] : undefined;
    } else {
      // Para administradores en la vista normal (no completadas), mostrar cualquier asignación
      // Esto es para mantener la visualización de tareas disponibles/asignadas
      if (filter !== 'completed') {
        const taskAssignments = assignments.filter(assignment => 
          assignment.task_id === taskId && 
          assignment.status !== 'rejected'
        );
        
        return taskAssignments.length > 0 ? taskAssignments[0] : undefined;
      }
      
      // Para administradores en la vista de completadas, no devolver nada aquí
      // ya que mostraremos todas las asignaciones completadas por separado
      return undefined;
    }
  };

  // Filtrar tareas normales (disponibles, asignadas, históricas)
  const filteredTasks = tasks.filter(task => {
    const assignment = getTaskAssignment(task.id);
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Para administradores en vista de completadas, no mostrar tareas normales
    if (user?.role === 'admin' && filter === 'completed') {
      return false;
    }

    switch (filter) {
      case 'available':
        return !assignment;
      case 'assigned':
        return !!assignment && assignment.status !== 'approved' && assignment.status !== 'rejected';
      case 'history':
        return !!assignment && (assignment.status === 'approved' || assignment.status === 'rejected');
      case 'completed':
        return false; // Las tareas completadas se manejan por separado
      default:
        return true;
    }
  });

  // Filtrar asignaciones completadas pendientes de aprobación (solo para administradores)
  const completedAssignments = user?.role === 'admin' && filter === 'completed' 
    ? assignments.filter(assignment => 
        assignment.status === 'completed' &&
        (searchTerm === '' || 
         (assignment.task?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.task?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()))))
    : [];
    
  // Filtrar asignaciones históricas (aprobadas o rechazadas) para mostrarlas por usuario
  const historicalAssignments = filter === 'history'
    ? assignments.filter(assignment => 
        (assignment.status === 'approved' || assignment.status === 'rejected') &&
        (searchTerm === '' || 
         (assignment.task?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.task?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()))))
    : [];

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
        {user?.role === 'admin' && (
          <div className="flex space-x-2">
            <button 
              onClick={handleResetAllTasks}
              className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-700 transition-colors"
              title="Resetear todas las tareas"
            >
              <MdOutlineRestartAlt className="w-5 h-5" />
            </button>
            <button className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors">
              <FaPlus className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar tareas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {
          [
            { key: 'all', label: 'Todas' },
            { key: 'available', label: 'Disponibles' },
            { key: 'assigned', label: 'Asignadas' },
            { key: 'history', label: 'Histórico', icon: GiSandsOfTime },
            // Pestaña adicional para administradores: Completadas pendientes de aprobación
            ...(user?.role === 'admin' ? [{ key: 'completed', label: 'Por Aprobar', icon: MdDoneOutline }] : [])
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
                filter === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {icon && React.createElement(icon, { className: "w-4 h-4 mr-1" })}
              <span>{label}</span>
            </button>
          ))
        }
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {/* Vista normal de tareas (no histórico ni completadas) */}
        {filter !== 'completed' && filter !== 'history' && filteredTasks.length > 0 ? (
          filteredTasks.map(task => {
            const assignment = getTaskAssignment(task.id);
            return (
              <TaskCard
                key={task.id}
                task={task}
                assignment={assignment}
                onAssign={handleAssignTask}
                onComplete={handleCompleteTask}
                onApprove={handleApproveTask}
                onReject={handleRejectTask}
                isAdmin={user?.role === 'admin'}
              />
            );
          })
        ) : filter === 'completed' && completedAssignments.length > 0 ? (
          // Vista de asignaciones completadas para administradores
          completedAssignments.map(assignment => (
            <TaskCard
              key={`assignment-${assignment.id}`}
              task={assignment.task!}
              assignment={assignment}
              onApprove={handleApproveTask}
              onReject={handleRejectTask}
              isAdmin={true}
              showUserInfo={true}
            />
          ))
        ) : filter === 'history' && historicalAssignments.length > 0 ? (
          // Vista de histórico de asignaciones por usuario
          historicalAssignments.map(assignment => (
            <TaskCard
              key={`history-${assignment.id}`}
              task={assignment.task!}
              assignment={assignment}
              isAdmin={user?.role === 'admin'}
              showUserInfo={user?.role === 'admin'} // Mostrar usuario solo para admins
              showActions={false} // No mostrar acciones en histórico
            />
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaFilter className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No se encontraron tareas</p>
            <p className="text-sm text-gray-400">
              {filter === 'available' 
                ? 'No hay tareas disponibles en este momento'
                : filter === 'assigned'
                ? 'No tienes tareas asignadas'
                : filter === 'completed'
                ? 'No hay tareas completadas pendientes de aprobación'
                : filter === 'history'
                ? 'No hay tareas en el histórico'
                : 'Intenta cambiar los filtros de búsqueda'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
