import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, User, Lock, AlertCircle, Home } from 'lucide-react';
import { Family } from '../types';
import api from '../utils/api';

const Login: React.FC = () => {
  const { user, login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFamilyInfo, setShowFamilyInfo] = useState(false);
  const [loadingFamilies, setLoadingFamilies] = useState(true);

  useEffect(() => {
    const loadFamilies = async () => {
      try {
        const response = await api.get('/api/families/public');
        setFamilies(response.data);
      } catch (error) {
        console.error('Error loading families:', error);
        setError('Error al cargar las familias disponibles');
      } finally {
        setLoadingFamilies(false);
      }
    };

    loadFamilies();
  }, []);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validar campos básicos
    if (!username.trim() || !password.trim()) {
      setError('Por favor ingresa usuario y contraseña');
      setIsSubmitting(false);
      return;
    }

    // Determinar si es superadmin PRIMERO
    const isSuperAdmin = username.toLowerCase() === 'superadmin';

    // Validar familia solo para usuarios que NO son superadmin
    if (!isSuperAdmin && families.length > 0 && selectedFamilyId === null) {
      setError('Por favor selecciona una familia');
      setIsSubmitting(false);
      return;
    }

    try {
      // Solo enviar familyId si no es superadmin y se seleccionó una familia
      const familyIdToSend = isSuperAdmin ? undefined : selectedFamilyId || undefined;
      await login(username, password, familyIdToSend);
      // El login exitoso redirigirá automáticamente
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">TF</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Tareas Familiares</h2>
          <p className="mt-2 text-sm text-gray-600">
            Inicia sesión para gestionar tus tareas
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Selector de familia - Primero */}
            {loadingFamilies && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-sm text-gray-600">Cargando familias...</span>
              </div>
            )}

            {!loadingFamilies && families.length > 0 && username.toLowerCase() !== 'superadmin' && (
              <div>
                <label htmlFor="family" className="block text-sm font-medium text-gray-700 mb-1">
                  Familia <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Home className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="family"
                    name="family"
                    required
                    value={selectedFamilyId || ''}
                    onChange={(e) => setSelectedFamilyId(e.target.value ? parseInt(e.target.value) : null)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="">Selecciona una familia</option>
                    {families.map((family) => (
                      <option key={family.id} value={family.id}>
                        {family.name}
                        {family.description && ` - ${family.description}`}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Selecciona la familia a la que perteneces
                </p>
              </div>
            )}

            {/* Campo de usuario - Segundo */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ingresa tu usuario"
                />
              </div>
            </div>

            {/* Mensaje para superadmin - Después del usuario */}
            {!loadingFamilies && families.length > 0 && username.toLowerCase() === 'superadmin' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Como superadministrador, tienes acceso a todas las familias del sistema.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ingresa tu contraseña"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <LogIn className="h-5 w-5 text-primary-500 group-hover:text-primary-400" />
            </span>
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="text-center space-y-3">
          <button
            type="button"
            onClick={() => setShowFamilyInfo(!showFamilyInfo)}
            className="text-xs text-primary-600 hover:text-primary-500 underline"
          >
            {showFamilyInfo ? 'Ocultar' : 'Ver'} credenciales de ejemplo
          </button>

          {showFamilyInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Credenciales de Prueba:</h4>
              <div className="space-y-3 text-xs text-blue-800">
                <div className="bg-blue-100 p-2 rounded">
                  <strong className="text-blue-900">Superadmin:</strong>
                  <br />
                  <span className="text-blue-700">🏠 Familia: (No aparece selector - acceso a todas)</span>
                  <br />
                  <span className="text-blue-700">👤 Usuario: superadmin</span>
                  <br />
                  <span className="text-blue-700">🔑 Contraseña: super123</span>
                </div>
                <div className="bg-green-100 p-2 rounded">
                  <strong className="text-green-900">Admin de Familia:</strong>
                  <br />
                  <span className="text-green-700">🏠 Familia: Familia García</span>
                  <br />
                  <span className="text-green-700">👤 Usuario: admin</span>
                  <br />
                  <span className="text-green-700">🔑 Contraseña: admin123</span>
                </div>
                <div className="bg-purple-100 p-2 rounded">
                  <strong className="text-purple-900">Usuario Regular:</strong>
                  <br />
                  <span className="text-purple-700">🏠 Familia: Familia García</span>
                  <br />
                  <span className="text-purple-700">👤 Usuario: maria (50 créditos) o carlos (30 créditos)</span>
                  <br />
                  <span className="text-purple-700">🔑 Contraseña: maria123 o carlos123</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500">
            Contacta a un administrador para obtener acceso
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
