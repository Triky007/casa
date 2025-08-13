import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Task, Reward } from '../types';
import api from '../utils/api';
import UserManagement from '../components/admin/UserManagement';
import TaskManagement from '../components/admin/TaskManagement';
import RewardManagement from '../components/admin/RewardManagement';
// Iconos infantiles
import { FaUsers, FaTasks, FaGift } from 'react-icons/fa';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allRewards, setAllRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'tasks' | 'rewards'>('users');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [usersResponse, tasksResponse, rewardsResponse] = await Promise.all([
        api.get('/api/users/'),
        api.get('/api/tasks/'),
        api.get('/api/rewards/admin/all')
      ]);

      setAllUsers(usersResponse.data);
      setAllTasks(tasksResponse.data);
      setAllRewards(rewardsResponse.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
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

  // Tab navigation content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement users={allUsers} onUserChange={fetchAdminData} />;
      case 'tasks':
        return <TaskManagement tasks={allTasks} onTaskChange={fetchAdminData} />;
      case 'rewards':
      default:
        return <RewardManagement rewards={allRewards} onRewardChange={fetchAdminData} />;
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Panel Admin</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
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
              <p className="text-sm text-gray-600">Tareas</p>
              <p className="text-2xl font-bold text-orange-600">{allTasks.length}</p>
            </div>
            <FaTasks className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recompensas</p>
              <p className="text-2xl font-bold text-purple-600">{allRewards.length}</p>
            </div>
            <FaGift className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('users')}
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <FaUsers className="w-5 h-5 mr-2" />
                Usuarios
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <FaTasks className="w-5 h-5 mr-2" />
                Tareas
              </div>
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rewards'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <FaGift className="w-5 h-5 mr-2" />
                Recompensas
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminPanel;
