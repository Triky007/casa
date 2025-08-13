import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CreateButtonProps {
  onCreatePress: () => void;
  createButtonText?: string;
}

export default function CreateButton({ 
  onCreatePress, 
  createButtonText = 'Crear' 
}: CreateButtonProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createButton}
        onPress={onCreatePress}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.createButtonText}>{createButtonText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});
