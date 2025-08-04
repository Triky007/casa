import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TaskAssignment, User } from '../types';
import TaskCard from '../components/TaskCard';
import api from '../utils/api';
// Reemplazando iconos de Lucide con iconos infantiles de react-icons
import { FaPlus, FaUsers, FaUserPlus, FaUserMinus, FaUserCog, FaCoins } from 'react-icons/fa';
import { GiSandsOfTime, GiCheckMark } from 'react-icons/gi';
import { MdClose } from 'react-icons/md';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState<TaskAssignment[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    credits: 10,
    task_type: 'individual' as 'individual' | 'collective'
  });
  
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    credits: 0
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      const [approvalsResponse, usersResponse] = await Promise.all([
        api.get('/api/tasks/pending-approvals'),
        api.get('/api/users/')
      ]);

      setPendingApprovals(approvalsResponse.data);
      setAllUsers(usersResponse.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveTask = async (assignmentId: number) => {
    try {
      await api.patch(`/api/tasks/approve/${assignmentId}`);
      fetchAdminData(); // Refresh data
    } catch (error) {
      console.error('Error approving task:', error);
    }
  };

  const handleRejectTask = async (assignmentId: number) => {
    try {
      await api.patch(`/api/tasks/reject/${assignmentId}`);
      fetchAdminData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting task:', error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/tasks/', newTask);
      setNewTask({
        name: '',
        description: '',
        credits: 10,
        task_type: 'individual'
      });
      setShowCreateTask(false);
      // Could refresh tasks if needed
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };
  
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/users/', newUser);
      setNewUser({
        username: '',
        password: '',
        role: 'user',
        credits: 0
      });
      setShowAddUser(false);
      fetchAdminData(); // Refresh users list
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.response?.status === 400) {
        alert('El nombre de usuario ya existe. Por favor, elige otro.');
      } else {
        alert('Error al crear el usuario. Por favor, intenta nuevamente.');
      }
    }
  };
  
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      await api.put(`/api/users/${selectedUser.id}`, {
        role: selectedUser.role,
        credits: selectedUser.credits,
        is_active: selectedUser.is_active
      });
      setShowEditUser(false);
      setSelectedUser(null);
      fetchAdminData(); // Refresh users list
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error al actualizar el usuario. Por favor, intenta nuevamente.');
    }
  };
  
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      await api.delete(`/api/users/${userId}`);
      fetchAdminData(); // Refresh users list
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar el usuario. Por favor, intenta nuevamente.');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">Acceso denegado. Solo administradores.</p>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Panel Admin</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
            title="Añadir Usuario"
          >
            <FaUserPlus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowCreateTask(true)}
            className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors"
            title="Añadir Tarea"
          >
            <FaPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuarios</p>
              <p className="text-2xl font-bold text-blue-600">{allUsers.length}</p>
            </div>
            <FaUsers className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-orange-600">{pendingApprovals.length}</p>
            </div>
            <GiSandsOfTime className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <GiCheckMark className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Tareas por Aprobar</h2>
        </div>

        {pendingApprovals.length > 0 ? (
          <div className="space-y-3">
            {pendingApprovals.map((assignment) => (
              <TaskCard
                key={assignment.id}
                task={assignment.task!}
                assignment={assignment}
                onApprove={handleApproveTask}
                onReject={handleRejectTask}
                isAdmin={true}
                showActions={true}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No hay tareas pendientes de aprobación
          </p>
        )}
      
      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nuevo Usuario</h3>
              <button
                onClick={() => setShowAddUser(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'user' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Créditos Iniciales
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newUser.credits}
                  onChange={(e) => setNewUser({ ...newUser, credits: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
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
      
      {/* Edit User Modal */}
      {showEditUser && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar Usuario: {selectedUser.username}</h3>
              <button
                onClick={() => {
                  setShowEditUser(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as 'admin' | 'user' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Créditos
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={selectedUser.credits}
                  onChange={(e) => setSelectedUser({ ...selectedUser, credits: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={selectedUser.is_active}
                  onChange={(e) => setSelectedUser({ ...selectedUser, is_active: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Usuario activo
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUser(false);
                    setSelectedUser(null);
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

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <FaUsers className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Usuarios</h2>
        </div>

        <div className="space-y-3">
          {allUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">{u.username}</p>
                <p className="text-sm text-gray-600 capitalize">{u.role}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right mr-2">
                  <div className="flex items-center justify-end">
                    <FaCoins className="w-3 h-3 text-yellow-600 mr-1" />
                    <p className="text-sm font-medium text-yellow-700">{u.credits}</p>
                  </div>
                  <p className={`text-xs ${u.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(u);
                    setShowEditUser(true);
                  }}
                  className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                  title="Editar usuario"
                >
                  <FaUserCog className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  title="Eliminar usuario"
                >
                  <FaUserMinus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nueva Tarea</h3>
              <button
                onClick={() => setShowCreateTask(false)}
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
                  onChange={(e) => setNewTask({ ...newTask, task_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="individual">Individual</option>
                  <option value="collective">Colectiva</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nuevo Usuario</h3>
              <button
                onClick={() => setShowAddUser(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'user' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Créditos Iniciales
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newUser.credits}
                  onChange={(e) => setNewUser({ ...newUser, credits: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
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
      
      {/* Edit User Modal */}
      {showEditUser && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar Usuario: {selectedUser.username}</h3>
              <button
                onClick={() => {
                  setShowEditUser(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as 'admin' | 'user' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Créditos
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={selectedUser.credits}
                  onChange={(e) => setSelectedUser({ ...selectedUser, credits: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={selectedUser.is_active}
                  onChange={(e) => setSelectedUser({ ...selectedUser, is_active: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Usuario activo
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUser(false);
                    setSelectedUser(null);
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

export default AdminPanel;
