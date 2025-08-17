import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Coins, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopBar: React.FC = () => {
  const { user, family, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">TF</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Tareas Familiares</h1>
            {family ? (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <p className="text-xs text-gray-600 font-medium">{family.name}</p>
              </div>
            ) : user?.role === 'superadmin' ? (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <p className="text-xs text-blue-600 font-medium">Superadmin</p>
              </div>
            ) : null}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {user && (
            <>
              <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-full">
                <Coins className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">{user.credits}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>

                {user.role === 'superadmin' && (
                  <button
                    onClick={() => navigate('/superadmin')}
                    className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                    title="Panel de Superadministrador"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={logout}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
