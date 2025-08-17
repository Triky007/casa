import React from 'react';
import FormField from './FormField';
import FormPicker from './FormPicker';

interface UserFormData {
  username: string;
  password: string;
  role: 'admin' | 'user';
  credits: string;
  full_name: string;
  email: string;
}

interface UserFormProps {
  formData: UserFormData;
  setFormData: (data: UserFormData) => void;
  isEdit?: boolean;
}

const roleOptions = [
  { label: 'Usuario', value: 'user' },
  { label: 'Administrador', value: 'admin' },
];

export default function UserForm({ formData, setFormData, isEdit = false }: UserFormProps) {
  return (
    <>
      <FormField
        label="Nombre de usuario"
        value={formData.username}
        onChangeText={(text) => setFormData({ ...formData, username: text })}
        placeholder="Nombre de usuario"
        required={!isEdit}
        maxLength={50}
        editable={!isEdit}
        helperText={isEdit ? 'El nombre de usuario no se puede cambiar' : undefined}
      />

      <FormField
        label={isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
        placeholder={isEdit ? "Dejar vacío para mantener la actual" : "Contraseña"}
        required={!isEdit}
        secureTextEntry
        maxLength={100}
      />

      <FormField
        label="Nombre completo (opcional)"
        value={formData.full_name}
        onChangeText={(text) => setFormData({ ...formData, full_name: text })}
        placeholder="Nombre completo del usuario"
        maxLength={100}
      />

      <FormField
        label="Email (opcional)"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        placeholder="correo@ejemplo.com"
        keyboardType="email-address"
        maxLength={100}
      />

      <FormPicker
        label="Rol"
        selectedValue={formData.role}
        onValueChange={(value) => setFormData({ ...formData, role: value as 'admin' | 'user' })}
        options={roleOptions}
      />

      <FormField
        label={isEdit ? "Créditos" : "Créditos iniciales"}
        value={formData.credits}
        onChangeText={(text) => setFormData({ ...formData, credits: text })}
        placeholder="0"
        keyboardType="numeric"
        maxLength={10}
      />
    </>
  );
}
