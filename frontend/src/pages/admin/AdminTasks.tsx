import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaFilter, FaExclamationTriangle } from 'react-icons/fa';
import TaskManagement from '../../components/admin/TaskManagement';
import api from '../../utils/api';
import { Task } from '../../types';

// Extendemos la interfaz Task para incluir la categoría y usuario
interface ExtendedTask extends Task {
  category?: string;
  active?: boolean;
  status?: string;
  user?: {
    id: number;
    username: string;
  };
  assignee?: string;
}

const AdminTasks: React.FC = () => {
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<ExtendedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    // Aplicar filtros cuando cambian los criterios
    applyFilters();
  }, [searchTerm, filterStatus, filterCategory, tasks]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Obtener tareas
      const response = await api.get('/api/tasks/');
      
      // Usar directamente los datos de tareas sin intentar obtener asignaciones
      const tasksWithUsers = response.data.map((task: ExtendedTask) => {
        return {
          ...task,
          // Aseguramos que las propiedades opcionales tengan valores por defecto
          category: task.category || 'Sin categoría',
          is_active: task.is_active !== undefined ? task.is_active : true
        };
      });
      
      setTasks(tasksWithUsers);
      setFilteredTasks(tasksWithUsers);
      
      // Extraer categorías únicas
      const uniqueCategories = [...new Set(tasksWithUsers.map((task: ExtendedTask) => task.category || 'Sin categoría'))];
      setCategories(uniqueCategories.filter(Boolean) as string[]);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Error al cargar las tareas');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...tasks];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      result = result.filter(task => 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      );
    }
    
    // Filtrar por estado
    if (filterStatus !== 'all') {
      result = result.filter(task => 
        (filterStatus === 'active' ? task.active : !task.active)
      );
    }
    
    // Filtrar por categoría
    if (filterCategory !== 'all') {
      result = result.filter(task => task.category === filterCategory);
    }
    
    setFilteredTasks(result);
  };

  const handleTaskChange = () => {
    fetchTasks();
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
        <div className="flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-3" />
          <p className="text-red-700">{error}</p>
        </div>
        <button 
          onClick={fetchTasks}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Tareas</h1>
          <p className="text-gray-600">Administra las tareas del sistema</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="mr-2" />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar tareas..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Filtro por categoría */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFilter className="text-gray-400" />
            </div>
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* Filtro por estado */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFilter className="text-gray-400" />
            </div>
            <select
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total Tareas</p>
          <p className="text-2xl font-bold">{tasks.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Tareas Activas</p>
          <p className="text-2xl font-bold">{tasks.filter(task => task.is_active).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
          <p className="text-sm text-gray-600">Pendientes Aprobación</p>
          <p className="text-2xl font-bold">{tasks.filter(task => task.status === 'pending_approval').length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">Categorías</p>
          <p className="text-2xl font-bold">{categories.length}</p>
        </div>
      </div>

      {/* Lista de tareas */}
      <div className="bg-white rounded-lg shadow-sm">
        <TaskManagement tasks={filteredTasks} onTaskChange={handleTaskChange} />
      </div>
    </div>
  );
};

export default AdminTasks;
