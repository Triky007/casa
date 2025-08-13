import React, { useState } from 'react';
import { FaCog, FaTrashAlt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import api from '../../utils/api';

const AdminSettings: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);

  const handleResetTasks = async () => {
    setIsResetting(true);
    setResetResult(null);
    
    try {
      const response = await api.post('/api/tasks/reset-all');
      setResetResult(`✅ ${response.data.message}`);
      setShowConfirmDialog(false);
    } catch (error: any) {
      console.error('Error resetting tasks:', error);
      setResetResult(`❌ Error: ${error.response?.data?.detail || 'No se pudieron resetear las tareas'}`);
    } finally {
      setIsResetting(false);
    }
  };

  const ConfirmDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <FaExclamationTriangle className="text-red-500 text-2xl mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Confirmar Reseteo</h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            ¿Estás seguro de que quieres resetear todas las tareas realizadas?
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              <strong>⚠️ Advertencia:</strong> Esta acción:
            </p>
            <ul className="text-yellow-700 text-sm mt-2 ml-4 list-disc">
              <li>Eliminará todas las asignaciones de tareas</li>
              <li>Las tareas volverán a estar disponibles</li>
              <li>Los créditos ya otorgados NO se verán afectados</li>
              <li>Esta acción NO se puede deshacer</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowConfirmDialog(false)}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isResetting}
          >
            Cancelar
          </button>
          <button
            onClick={handleResetTasks}
            disabled={isResetting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isResetting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Reseteando...
              </>
            ) : (
              <>
                <FaTrashAlt className="mr-2" />
                Sí, Resetear
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuración del Sistema</h1>
        <p className="text-gray-600">Herramientas de administración y configuración</p>
      </div>

      {/* Sección de Reseteo de Tareas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center mb-4">
          <FaCog className="text-gray-600 text-xl mr-3" />
          <h2 className="text-lg font-semibold text-gray-900">Gestión de Tareas</h2>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-blue-900 mb-2">Resetear Tareas Realizadas</h3>
          <p className="text-blue-800 text-sm mb-3">
            Esta herramienta elimina todas las asignaciones de tareas completadas, pendientes y aprobadas, 
            permitiendo que las tareas vuelvan a estar disponibles para ser asignadas.
          </p>
          <p className="text-blue-700 text-xs">
            <strong>Nota:</strong> Los créditos ya otorgados a los usuarios no se verán afectados.
          </p>
        </div>

        {resetResult && (
          <div className={`p-4 rounded-lg mb-4 ${
            resetResult.startsWith('✅') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {resetResult.startsWith('✅') ? (
                <FaCheckCircle className="mr-2" />
              ) : (
                <FaExclamationTriangle className="mr-2" />
              )}
              {resetResult}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowConfirmDialog(true)}
          disabled={isResetting}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <FaTrashAlt className="mr-2" />
          Resetear Todas las Tareas
        </button>
      </div>

      {/* Sección de Información del Sistema */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <FaCog className="text-gray-600 text-xl mr-3" />
          <h2 className="text-lg font-semibold text-gray-900">Información del Sistema</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Versión</h3>
            <p className="text-gray-600">CASA v1.0.0</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Estado</h3>
            <p className="text-green-600 flex items-center">
              <FaCheckCircle className="mr-2" />
              Sistema Operativo
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {showConfirmDialog && <ConfirmDialog />}
    </div>
  );
};

export default AdminSettings;
