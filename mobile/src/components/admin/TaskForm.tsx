import React from 'react';
import FormField from './FormField';
import FormPicker from './FormPicker';

interface TaskFormData {
  name: string;
  description: string;
  credits: string;
  task_type: 'individual' | 'collective';
  periodicity: 'daily' | 'weekly' | 'special';
}

interface TaskFormProps {
  formData: TaskFormData;
  setFormData: (data: TaskFormData) => void;
}

const taskTypeOptions = [
  { label: 'Individual', value: 'individual' },
  { label: 'Colectiva', value: 'collective' },
];

const periodicityOptions = [
  { label: 'Diaria', value: 'daily' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'Especial', value: 'special' },
];

export default function TaskForm({ formData, setFormData }: TaskFormProps) {
  return (
    <>
      <FormField
        label="Nombre"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="Nombre de la tarea"
        required
        maxLength={100}
      />

      <FormField
        label="Descripción"
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
        placeholder="Descripción opcional"
        multiline
        numberOfLines={3}
        maxLength={500}
      />

      <FormField
        label="Créditos"
        value={formData.credits}
        onChangeText={(text) => setFormData({ ...formData, credits: text })}
        placeholder="10"
        required
        keyboardType="numeric"
        maxLength={10}
      />

      <FormPicker
        label="Tipo de tarea"
        selectedValue={formData.task_type}
        onValueChange={(value) => setFormData({ ...formData, task_type: value as 'individual' | 'collective' })}
        options={taskTypeOptions}
      />

      <FormPicker
        label="Periodicidad"
        selectedValue={formData.periodicity}
        onValueChange={(value) => setFormData({ ...formData, periodicity: value as 'daily' | 'weekly' | 'special' })}
        options={periodicityOptions}
      />
    </>
  );
}
