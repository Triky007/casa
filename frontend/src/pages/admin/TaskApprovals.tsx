import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaSearch, FaUser, FaCamera } from 'react-icons/fa';
import api from '../../utils/api';
import { TaskCompletionPhoto } from '../../types';
import { PhotoViewer } from '../../components/PhotoViewer';

interface TaskSubmission {
  id: number;
  task_id: number;
  task_name: string;
  user_id: number;
  username: string;
  submission_date: string;
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  evidence: string;
  comments: string;
  category: string;
  credits: number;
  photos?: TaskCompletionPhoto[];
}

const TaskApprovals: React.FC = () => {
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<TaskSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<TaskCompletionPhoto[]>([]);

  useEffect(() => {
    fetchSubmissions();
  }, [selectedDate]);

  useEffect(() => {
    // Aplicar filtros cuando cambia el término de búsqueda
    if (searchTerm) {
      const filtered = submissions.filter(submission => 
        submission.task_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSubmissions(filtered);
    } else {
      setFilteredSubmissions(submissions);
    }
  }, [searchTerm, submissions]);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = { from_date: selectedDate, to_date: selectedDate } as any;
      // Get all assignments to include approved, pending and rejected tasks
      const allAssignmentsResponse = await api.get('/api/tasks/assignments/all', { params });

      // Combine and map the data to our TaskSubmission interface
      const mappedSubmissions: TaskSubmission[] = allAssignmentsResponse.data.map((assignment: any) => {
        const task = assignment.task;
        const user = assignment.user;

        return {
          id: assignment.id,
          task_id: assignment.task_id,
          task_name: task ? task.name : 'Tarea desconocida',
          user_id: assignment.user_id,
          username: user ? user.username : 'Usuario desconocido',
          submission_date: assignment.completed_at || new Date().toISOString(),
          status: assignment.status,
          evidence: assignment.evidence || '',
          comments: assignment.comments || '',
          category: task ? task.category || 'Sin categoría' : 'Sin categoría',
          credits: task ? task.credits : 0,
          photos: assignment.photos || []
        };
      });

      setSubmissions(mappedSubmissions);
      setFilteredSubmissions(mappedSubmissions);
    } catch (err) {
      console.error('Error fetching task submissions:', err);
      setError('Error al cargar las tareas pendientes de aprobación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (submissionId: number) => {
    try {
      // Use the correct endpoint to approve the task
      await api.patch(`/api/tasks/approve/${submissionId}`);

      // Actualizamos el estado local después de la aprobación exitosa
      setSubmissions(prevSubmissions =>
        prevSubmissions.map(sub =>
          sub.id === submissionId
            ? {...sub, status: 'approved'}
            : sub
        )
      );

      // También actualizamos las submissions filtradas
      setFilteredSubmissions(prevFiltered =>
        prevFiltered.map(sub =>
          sub.id === submissionId
            ? {...sub, status: 'approved'}
            : sub
        )
      );

      // Cerrar el modal si está abierto
      if (selectedSubmission && selectedSubmission.id === submissionId) {
        setSelectedSubmission(null);
      }
    } catch (err) {
      console.error('Error approving task:', err);
      alert('Error al aprobar la tarea');
    }
  };

  const openRejectModal = (submission: TaskSubmission) => {
    setSelectedSubmission(submission);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;

    try {
      // Use the correct endpoint to reject the task
      await api.patch(`/api/tasks/reject/${selectedSubmission.id}`, {
        comments: rejectReason
      });

      // Actualizamos el estado local después del rechazo exitoso
      setSubmissions(prevSubmissions =>
        prevSubmissions.map(sub =>
          sub.id === selectedSubmission.id
            ? {...sub, status: 'rejected', comments: `${sub.comments} | Rechazado: ${rejectReason}`}
            : sub
        )
      );

      // También actualizamos las submissions filtradas
      setFilteredSubmissions(prevFiltered =>
        prevFiltered.map(sub =>
          sub.id === selectedSubmission.id
            ? {...sub, status: 'rejected', comments: `${sub.comments} | Rechazado: ${rejectReason}`}
            : sub
        )
      );

      // Cerrar modal
      setShowRejectModal(false);
      setSelectedSubmission(null);
    } catch (err) {
      console.error('Error rejecting task:', err);
      alert('Error al rechazar la tarea');
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para mostrar fotos
  const handleShowPhotos = (photos: TaskCompletionPhoto[]) => {
    setSelectedPhotos(photos);
    setShowPhotoViewer(true);
  };

  const handleClosePhotoViewer = () => {
    setShowPhotoViewer(false);
    setSelectedPhotos([]);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
        <div className="flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-3" />
          <p className="text-red-700">{error}</p>
        </div>
        <button 
          onClick={fetchSubmissions}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Aprobación de Tareas</h1>
        <p className="text-gray-600">Revisa y aprueba las tareas completadas por los usuarios</p>
      </div>

      {/* Búsqueda y fecha */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 grid grid-cols-1 gap-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre de tarea o usuario..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">Pendientes de Aprobación</p>
          <p className="text-2xl font-bold">{submissions.filter(s => s.status === 'completed').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Aprobadas (Últimos 7 días)</p>
          <p className="text-2xl font-bold">
            {submissions.filter(s => {
              const date = new Date(s.submission_date);
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              return s.status === 'approved' && date >= sevenDaysAgo;
            }).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Rechazadas (Últimos 7 días)</p>
          <p className="text-2xl font-bold">
            {submissions.filter(s => {
              const date = new Date(s.submission_date);
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              return s.status === 'rejected' && date >= sevenDaysAgo;
            }).length}
          </p>
        </div>
      </div>

      {/* Lista de tareas pendientes */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <FaCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">¡No hay tareas pendientes!</h3>
            <p className="text-gray-600">Todas las tareas han sido revisadas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarea
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créditos
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fotos
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{submission.task_name}</div>
                      <div className="text-sm text-gray-500">{submission.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaUser className="text-blue-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{submission.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(submission.submission_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{submission.credits}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${submission.status === 'pending' || submission.status === 'completed' ? 'bg-yellow-100 text-yellow-800' :
                          submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'}`}>
                        {submission.status === 'pending' ? 'Pendiente' :
                          submission.status === 'completed' ? 'Completada' :
                          submission.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {submission.photos && submission.photos.length > 0 ? (
                        <button
                          onClick={() => handleShowPhotos(submission.photos!)}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                        >
                          <FaCamera className="w-3 h-3 mr-1" />
                          {submission.photos.length} foto{submission.photos.length !== 1 ? 's' : ''}
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin fotos</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {submission.status === 'completed' && (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleApprove(submission.id)}
                            className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 p-2 rounded-full transition-colors"
                            title="Aprobar"
                          >
                            <FaCheckCircle />
                          </button>
                          <button
                            onClick={() => openRejectModal(submission)}
                            className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 p-2 rounded-full transition-colors"
                            title="Rechazar"
                          >
                            <FaTimesCircle />
                          </button>
                        </div>
                      )}
                      <button
                        className="text-blue-600 hover:text-blue-900 ml-2"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de rechazo */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FaTimesCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Rechazar Tarea
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Por favor, proporciona un motivo para rechazar esta tarea. El usuario recibirá esta información.
                      </p>
                      <div className="mt-4">
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={4}
                          placeholder="Motivo del rechazo..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles */}
      {selectedSubmission && !showRejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Detalles de la Tarea
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Tarea</h4>
                        <p className="text-base">{selectedSubmission.task_name}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Usuario</h4>
                        <p className="text-base">{selectedSubmission.username}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Fecha de Envío</h4>
                        <p className="text-base">{formatDate(selectedSubmission.submission_date)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          {selectedSubmission.photos && selectedSubmission.photos.length > 0
                            ? "Evidencia Textual"
                            : "Evidencia"}
                        </h4>
                        <p className="text-base">
                          {selectedSubmission.evidence ||
                            (selectedSubmission.photos && selectedSubmission.photos.length > 0
                              ? "✅ Evidencia proporcionada mediante fotografías"
                              : "No hay evidencia adjunta")}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Comentarios</h4>
                        <p className="text-base">{selectedSubmission.comments || "Sin comentarios"}</p>
                      </div>

                      {/* Sección de fotos */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Evidencia Fotográfica</h4>
                        {selectedSubmission.photos && selectedSubmission.photos.length > 0 ? (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-2">
                              {selectedSubmission.photos.map((photo, index) => (
                                <div key={photo.id} className="relative">
                                  <img
                                    src={photo.thumbnail_path || photo.file_path}
                                    alt={`Foto ${index + 1}`}
                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => handleShowPhotos(selectedSubmission.photos!)}
                                  />
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => handleShowPhotos(selectedSubmission.photos!)}
                              className="mt-2 inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                            >
                              <FaCamera className="w-3 h-3 mr-1" />
                              Ver todas las fotos ({selectedSubmission.photos.length})
                            </button>
                          </div>
                        ) : (
                          <p className="text-base text-gray-400">No hay fotos adjuntas</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedSubmission.status === 'completed' && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => handleApprove(selectedSubmission.id)}
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => {
                        setSelectedSubmission(null);
                        openRejectModal(selectedSubmission);
                      }}
                    >
                      Rechazar
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setSelectedSubmission(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visor de fotos */}
      <PhotoViewer
        photos={selectedPhotos}
        isOpen={showPhotoViewer}
        onClose={handleClosePhotoViewer}
      />
    </div>
  );
};

export default TaskApprovals;
