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

  // --- NOUVEAU : Tableau des quartiers de Bamako pour l'autocomplétion ---
  // Vous pouvez enrichir cette liste avec plus de quartiers et localités de Bamako.
  const bamakoQuartiers = [
    "Hamdallaye", "Hippodrome", "Badalabougou", "ACI 2000", "Missabougou",
    "Sébénikoro", "Niamakoro", "Kalaban Coura", "Magnambougou", "Korofina",
    "Djicoroni Para", "Gozing", "Boulkassoumbougou", "Dravéla", "Faladiè",
    "Baco-Djicoroni", "Baco-Djicoroni ACI","Baco-Djicoroni GOLF","Yirimadio", "Souleymanebougou", "Sogoniko",
    "Daoudabougou", "Titibougou", "Diallabougou", "Banankabougou", "Malitel Da", "Suguba",
    "Niomirambougou", "Samé", "Sabougnidoum", "Dougourakoro", "Sirakoro",
    "Djelibougou", "Point G", "Kati", // Kati est une ville proche, souvent incluse dans le contexte de Bamako
    // Ajoutez d'autres quartiers de Bamako ici
  ].sort(); // Trie par ordre alphabétique

  const [addressSuggestions, setAddressSuggestions] = useState([]);
  // --- FIN NOUVEAU ---

  const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;

  // Charger clients
  const fetchClients = () => {
    fetch(`${API_BASE_URL}/api/clients`)
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
      ? `${API_BASE_URL}/api/clients/${editingId}`
      : `${API_BASE_URL}/api/clients`;

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
      setAddressSuggestions([]); // Réinitialise les suggestions après soumission
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Confirmer la suppression ?')) {
      const res = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
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
    setAddressSuggestions([]); // Cache les suggestions lors de l'édition
  };

  const filteredClients = clients.filter((c) =>
    c.nom.toLowerCase().includes(search.toLowerCase())
  );

  // --- NOUVEAU : Gère la saisie de l'adresse et les suggestions ---
  const handleAddressChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, adresse: value });

    if (value.length > 0) {
      const filteredSuggestions = bamakoQuartiers.filter(quartier =>
        quartier.toLowerCase().includes(value.toLowerCase())
      );
      setAddressSuggestions(filteredSuggestions);
    } else {
      setAddressSuggestions([]);
    }
  };

  const selectAddressSuggestion = (suggestion) => {
    setForm({ ...form, adresse: suggestion });
    setAddressSuggestions([]); // Cache les suggestions après sélection
  };
  // --- FIN NOUVEAU ---

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
          setAddressSuggestions([]); // Réinitialise les suggestions lors de l'ouverture
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
          {/* --- MODIFICATION ICI : Champ adresse avec autocomplétion --- */}
          <div className="relative"> {/* Conteneur pour positionner les suggestions */}
            <input
              type="text"
              placeholder="Adresse"
              value={form.adresse}
              onChange={handleAddressChange} // Utilise la nouvelle fonction
              onBlur={() => setTimeout(() => setAddressSuggestions([]), 100)} // Cache les suggestions quand l'input perd le focus (avec délai pour permettre le clic)
              className="w-full border border-gray-300 rounded px-4 py-2"
            />
            {addressSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-b mt-1 max-h-48 overflow-y-auto shadow-lg">
                {addressSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => selectAddressSuggestion(suggestion)}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* --- FIN MODIFICATION --- */}

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
                setAddressSuggestions([]); // Réinitialise les suggestions lors de l'annulation
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