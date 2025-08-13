import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskCompletionPhoto } from '../types';

interface TaskPhotoViewerProps {
  photos: TaskCompletionPhoto[];
  visible: boolean;
  onClose: () => void;
  baseUrl: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const TaskPhotoViewer: React.FC<TaskPhotoViewerProps> = ({
  photos,
  visible,
  onClose,
  baseUrl,
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.title}>Fotos de la Tarea</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.emptyContainer}>
            <Ionicons name="camera-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay fotos para esta tarea</Text>
          </View>
        </View>
      </Modal>
    );
  }

  const selectedPhoto = photos[selectedPhotoIndex];

  // Debug logging
  console.log('TaskPhotoViewer - baseUrl:', baseUrl);
  console.log('TaskPhotoViewer - selectedPhoto.file_path:', selectedPhoto.file_path);
  console.log('TaskPhotoViewer - Full URL:', `${baseUrl}${selectedPhoto.file_path}`);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>
            Fotos de la Tarea ({selectedPhotoIndex + 1}/{photos.length})
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: `${baseUrl}${selectedPhoto.file_path}` }}
            style={styles.fullImage}
            resizeMode="contain"
            onError={(error) => {
              console.error('Error loading image:', error);
              console.log('Image URL:', `${baseUrl}${selectedPhoto.file_path}`);
            }}
          />
        </View>

        {photos.length > 1 && (
          <View style={styles.thumbnailContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {photos.map((photo, index) => (
                <TouchableOpacity
                  key={photo.id}
                  onPress={() => setSelectedPhotoIndex(index)}
                  style={[
                    styles.thumbnail,
                    index === selectedPhotoIndex && styles.selectedThumbnail,
                  ]}
                >
                  <Image
                    source={{
                      uri: photo.thumbnail_path
                        ? `${baseUrl}${photo.thumbnail_path}`
                        : `${baseUrl}${photo.file_path}`
                    }}
                    style={styles.thumbnailImage}
                    onError={(error) => {
                      console.error('Error loading thumbnail:', error);
                      console.log('Thumbnail URL:', photo.thumbnail_path
                        ? `${baseUrl}${photo.thumbnail_path}`
                        : `${baseUrl}${photo.file_path}`);
                    }}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.photoInfo}>
          <Text style={styles.photoInfoText}>
            Subida: {new Date(selectedPhoto.uploaded_at).toLocaleString()}
          </Text>
          <Text style={styles.photoInfoText}>
            Tamaño: {(selectedPhoto.file_size / 1024 / 1024).toFixed(2)} MB
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: screenWidth,
    height: screenHeight * 0.6,
  },
  thumbnailContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 12,
  },
  thumbnail: {
    marginHorizontal: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedThumbnail: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  thumbnailImage: {
    width: 60,
    height: 60,
  },
  photoInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  photoInfoText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
});