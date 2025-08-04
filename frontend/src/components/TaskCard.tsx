import React from 'react';
import { Task, TaskAssignment } from '../types';
import { Clock, CheckCircle, XCircle, Coins, Users, User } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  assignment?: TaskAssignment;
  onAssign?: (taskId: number) => void;
  onComplete?: (assignmentId: number) => void;
  onApprove?: (assignmentId: number) => void;
  onReject?: (assignmentId: number) => void;
  showActions?: boolean;
  isAdmin?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  assignment,
  onAssign,
  onComplete,
  onApprove,
  onReject,
  showActions = true,
  isAdmin = false,
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'completed':
        return 'Completada';
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      default:
        return 'Disponible';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{task.name}</h3>
          {task.description && (
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
          )}
          
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center space-x-1">
              <Coins className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-yellow-700">{task.credits} créditos</span>
            </div>
            
            <div className="flex items-center space-x-1">
              {task.task_type === 'collective' ? (
                <Users className="w-4 h-4 text-blue-600" />
              ) : (
                <User className="w-4 h-4 text-green-600" />
              )}
              <span className="text-gray-600 capitalize">{task.task_type}</span>
            </div>
          </div>
        </div>
        
        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(assignment?.status)}`}>
          {getStatusText(assignment?.status)}
        </div>
      </div>

      {showActions && (
        <div className="flex space-x-2">
          {!assignment && onAssign && !isAdmin && (
            <button
              onClick={() => onAssign(task.id)}
              className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Asignarme
            </button>
          )}
          
          {assignment?.status === 'pending' && onComplete && (
            <button
              onClick={() => onComplete(assignment.id)}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Completar</span>
            </button>
          )}
          
          {assignment?.status === 'completed' && isAdmin && onApprove && onReject && (
            <>
              <button
                onClick={() => onApprove(assignment.id)}
                className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Aprobar</span>
              </button>
              <button
                onClick={() => onReject(assignment.id)}
                className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
              >
                <XCircle className="w-4 h-4" />
                <span>Rechazar</span>
              </button>
            </>
          )}
        </div>
      )}
      
      {assignment?.completed_at && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>
              Completada: {new Date(assignment.completed_at).toLocaleDateString('es-ES')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
