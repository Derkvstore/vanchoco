// NouvelAchat.jsx
import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function NouvelAchat({ onClose, setStatusMessage }) {
  const [formData, setFormData] = useState({
    marque: '',
    modele: '',
    stockage: '',
    type_carton: '',
    type: '',
    imei: '',
    prix_achat: '',
    quantite: '1', // Par défaut à 1 pour les téléphones
    isSpecialSale: false, // Nouveau champ pour la vente spéciale
    nom_client: '',
    client_telephone: '',
    prix_vente_unitaire: '', // Prix de vente pour la vente spéciale
    montant_paye_client: '', // Montant payé par le client pour la vente spéciale
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    setStatusMessage({ type: '', text: '' });

    try {
      let endpoint = '';
      let body = {};

      if (formData.isSpecialSale) {
        endpoint = 'http://localhost:3001/api/achats/vente-speciale';
        body = {
          imei: formData.imei,
          marque: formData.marque,
          modele: formData.modele,
          stockage: formData.stockage || null,
          type: formData.type || null,
          type_carton: formData.type_carton || null,
          prix_achat: parseFloat(formData.prix_achat),
          prix_vente_unitaire: parseFloat(formData.prix_vente_unitaire),
          nom_client: formData.nom_client,
          client_telephone: formData.client_telephone || null,
          montant_paye_client: parseFloat(formData.montant_paye_client),
        };
        // Validation spécifique pour vente spéciale
        if (!body.prix_vente_unitaire || isNaN(body.prix_vente_unitaire)) {
          setFormError('Le prix de vente unitaire est requis pour une vente spéciale.');
          setLoading(false);
          return;
        }
        if (!body.nom_client) {
          setFormError('Le nom du client est requis pour une vente spéciale.');
          setLoading(false);
          return;
        }
      } else {
        endpoint = 'http://localhost:3001/api/achats';
        body = {
          marque: formData.marque,
          modele: formData.modele,
          stockage: formData.stockage || null,
          type_carton: formData.type_carton || null,
          type: formData.type || null,
          imei: formData.imei,
          prix_achat: parseFloat(formData.prix_achat),
          quantite: parseInt(formData.quantite, 10),
        };
        // Validation spécifique pour achat normal
        if (!body.quantite || isNaN(body.quantite) || body.quantite <= 0) {
          setFormError('La quantité doit être un nombre positif pour un achat normal.');
          setLoading(false);
          return;
        }
      }

      // Validations communes
      if (!body.marque || !body.modele || !body.imei || !body.prix_achat || isNaN(body.prix_achat) || body.prix_achat <= 0) {
        setFormError('Marque, modèle, IMEI et prix d\'achat valides sont requis.');
        setLoading(false);
        return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'opération.');
      }

      setStatusMessage({ type: 'success', text: data.message || 'Opération réussie !' });
      onClose(); // Ferme la modale et déclenche le rechargement
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      setFormError(error.message || 'Erreur de communication avec le serveur.');
      setStatusMessage({ type: 'error', text: `Échec: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 no-print">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full relative z-[60] pointer-events-auto">
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
          {formData.isSpecialSale ? 'Nouvelle Vente Spéciale' : 'Nouvel Achat (pour stock)'}
        </h3>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {formError && (
          <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 border border-red-400 text-sm">
            <XCircleIcon className="h-5 w-5 inline mr-2" />
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="isSpecialSale"
              name="isSpecialSale"
              checked={formData.isSpecialSale}
              onChange={handleChange}
              className="form-checkbox h-5 w-5 text-indigo-600 rounded"
            />
            <label htmlFor="isSpecialSale" className="text-gray-700 font-medium">
              Ceci est une vente spéciale (n'affecte pas le stock principal)
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="marque" className="block text-sm font-medium text-gray-700">Marque <span className="text-red-500">*</span></label>
              <input type="text" id="marque" name="marque" value={formData.marque} onChange={handleChange} required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="modele" className="block text-sm font-medium text-gray-700">Modèle <span className="text-red-500">*</span></label>
              <input type="text" id="modele" name="modele" value={formData.modele} onChange={handleChange} required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="stockage" className="block text-sm font-medium text-gray-700">Stockage</label>
              <input type="text" id="stockage" name="stockage" value={formData.stockage} onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ex: 128GB, 256GB"
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
              <select id="type" name="type" value={formData.type} onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Sélectionner</option>
                <option value="Neuf">Neuf</option>
                <option value="Occasion">Occasion</option>
                <option value="Reconditionné">Reconditionné</option>
              </select>
            </div>
            <div>
              <label htmlFor="type_carton" className="block text-sm font-medium text-gray-700">Type Carton</label>
              <select id="type_carton" name="type_carton" value={formData.type_carton} onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Sélectionner</option>
                <option value="Original">Original</option>
                <option value="Neutre">Neutre</option>
              </select>
            </div>
            <div>
              <label htmlFor="imei" className="block text-sm font-medium text-gray-700">IMEI <span className="text-red-500">*</span></label>
              <input type="text" id="imei" name="imei" value={formData.imei} onChange={handleChange} required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prix_achat" className="block text-sm font-medium text-gray-700">Prix d'Achat (CFA) <span className="text-red-500">*</span></label>
              <input type="number" id="prix_achat" name="prix_achat" value={formData.prix_achat} onChange={handleChange} required min="0" step="any"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            {!formData.isSpecialSale && (
              <div>
                <label htmlFor="quantite" className="block text-sm font-medium text-gray-700">Quantité <span className="text-red-500">*</span></label>
                <input type="number" id="quantite" name="quantite" value={formData.quantite} onChange={handleChange} required min="1"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            )}
          </div>

          {formData.isSpecialSale && (
            <fieldset className="border p-4 rounded-md shadow-sm space-y-4">
              <legend className="text-base font-semibold text-gray-900">Détails de la Vente Spéciale</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prix_vente_unitaire" className="block text-sm font-medium text-gray-700">Prix de Vente (CFA) <span className="text-red-500">*</span></label>
                  <input type="number" id="prix_vente_unitaire" name="prix_vente_unitaire" value={formData.prix_vente_unitaire} onChange={handleChange} required min="0" step="any"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="nom_client" className="block text-sm font-medium text-gray-700">Nom du Client <span className="text-red-500">*</span></label>
                  <input type="text" id="nom_client" name="nom_client" value={formData.nom_client} onChange={handleChange} required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="client_telephone" className="block text-sm font-medium text-gray-700">Téléphone Client</label>
                  <input type="text" id="client_telephone" name="client_telephone" value={formData.client_telephone} onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="montant_paye_client" className="block text-sm font-medium text-gray-700">Montant Payé par Client (CFA)</label>
                  <input type="number" id="montant_paye_client" name="montant_paye_client" value={formData.montant_paye_client} onChange={handleChange} min="0" step="any"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </fieldset>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200 font-medium"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md transition duration-200 font-medium ${
                loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}