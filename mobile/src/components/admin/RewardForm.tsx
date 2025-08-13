import React from 'react';
import FormField from './FormField';

interface RewardFormData {
  name: string;
  description: string;
  cost: string;
}

interface RewardFormProps {
  formData: RewardFormData;
  setFormData: (data: RewardFormData) => void;
}

export default function RewardForm({ formData, setFormData }: RewardFormProps) {
  return (
    <>
      <FormField
        label="Nombre"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="Nombre de la recompensa"
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
        label="Costo en créditos"
        value={formData.cost}
        onChangeText={(text) => setFormData({ ...formData, cost: text })}
        placeholder="20"
        required
        keyboardType="numeric"
        maxLength={10}
      />
    </>
  );
}
