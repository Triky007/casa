import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaUsers, 
  FaTasks, 
  FaGift, 
  FaChartBar, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes,
  FaCheckCircle,
  FaCog
} from 'react-icons/fa';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-700 mb-6">Esta área está restringida solo para administradores.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { path: '/admin/dashboard', icon: <FaChartBar />, label: 'Dashboard' },
    { path: '/admin/users', icon: <FaUsers />, label: 'Usuarios' },
    { path: '/admin/tasks', icon: <FaTasks />, label: 'Tareas' },
    { path: '/admin/task-approvals', icon: <FaCheckCircle />, label: 'Aprobaciones' },
    { path: '/admin/rewards', icon: <FaGift />, label: 'Recompensas' },
    { path: '/admin/settings', icon: <FaCog />, label: 'Configuración' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar para pantallas medianas y grandes */}
      <div className={`bg-gray-900 text-white ${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 hidden md:block`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">CASA Admin</h1>}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 rounded-md hover:bg-gray-800"
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
        
        <div className="mt-8">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center p-4 ${isActive ? 'bg-blue-700' : 'hover:bg-gray-800'} transition-colors`
              }
            >
              <span className="text-xl mr-4">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>
        
        <div className="absolute bottom-0 w-full">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full p-4 hover:bg-gray-800 transition-colors"
          >
            <span className="text-xl mr-4"><FaSignOutAlt /></span>
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </div>
      
      {/* Sidebar móvil */}
      <div className={`fixed inset-0 z-20 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} md:hidden`}>
        <div className="absolute inset-0 bg-black opacity-50" onClick={() => setSidebarOpen(false)}></div>
        
        <div className="absolute inset-y-0 left-0 w-64 bg-gray-900 text-white">
          <div className="p-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">CASA Admin</h1>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="p-2 rounded-md hover:bg-gray-800"
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="mt-8">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center p-4 ${isActive ? 'bg-blue-700' : 'hover:bg-gray-800'} transition-colors`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-xl mr-4">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
          
          <div className="absolute bottom-0 w-full">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full p-4 hover:bg-gray-800 transition-colors"
            >
              <span className="text-xl mr-4"><FaSignOutAlt /></span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 md:hidden"
            >
              <FaBars />
            </button>
            
            <div className="flex items-center">
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <span className="ml-2 text-gray-700">{user?.username}</span>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Contenido de la página */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
