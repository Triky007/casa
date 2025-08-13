import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActionButtonsProps {
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  isActive: boolean;
  statusText: {
    active: string;
    inactive: string;
  };
}

export default function ActionButtons({
  onEdit,
  onToggleStatus,
  onDelete,
  isActive,
  statusText,
}: ActionButtonsProps) {
  return (
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity
        style={[styles.actionButton, styles.editButton]}
        onPress={onEdit}
      >
        <Ionicons name="create" size={14} color="#3B82F6" />
        <Text style={styles.editButtonText}>Editar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            backgroundColor: isActive ? '#FEE2E2' : '#DCFCE7',
          },
        ]}
        onPress={onToggleStatus}
      >
        <Ionicons
          name={isActive ? 'close-circle' : 'checkmark-circle'}
          size={14}
          color={isActive ? '#EF4444' : '#10B981'}
        />
        <Text
          style={[
            styles.actionButtonText,
            {
              color: isActive ? '#EF4444' : '#10B981',
            },
          ]}
        >
          {isActive ? statusText.active : statusText.inactive}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={onDelete}
      >
        <Ionicons name="trash" size={14} color="#EF4444" />
        <Text style={styles.deleteButtonText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  editButton: {
    backgroundColor: '#DBEAFE',
  },
  editButtonText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
    color: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
    color: '#EF4444',
  },
});
