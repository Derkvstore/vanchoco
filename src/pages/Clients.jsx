import React, { useEffect, useState } from 'react';
import {
  PencilIcon,
  TrashIcon,
  UserIcon,
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', telephone: '', adresse: '' });
  const [editingId, setEditingId] = useState(null);

  // Charger clients
  const fetchClients = () => {
    fetch('http://localhost:3001/api/clients')
      .then(res => res.json())
      .then(data => {
        setClients(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId
      ? `http://localhost:3001/api/clients/${editingId}`
      : 'http://localhost:3001/api/clients';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      fetchClients();
      setForm({ nom: '', telephone: '', adresse: '' });
      setEditingId(null);
      setShowForm(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Confirmer la suppression ?')) {
      const res = await fetch(`http://localhost:3001/api/clients/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) fetchClients();
    }
  };

  const handleEdit = (client) => {
    setForm({
      nom: client.nom,
      telephone: client.telephone,
      adresse: client.adresse,
    });
    setEditingId(client.id);
    setShowForm(true);
  };

  const filteredClients = clients.filter((c) =>
    c.nom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-semibold text-gray-900 mb-6 flex items-center">
        <UserIcon className="h-8 w-8 text-blue-600 mr-2" />
        Liste des clients
      </h1>

      {/* 🔍 Barre de recherche */}
      <div className="flex items-center mb-4 space-x-2">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-full px-4 py-2 w-full"
        />
      </div>

      {/* ➕ Bouton ajouter */}
      <button
        onClick={() => {
          setShowForm(true);
          setForm({ nom: '', telephone: '', adresse: '' });
          setEditingId(null);
        }}
        className="mb-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Ajouter un client
      </button>

      {/* 📝 Formulaire d'ajout/modification */}
      {showForm && (
        <form
          onSubmit={handleFormSubmit}
          className="bg-gray-50 p-4 rounded-lg shadow mb-6 space-y-4"
        >
          <input
            type="text"
            placeholder="Nom"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
          <input
            type="text"
            placeholder="Téléphone"
            value={form.telephone}
            onChange={(e) => setForm({ ...form, telephone: e.target.value })}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
          <input
            type="text"
            placeholder="Adresse"
            value={form.adresse}
            onChange={(e) => setForm({ ...form, adresse: e.target.value })}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {editingId ? 'Modifier' : 'Ajouter'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm({ nom: '', telephone: '', adresse: '' });
              }}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* 🧾 Table des clients */}
      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : filteredClients.length === 0 ? (
        <p className="text-gray-500">Aucun client trouvé.</p>
      ) : (
        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-700 text-left">
              <tr>
                <th className="px-6 py-3">Nom</th>
                <th className="px-6 py-3">Téléphone</th>
                <th className="px-6 py-3">Adresse</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {client.nom}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {client.telephone || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {client.adresse || '-'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(client)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <PencilIcon className="w-5 h-5 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="w-5 h-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
