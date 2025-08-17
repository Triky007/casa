import React, { useState } from 'react';
import { User } from '../../types';
import api from '../../utils/api';
import { FaUsers, FaUserPlus, FaUserMinus, FaUserCog, FaCoins } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';

interface UserManagementProps {
  users: User[];
  onUserChange: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUserChange }) => {
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user' as 'user' | 'admin',
    credits: 0,
    full_name: '',
    email: ''
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/users/', newUser);
      setNewUser({
        username: '',
        password: '',
        role: 'user',
        credits: 0,
        full_name: '',
        email: ''
      });
      setShowAddUser(false);
      onUserChange(); // Refresh user list
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error al crear el usuario. Por favor, intenta nuevamente.');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      const updateData: any = {
        role: selectedUser.role,
        credits: selectedUser.credits,
        is_active: selectedUser.is_active
      };
      
      // Solo incluir la contraseña si se ha proporcionado una nueva
      if (newPassword.trim() !== '') {
        updateData.password = newPassword;
      }
      
      await api.put(`/api/users/${selectedUser.id}`, updateData);
      setShowEditUser(false);
      setSelectedUser(null);
      setNewPassword(''); // Limpiar la contraseña
      onUserChange(); // Refresh user list
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
      onUserChange(); // Refresh user list
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar el usuario. Por favor, intenta nuevamente.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FaUsers className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Usuarios</h2>
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors"
            title="Añadir Usuario"
          >
            <FaUserPlus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="font-medium text-gray-900">{u.username}</p>
                {u.full_name && (
                  <p className="text-sm text-gray-500">{u.full_name}</p>
                )}
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-600 capitalize">{u.role}</p>
                  {u.email && (
                    <span className="text-xs text-gray-400">• {u.email}</span>
                  )}
                </div>
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
                  Nombre de usuario
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
                  Nombre completo <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Nombre completo del usuario"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="correo@ejemplo.com"
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
                  Créditos iniciales
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
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  placeholder="Dejar en blanco para mantener la actual"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
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

export default UserManagement;
