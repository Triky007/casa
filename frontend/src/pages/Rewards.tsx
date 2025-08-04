import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Reward, RewardRedemption } from '../types';
import api from '../utils/api';
// Reemplazando iconos de Lucide con iconos infantiles de react-icons
import { GiPresent, GiSandsOfTime } from 'react-icons/gi';
import { RiMoneyDollarCircleFill, RiShoppingCart2Fill } from 'react-icons/ri';
import { MdDoneOutline } from 'react-icons/md';

const Rewards: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check URL parameters to set initial tab
  const urlParams = new URLSearchParams(location.search);
  const initialTab = urlParams.get('tab') === 'history' ? 'history' : 'available';
  const [activeTab, setActiveTab] = useState<'available' | 'history'>(initialTab);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rewardsResponse, redemptionsResponse] = await Promise.all([
        api.get('/api/rewards/'),
        api.get('/api/rewards/redemptions')
      ]);

      setRewards(rewardsResponse.data);
      setRedemptions(redemptionsResponse.data);
    } catch (error) {
      console.error('Error fetching rewards data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeemReward = async (rewardId: number, cost: number) => {
    if (!user || user.credits < cost) {
      alert('No tienes suficientes créditos para canjear esta recompensa.');
      return;
    }

    if (!confirm(`¿Estás seguro de que quieres canjear esta recompensa por ${cost} créditos?`)) {
      return;
    }

    try {
      console.log('Redeeming reward:', rewardId);
      const response = await api.post(`/api/rewards/redeem/${rewardId}`);
      console.log('Reward redeemed successfully:', response.data);
      alert('¡Recompensa canjeada exitosamente!');
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error redeeming reward:', error);
      
      if (error.response?.status === 400) {
        alert('No tienes suficientes créditos para esta recompensa.');
      } else if (error.response?.status === 404) {
        alert('La recompensa no fue encontrada.');
      } else {
        alert('Error al canjear la recompensa. Por favor, intenta nuevamente.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Recompensas</h1>
        <div className="flex items-center space-x-2 bg-yellow-100 px-3 py-2 rounded-lg">
          <RiMoneyDollarCircleFill className="w-6 h-6 text-yellow-600" />
          <span className="font-semibold text-yellow-700">{user?.credits || 0}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'available', label: 'Disponibles', icon: GiPresent },
          { key: 'history', label: 'Historial', icon: GiSandsOfTime }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Available Rewards */}
      {activeTab === 'available' && (
        <div className="space-y-3">
          {rewards.filter(reward => reward.is_active).length > 0 ? (
            rewards.filter(reward => reward.is_active).map(reward => (
              <div key={reward.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{reward.name}</h3>
                    {reward.description && (
                      <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                    )}
                    <div className="flex items-center space-x-1">
                      <RiMoneyDollarCircleFill className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-700">{reward.cost} créditos</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleRedeemReward(reward.id, reward.cost)}
                  disabled={!user || user.credits < reward.cost}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                    user && user.credits >= reward.cost
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <RiShoppingCart2Fill className="w-5 h-5" />
                  <span>
                    {user && user.credits >= reward.cost ? 'Canjear' : 'Créditos insuficientes'}
                  </span>
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GiPresent className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">No hay recompensas disponibles</p>
              <p className="text-sm text-gray-400">
                Las recompensas aparecerán aquí cuando estén disponibles
              </p>
            </div>
          )}
        </div>
      )}

      {/* Redemption History */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {redemptions.length > 0 ? (
            redemptions.map(redemption => (
              <div key={redemption.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {redemption.reward?.name || 'Recompensa eliminada'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Canjeado el {formatDate(redemption.redeemed_at)}
                    </p>
                    <div className="flex items-center space-x-1">
                      <RiMoneyDollarCircleFill className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-700">
                        {redemption.reward?.cost || 0} créditos
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <MdDoneOutline className="w-6 h-6" />
                    <span className="text-sm font-medium">Canjeado</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GiSandsOfTime className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">No tienes historial de canjes</p>
              <p className="text-sm text-gray-400">
                Tus recompensas canjeadas aparecerán aquí
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Rewards;
