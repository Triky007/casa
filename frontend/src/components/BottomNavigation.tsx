import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CheckSquare, User, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const BottomNavigation: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Inicio' },
    { to: '/tasks', icon: CheckSquare, label: 'Tareas' },
    { to: '/profile', icon: User, label: 'Perfil' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ to: '/admin', icon: Settings, label: 'Admin' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-around">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 transition-colors ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
