import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Shield,
  Home,
  UserPlus,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

interface Family {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  max_members: number;
  timezone: string;
  member_count: number;
  admin_count: number;
  user_count: number;
  members: User[];
}

interface User {
  id: number;
  username: string;
  role: 'superadmin' | 'admin' | 'user';
  credits: number;
  is_active: boolean;
  family_id?: number;
  full_name?: string;
  email?: string;
  created_at: string;
}

interface FamilyFormData {
  name: string;
  description: string;
  max_members: number;
  timezone: string;
}

interface AdminFormData {
  username: string;
  password: string;
  full_name: string;
  email: string;
}

const SuperAdminPage: React.FC = () => {
  const { user } = useAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'families' | 'stats'>('families');

  // Estados para modales
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null);

  // Estados para formularios
  const [familyForm, setFamilyForm] = useState<FamilyFormData>({
    name: '',
    description: '',
    max_members: 10,
    timezone: 'UTC'
  });

  const [adminForm, setAdminForm] = useState<AdminFormData>({
    username: '',
    password: '',
    full_name: '',
    email: ''
  });

  // Verificar que el usuario sea superadmin
  if (user?.role !== 'superadmin') {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
          <p className="text-red-700">
            Acceso denegado. Solo los superadministradores pueden acceder a esta página.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadFamilies();
  }, []);

  const loadFamilies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/families/');
      setFamilies(response.data);
      setError(null);
    } catch (err: any) {
      setError('Error al cargar las familias: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async () => {
    try {
      await api.post('/api/families/', familyForm);
      setSuccess('Familia creada exitosamente');
      setFamilyModalOpen(false);
      setFamilyForm({ name: '', description: '', max_members: 10, timezone: 'UTC' });
      loadFamilies();
    } catch (err: any) {
      setError('Error al crear familia: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleUpdateFamily = async () => {
    if (!editingFamily) return;

    try {
      await api.patch(`/api/families/${editingFamily.id}`, familyForm);
      setSuccess('Familia actualizada exitosamente');
      setFamilyModalOpen(false);
      setEditingFamily(null);
      setFamilyForm({ name: '', description: '', max_members: 10, timezone: 'UTC' });
      loadFamilies();
    } catch (err: any) {
      setError('Error al actualizar familia: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteFamily = async (familyId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta familia? Esta acción eliminará todos los miembros y no se puede deshacer.')) {
      return;
    }

    try {
      await api.delete(`/api/families/${familyId}`);
      setSuccess('Familia eliminada exitosamente');
      loadFamilies();
    } catch (err: any) {
      setError('Error al eliminar familia: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCreateAdmin = async () => {
    if (!selectedFamilyId) return;

    try {
      await api.post(`/api/families/${selectedFamilyId}/admin`, adminForm);
      setSuccess('Administrador creado exitosamente');
      setAdminModalOpen(false);
      setAdminForm({ username: '', password: '', full_name: '', email: '' });
      setSelectedFamilyId(null);
      loadFamilies();
    } catch (err: any) {
      setError('Error al crear administrador: ' + (err.response?.data?.detail || err.message));
    }
  };

  const openEditModal = (family: Family) => {
    setEditingFamily(family);
    setFamilyForm({
      name: family.name,
      description: family.description || '',
      max_members: family.max_members,
      timezone: family.timezone
    });
    setFamilyModalOpen(true);
  };

  const openCreateAdminModal = (familyId: number) => {
    setSelectedFamilyId(familyId);
    setAdminModalOpen(true);
  };

  const FamiliesTab = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Familias</h2>
        <button
          onClick={() => setFamilyModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Familia</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {families.map((family) => (
          <div key={family.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{family.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                family.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {family.is_active ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            {family.description && (
              <p className="text-gray-600 text-sm mb-4">{family.description}</p>
            )}

            <div className="flex space-x-2 mb-4">
              <div className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-700">{family.member_count} miembros</span>
              </div>
              <div className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-700">{family.admin_count} admins</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Máx. miembros: {family.max_members} | Zona horaria: {family.timezone}
            </p>

            <div className="flex space-x-2">
              <button
                onClick={() => openEditModal(family)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                title="Editar familia"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => openCreateAdminModal(family.id)}
                className="p-2 text-green-600 hover:bg-green-50 rounded"
                title="Crear administrador"
              >
                <UserPlus className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteFamily(family.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                title="Eliminar familia"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Home className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Panel de Superadministrador</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <p className="text-red-700">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
            <p className="text-green-700">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('families')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'families'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Familias
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Estadísticas
          </button>
        </nav>
      </div>

      {activeTab === 'families' && <FamiliesTab />}
      {activeTab === 'stats' && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Estadísticas generales</h3>
          <p className="text-gray-500">Próximamente</p>
        </div>
      )}

      {/* Modal para crear/editar familia */}
      {familyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingFamily ? 'Editar Familia' : 'Nueva Familia'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la familia
                </label>
                <input
                  type="text"
                  value={familyForm.name}
                  onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={familyForm.description}
                  onChange={(e) => setFamilyForm({ ...familyForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo de miembros
                </label>
                <input
                  type="number"
                  value={familyForm.max_members}
                  onChange={(e) => setFamilyForm({ ...familyForm, max_members: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zona horaria
                </label>
                <input
                  type="text"
                  value={familyForm.timezone}
                  onChange={(e) => setFamilyForm({ ...familyForm, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setFamilyModalOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={editingFamily ? handleUpdateFamily : handleCreateFamily}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingFamily ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear administrador */}
      {adminModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Crear Administrador de Familia</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={adminForm.username}
                  onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={adminForm.full_name}
                  onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setAdminModalOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAdmin}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Crear Administrador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPage;
