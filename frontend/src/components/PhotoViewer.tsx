import React, { useState } from 'react';
import { TaskCompletionPhoto } from '../types';
import './PhotoViewer.css';

interface PhotoViewerProps {
  photos: TaskCompletionPhoto[];
  isOpen: boolean;
  onClose: () => void;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  photos,
  isOpen,
  onClose,
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  if (!isOpen || !photos || photos.length === 0) {
    return null;
  }

  const selectedPhoto = photos[selectedPhotoIndex];

  return (
    <div className="photo-viewer-overlay" onClick={onClose}>
      <div className="photo-viewer-content" onClick={(e) => e.stopPropagation()}>
        <div className="photo-viewer-header">
          <h3>Fotos de la Tarea ({selectedPhotoIndex + 1}/{photos.length})</h3>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="photo-viewer-main">
          <img
            src={selectedPhoto.file_path}
            alt={selectedPhoto.original_filename}
            className="main-photo"
          />
        </div>

        {photos.length > 1 && (
          <div className="photo-thumbnails">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                className={`thumbnail ${index === selectedPhotoIndex ? 'selected' : ''}`}
                onClick={() => setSelectedPhotoIndex(index)}
              >
                <img
                  src={photo.thumbnail_path || photo.file_path}
                  alt={photo.original_filename}
                />
              </button>
            ))}
          </div>
        )}

        <div className="photo-info">
          <p><strong>Archivo:</strong> {selectedPhoto.original_filename}</p>
          <p><strong>Subida:</strong> {new Date(selectedPhoto.uploaded_at).toLocaleString()}</p>
          <p><strong>Tamaño:</strong> {(selectedPhoto.file_size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      </div>
    </div>
  );
};