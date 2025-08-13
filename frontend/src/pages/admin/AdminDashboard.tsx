import React, { useState, useEffect } from 'react';
import { FaUsers, FaTasks, FaGift, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import api from '../../utils/api';

// Definición de tipos
interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTasks: number;
  pendingApprovals: number;
  totalRewards: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'task_completed' | 'reward_claimed' | 'user_joined' | 'task_created';
  username: string;
  description: string;
  timestamp: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [toDate, setToDate] = useState<string>(new Date().toISOString().slice(0,10));

  useEffect(() => {
    fetchDashboardData();
  }, [fromDate, toDate]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = { from_date: fromDate, to_date: toDate } as any;
      // Obtener datos base
      const [usersResponse, rewardsResponse, statsResponse] = await Promise.all([
        api.get('/api/users/'),
        api.get('/api/rewards/admin/all'),
        api.get('/api/tasks/stats/daily', { params })
      ]);

      const users = usersResponse.data;
      const rewards = rewardsResponse.data;
      const daily = statsResponse.data;

      const activeUsers = users.filter((u: any) => u.is_active).length;

      setStats({
        totalUsers: users.length,
        activeUsers,
        totalTasks: daily.total || 0,
        pendingApprovals: daily.completed || 0, // completadas pendientes de aprobar
        totalRewards: rewards.length,
        recentActivity: []
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Componente para las tarjetas de estadísticas
  const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: JSX.Element, color: string }) => (
    <div className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('border-', 'bg-').replace('-600', '-100')} text-${color.replace('border-', '').replace('-600', '-600')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  // Componente para los iconos de actividad
  const ActivityIcon = ({ type }: { type: ActivityItem['type'] }) => {
    switch (type) {
      case 'task_completed':
        return <FaCheckCircle className="text-green-500" />;
      case 'reward_claimed':
        return <FaGift className="text-purple-500" />;
      case 'user_joined':
        return <FaUsers className="text-blue-500" />;
      case 'task_created':
        return <FaTasks className="text-orange-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 h-32"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 h-96"></div>
          <div className="bg-white rounded-lg shadow-sm p-6 h-96"></div>
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
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard de Administración</h1>
        <p className="text-gray-600">Bienvenido al panel de control del sistema CASA</p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full" />
          </div>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Usuarios" 
          value={stats?.totalUsers || 0} 
          icon={<FaUsers className="w-6 h-6" />} 
          color="border-blue-600" 
        />
        <StatCard 
          title="Usuarios Activos" 
          value={stats?.activeUsers || 0} 
          icon={<FaUsers className="w-6 h-6" />} 
          color="border-green-600" 
        />
        <StatCard 
          title="Total Tareas" 
          value={stats?.totalTasks || 0} 
          icon={<FaTasks className="w-6 h-6" />} 
          color="border-orange-600" 
        />
        <StatCard 
          title="Aprobaciones Pendientes" 
          value={stats?.pendingApprovals || 0} 
          icon={<FaCheckCircle className="w-6 h-6" />} 
          color="border-red-600" 
        />
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividad reciente */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Actividad Reciente</h2>
          <div className="space-y-4">
            {stats?.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start p-3 border-b border-gray-100 last:border-0">
                <div className="mr-4">
                  <ActivityIcon type={activity.type} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.username}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Ver todas las actividades
            </button>
          </div>
        </div>

        {/* Tareas pendientes de aprobación */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tareas Pendientes de Aprobación</h2>
          {stats?.pendingApprovals === 0 ? (
            <div className="text-center py-8">
              <FaCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">No hay tareas pendientes de aprobación</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Aquí iría la lista de tareas pendientes */}
              <p className="text-center text-gray-600">
                Hay {stats?.pendingApprovals} tareas pendientes de aprobación.
                <br />
                <a href="/admin/task-approvals" className="text-blue-600 hover:text-blue-800 font-medium">
                  Ir a la sección de aprobaciones
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
