import React, { useState } from 'react';
import { TaskCompletionPhoto } from '../types';
import './PhotoViewer.css';

// Helper function to get the correct base URL for images
const getImageBaseUrl = () => {
  // En Docker, usar la URL actual del navegador
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  console.log('🖼️ PhotoViewer - Using image base URL:', baseUrl);
  return baseUrl;
};

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
            src={`${getImageBaseUrl()}${selectedPhoto.file_path}`}
            alt={selectedPhoto.original_filename}
            className="main-photo"
            onError={(e) => {
              console.error('❌ Error loading main photo:', e);
              console.log('🔗 Main photo URL:', `${getImageBaseUrl()}${selectedPhoto.file_path}`);
              console.log('🖼️ Image Base URL:', getImageBaseUrl());
            }}
            onLoad={() => {
              console.log('✅ Main photo loaded successfully:', `${getImageBaseUrl()}${selectedPhoto.file_path}`);
            }}
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
                  src={`${getImageBaseUrl()}${photo.thumbnail_path || photo.file_path}`}
                  alt={photo.original_filename}
                  onError={(e) => {
                    console.error('❌ Error loading thumbnail:', e);
                    console.log('🔗 Thumbnail URL:', `${getImageBaseUrl()}${photo.thumbnail_path || photo.file_path}`);
                  }}
                  onLoad={() => {
                    console.log('✅ Thumbnail loaded successfully:', `${getImageBaseUrl()}${photo.thumbnail_path || photo.file_path}`);
                  }}
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