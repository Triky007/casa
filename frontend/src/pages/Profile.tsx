import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserStats, RewardRedemption } from '../types';
import api from '../utils/api';
import { User, Award, Coins, BarChart3, Gift } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [statsResponse, redemptionsResponse] = await Promise.all([
          api.get(`/api/users/${user?.id}/stats`),
          api.get('/api/rewards/redemptions')
        ]);

        setStats(statsResponse.data);
        setRedemptions(redemptionsResponse.data);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi Perfil</h1>

      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user?.username}</h2>
            <p className="text-sm text-gray-600 capitalize">
              {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center bg-yellow-50 rounded-lg p-4">
          <Coins className="w-6 h-6 text-yellow-600 mr-2" />
          <span className="text-2xl font-bold text-yellow-700">{user?.credits}</span>
          <span className="text-sm text-yellow-600 ml-1">créditos disponibles</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Estadísticas</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats?.approved_tasks || 0}</p>
            <p className="text-sm text-gray-600">Tareas Aprobadas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats?.pending_tasks || 0}</p>
            <p className="text-sm text-gray-600">Tareas Pendientes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{stats?.total_credits_earned || 0}</p>
            <p className="text-sm text-gray-600">Créditos Ganados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats?.rejected_tasks || 0}</p>
            <p className="text-sm text-gray-600">Tareas Rechazadas</p>
          </div>
        </div>
      </div>

      {/* Recent Rewards */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Award className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recompensas Canjeadas</h3>
        </div>

        {redemptions.length > 0 ? (
          <div className="space-y-3">
            {redemptions.slice(0, 5).map((redemption) => (
              <div key={redemption.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Gift className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {redemption.reward?.name || 'Recompensa'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(redemption.redeemed_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-yellow-700">
                  -{redemption.reward?.cost} pts
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Gift className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No has canjeado recompensas aún</p>
            <p className="text-xs text-gray-400 mt-1">
              Completa tareas para ganar créditos y canjear premios
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 space-y-3">
        <button 
          onClick={() => navigate('/rewards')}
          className="w-full bg-primary-600 text-white p-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Ver Recompensas Disponibles
        </button>
        <button 
          onClick={() => navigate('/rewards?tab=history')}
          className="w-full bg-gray-100 text-gray-700 p-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Historial Completo
        </button>
      </div>
    </div>
  );
};

export default Profile;
