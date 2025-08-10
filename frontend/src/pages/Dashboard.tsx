import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserStats, TaskAssignment } from '../types';
import api from '../utils/api';
import { BarChart3, CheckCircle, Clock, XCircle, Coins, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentAssignments, setRecentAssignments] = useState<TaskAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, assignmentsResponse] = await Promise.all([
          api.get(`/api/users/${user?.id}/stats`),
          api.get('/api/tasks/assignments')
        ]);

        setStats(statsResponse.data);
        setRecentAssignments(assignmentsResponse.data.slice(0, 5)); // Last 5 assignments
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'completed':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Hola, {user?.username}!
        </h1>
        <p className="text-gray-600">
          {user?.role === 'admin' ? 'Panel de administración' : 'Aquí tienes tu resumen de tareas'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Créditos</p>
              <p className="text-2xl font-bold text-yellow-600">{user?.credits}</p>
            </div>
            <Coins className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completadas</p>
              <p className="text-2xl font-bold text-green-600">{stats?.approved_tasks || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-blue-600">{stats?.pending_tasks || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Ganados</p>
              <p className="text-2xl font-bold text-purple-600">{stats?.total_credits_earned || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
        </div>

        {recentAssignments.length > 0 ? (
          <div className="space-y-3">
            {recentAssignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">
                    {assignment.task?.name || 'Tarea'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(assignment.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-yellow-700">
                    {assignment.task?.credits} pts
                  </span>
                  {getStatusIcon(assignment.status)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No hay actividad reciente
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <button 
          onClick={() => navigate('/tasks')}
          className="bg-primary-600 text-white p-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Ver Tareas
        </button>
        <button 
          onClick={() => navigate('/profile')}
          className="bg-gray-100 text-gray-700 p-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Mi Perfil
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
