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
        accessibilityLabel="Editar"
        accessibilityHint="Toca para editar este elemento"
      >
        <Ionicons name="create" size={18} color="#3B82F6" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            backgroundColor: isActive ? '#FEE2E2' : '#DCFCE7',
          },
        ]}
        onPress={onToggleStatus}
        accessibilityLabel={isActive ? statusText.active : statusText.inactive}
        accessibilityHint={`Toca para ${isActive ? statusText.active.toLowerCase() : statusText.inactive.toLowerCase()} este elemento`}
      >
        <Ionicons
          name={isActive ? 'close-circle' : 'checkmark-circle'}
          size={18}
          color={isActive ? '#EF4444' : '#10B981'}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={onDelete}
        accessibilityLabel="Eliminar"
        accessibilityHint="Toca para eliminar este elemento"
      >
        <Ionicons name="trash" size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  editButton: {
    backgroundColor: '#DBEAFE',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
});
