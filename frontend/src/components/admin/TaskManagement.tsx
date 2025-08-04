import React, { useState } from 'react';
import { Task } from '../../types';
import api from '../../utils/api';
import { FaTasks, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import { GiPartyPopper } from 'react-icons/gi';
import { BsPeopleFill, BsPersonFill } from 'react-icons/bs';

interface TaskManagementProps {
  tasks: Task[];
  onTaskChange: () => void;
}

const TaskManagement: React.FC<TaskManagementProps> = ({ tasks, onTaskChange }) => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    credits: 10,
    task_type: 'individual' as 'individual' | 'collective',
    periodicity: 'daily' as 'daily' | 'weekly' | 'special'
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/tasks/', newTask);
      setNewTask({
        name: '',
        description: '',
        credits: 10,
        task_type: 'individual',
        periodicity: 'daily'
      });
      setShowAddTask(false);
      onTaskChange(); // Refresh task list
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error al crear la tarea. Por favor, intenta nuevamente.');
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    
    try {
      await api.put(`/api/tasks/${selectedTask.id}`, {
        name: selectedTask.name,
        description: selectedTask.description,
        credits: selectedTask.credits,
        task_type: selectedTask.task_type,
        periodicity: selectedTask.periodicity,
        is_active: selectedTask.is_active
      });
      setShowEditTask(false);
      setSelectedTask(null);
      onTaskChange(); // Refresh task list
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error al actualizar la tarea. Por favor, intenta nuevamente.');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      await api.delete(`/api/tasks/${taskId}`);
      onTaskChange(); // Refresh task list
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error al eliminar la tarea. Por favor, intenta nuevamente.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FaTasks className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Tareas</h2>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors"
            title="Añadir Tarea"
          >
            <FaPlus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex-1">
                <div className="flex items-center">
                  <GiPartyPopper className="w-4 h-4 text-purple-500 mr-2" />
                  <p className="font-medium text-gray-900">{task.name}</p>
                </div>
                <p className="text-sm text-gray-600 line-clamp-1">{task.description}</p>
                <div className="flex items-center mt-1 space-x-2">
                  {task.task_type === 'individual' ? (
                    <BsPersonFill className="w-3 h-3 text-blue-500 mr-1" />
                  ) : (
                    <BsPeopleFill className="w-3 h-3 text-green-500 mr-1" />
                  )}
                  <span className="text-xs text-gray-500 capitalize">{task.task_type}</span>
                  
                  <span className="text-xs text-gray-400">|</span>
                  
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 capitalize">{task.periodicity}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right mr-2">
                  <div className="flex items-center justify-end">
                    <span className="text-sm font-medium text-yellow-700">{task.credits}</span>
                    <span className="ml-1 text-xs text-yellow-600">créditos</span>
                  </div>
                  <p className={`text-xs ${task.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {task.is_active ? 'Activa' : 'Inactiva'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedTask(task);
                    setShowEditTask(true);
                  }}
                  className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                  title="Editar tarea"
                >
                  <FaEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  title="Eliminar tarea"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nueva Tarea</h3>
              <button
                onClick={() => setShowAddTask(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  required
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Créditos
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newTask.credits}
                  onChange={(e) => setNewTask({ ...newTask, credits: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={newTask.task_type}
                  onChange={(e) => setNewTask({ ...newTask, task_type: e.target.value as 'individual' | 'collective' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="individual">Individual</option>
                  <option value="collective">Colectiva</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Periodicidad
                </label>
                <select
                  value={newTask.periodicity}
                  onChange={(e) => setNewTask({ ...newTask, periodicity: e.target.value as 'daily' | 'weekly' | 'special' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="daily">Diaria</option>
                  <option value="weekly">Semanal</option>
                  <option value="special">Especial</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Task Modal */}
      {showEditTask && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar Tarea</h3>
              <button
                onClick={() => {
                  setShowEditTask(false);
                  setSelectedTask(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={selectedTask.name}
                  onChange={(e) => setSelectedTask({ ...selectedTask, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  required
                  value={selectedTask.description}
                  onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Créditos
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={selectedTask.credits}
                  onChange={(e) => setSelectedTask({ ...selectedTask, credits: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={selectedTask.task_type}
                  onChange={(e) => setSelectedTask({ ...selectedTask, task_type: e.target.value as 'individual' | 'collective' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="individual">Individual</option>
                  <option value="collective">Colectiva</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Periodicidad
                </label>
                <select
                  value={selectedTask.periodicity}
                  onChange={(e) => setSelectedTask({ ...selectedTask, periodicity: e.target.value as 'daily' | 'weekly' | 'special' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="daily">Diaria</option>
                  <option value="weekly">Semanal</option>
                  <option value="special">Especial</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={selectedTask.is_active}
                  onChange={(e) => setSelectedTask({ ...selectedTask, is_active: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Tarea activa
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditTask(false);
                    setSelectedTask(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
