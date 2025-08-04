import React, { useState } from 'react';
import { Reward } from '../../types';
import api from '../../utils/api';
import { FaGift, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import { GiTrophyCup } from 'react-icons/gi';

interface RewardManagementProps {
  rewards: Reward[];
  onRewardChange: () => void;
}

const RewardManagement: React.FC<RewardManagementProps> = ({ rewards, onRewardChange }) => {
  const [showAddReward, setShowAddReward] = useState(false);
  const [showEditReward, setShowEditReward] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  
  const [newReward, setNewReward] = useState({
    name: '',
    description: '',
    cost: 20
  });

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/rewards/', newReward);
      setNewReward({
        name: '',
        description: '',
        cost: 20
      });
      setShowAddReward(false);
      onRewardChange(); // Refresh reward list
    } catch (error) {
      console.error('Error creating reward:', error);
      alert('Error al crear la recompensa. Por favor, intenta nuevamente.');
    }
  };

  const handleUpdateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReward) return;
    
    try {
      await api.put(`/api/rewards/${selectedReward.id}`, {
        name: selectedReward.name,
        description: selectedReward.description,
        cost: selectedReward.cost,
        is_active: selectedReward.is_active
      });
      setShowEditReward(false);
      setSelectedReward(null);
      onRewardChange(); // Refresh reward list
    } catch (error) {
      console.error('Error updating reward:', error);
      alert('Error al actualizar la recompensa. Por favor, intenta nuevamente.');
    }
  };

  const handleDeleteReward = async (rewardId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta recompensa? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      await api.delete(`/api/rewards/${rewardId}`);
      onRewardChange(); // Refresh reward list
    } catch (error) {
      console.error('Error deleting reward:', error);
      alert('Error al eliminar la recompensa. Por favor, intenta nuevamente.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Rewards List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FaGift className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recompensas</h2>
          </div>
          <button
            onClick={() => setShowAddReward(true)}
            className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors"
            title="Añadir Recompensa"
          >
            <FaPlus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {rewards.map((reward) => (
            <div key={reward.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex-1">
                <div className="flex items-center">
                  <GiTrophyCup className="w-4 h-4 text-amber-500 mr-2" />
                  <p className="font-medium text-gray-900">{reward.name}</p>
                </div>
                <p className="text-sm text-gray-600 line-clamp-1">{reward.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right mr-2">
                  <div className="flex items-center justify-end">
                    <span className="text-sm font-medium text-yellow-700">{reward.cost}</span>
                    <span className="ml-1 text-xs text-yellow-600">créditos</span>
                  </div>
                  <p className={`text-xs ${reward.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {reward.is_active ? 'Activa' : 'Inactiva'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedReward(reward);
                    setShowEditReward(true);
                  }}
                  className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                  title="Editar recompensa"
                >
                  <FaEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteReward(reward.id)}
                  className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  title="Eliminar recompensa"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Reward Modal */}
      {showAddReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nueva Recompensa</h3>
              <button
                onClick={() => setShowAddReward(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReward} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={newReward.name}
                  onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  required
                  value={newReward.description}
                  onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo (créditos)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newReward.cost}
                  onChange={(e) => setNewReward({ ...newReward, cost: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddReward(false)}
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
      
      {/* Edit Reward Modal */}
      {showEditReward && selectedReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar Recompensa</h3>
              <button
                onClick={() => {
                  setShowEditReward(false);
                  setSelectedReward(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateReward} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={selectedReward.name}
                  onChange={(e) => setSelectedReward({ ...selectedReward, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  required
                  value={selectedReward.description}
                  onChange={(e) => setSelectedReward({ ...selectedReward, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo (créditos)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={selectedReward.cost}
                  onChange={(e) => setSelectedReward({ ...selectedReward, cost: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={selectedReward.is_active}
                  onChange={(e) => setSelectedReward({ ...selectedReward, is_active: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Recompensa activa
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditReward(false);
                    setSelectedReward(null);
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

export default RewardManagement;
