import React from 'react';
import { ClientProfile } from './ClientDashboard';

interface ClientProfileFormProps {
  profile: ClientProfile;
  onSave: (profile: ClientProfile) => void;
}

export const ClientProfileForm: React.FC<ClientProfileFormProps> = ({ profile, onSave }) => {
  const [form, setForm] = React.useState(profile);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded shadow-sm bg-white">
      <div className="font-semibold mb-2">Editar Perfil</div>
      <div>
        <label className="block text-sm font-medium mb-1">Nome</label>
        <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Endereço</label>
        <input name="address" value={form.address} onChange={handleChange} className="w-full border rounded px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Telefone</label>
        <input name="phone" value={form.phone} onChange={handleChange} className="w-full border rounded px-2 py-1" />
      </div>
      {/* Geolocalização pode ser editada futuramente */}
      <button type="submit" className="mt-2 px-3 py-1 bg-blue-600 text-white rounded">Salvar</button>
    </form>
  );
};
