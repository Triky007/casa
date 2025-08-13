import React, { useState, useRef } from 'react';
import { PhotoUploadResponse } from '../types';
import './PhotoUpload.css';

interface PhotoUploadProps {
  assignmentId: number;
  onPhotoUploaded: (response: PhotoUploadResponse) => void;
  onCancel: () => void;
  isUploading: boolean;
  className?: string;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  assignmentId,
  onPhotoUploaded,
  onCancel,
  isUploading,
  className = '',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen');
      return;
    }

    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 10MB');
      return;
    }

    setSelectedFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`/api/photos/upload/${assignmentId}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error uploading photo');
      }

      const result: PhotoUploadResponse = await response.json();
      onPhotoUploaded(result);

      // Limpiar estado
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error al subir la foto');
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onCancel();
  };

  return (
    <div className={`photo-upload ${className}`}>
      <div className="photo-upload-content">
        <h3>Agregar Foto de la Tarea</h3>

        {!selectedFile ? (
          <div className="file-select">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="file-input"
              id="photo-input"
            />
            <label htmlFor="photo-input" className="file-label">
              <div className="upload-icon">📷</div>
              <span>Seleccionar Foto</span>
            </label>
          </div>
        ) : (
          <div className="photo-preview">
            <img src={previewUrl || ''} alt="Preview" className="preview-image" />
            <div className="photo-info">
              <p><strong>Archivo:</strong> {selectedFile.name}</p>
              <p><strong>Tamaño:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
        )}

        <div className="action-buttons">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={isUploading}
          >
            Cancelar
          </button>

          {selectedFile && (
            <button
              type="button"
              onClick={handleUpload}
              className="btn btn-primary"
              disabled={isUploading}
            >
              {isUploading ? 'Subiendo...' : 'Confirmar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};