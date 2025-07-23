// Achats.jsx
import React, { useState, useEffect } from 'react';
import {
  PlusCircleIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShoppingCartIcon, // Ajouté pour le bouton Nouvelle Vente Spéciale
} from '@heroicons/react/24/outline';

// Supposons que vous ayez un composant pour ajouter un nouvel achat,
// ou que vous allez intégrer la logique dans une modale ici.
// Pour l'exemple, nous allons utiliser un bouton qui ouvrirait un formulaire/modale.
import NouvelAchat from './NouvelAchat'; // Composant que je vais vous donner plus bas

export default function Achats() {
  const [achats, setAchats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false); // Pour ouvrir la modale d'ajout/vente spéciale

  const formatCFA = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'N/A';
    }
    return parseFloat(amount).toLocaleString('fr-FR', {
      useGrouping: false,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const fetchAchats = async () => {
    setLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const response = await fetch('http://localhost:3001/api/achats');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de la récupération des achats.');
      }
      const data = await response.json();
      setAchats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des achats:', error);
      setStatusMessage({ type: 'error', text: `Erreur lors du chargement de l'historique des achats: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchats();
  }, []);

  const filteredAchats = achats.filter(achat => {
    const searchLower = searchTerm.toLowerCase();
    const marqueMatch = achat.marque ? achat.marque.toLowerCase().includes(searchLower) : false;
    const modeleMatch = achat.modele ? achat.modele.toLowerCase().includes(searchLower) : false;
    const imeiMatch = achat.imei ? achat.imei.toLowerCase().includes(searchLower) : false;
    const typeMatch = achat.type ? achat.type.toLowerCase().includes(searchLower) : false;
    const typeCartonMatch = achat.type_carton ? achat.type_carton.toLowerCase().includes(searchLower) : false;

    return marqueMatch || modeleMatch || imeiMatch || typeMatch || typeCartonMatch;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    fetchAchats(); // Recharger les achats après l'ajout/vente
  };

  return (
    <div id="printableContent" className="p-4 max-w-full mx-auto font-sans bg-gray-50 rounded-xl shadow border border-gray-200">
      <style>
        {`
        @media print {
          body * { visibility: hidden; }
          #printableContent, #printableContent * { visibility: visible; }
          #printableContent { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: none; box-shadow: none; border: none; }
          .no-print, .print-hidden { display: none !important; }
          #vite-error-overlay, #react-devtools-content { display: none !important; }
          .overflow-x-auto { overflow-x: visible !important; }
          .min-w-\\[1200px\\] { min-width: unset !important; }
          table { width: 100% !important; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; font-size: 9pt; }
          body { font-size: 10pt; }
          .print-header { display: block !important; text-align: center; margin-bottom: 20px; font-size: 18pt; font-weight: bold; color: #333; }
        }
        `}
      </style>

      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center flex items-center justify-center print-header">
        <ShoppingCartIcon className="h-6 w-6 text-gray-600 mr-2 print-hidden" />
        Historique des Achats
      </h2>

      {statusMessage.text && (
        <div className={`mb-4 p-3 rounded-md flex items-center justify-between text-sm no-print
          ${statusMessage.type === 'success' ? 'bg-green-100 text-green-700 border border-green-400' : 'bg-red-100 text-red-700 border border-red-400'}`}>
          <span>
            {statusMessage.type === 'success' ? <CheckCircleIcon className="h-5 w-5 inline mr-2" /> : <XCircleIcon className="h-5 w-5 inline mr-2" />}
            {statusMessage.text}
          </span>
          <button onClick={() => setStatusMessage({ type: '', text: '' })} className="ml-4">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="mb-6 flex justify-between items-center no-print">
        <div className="relative w-full max-w-sm mr-4">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Rechercher par marque, modèle, IMEI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200 font-medium shadow-md"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Nouvel Achat
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200 font-medium"
          >
            <PrinterIcon className="h-5 w-5 mr-2" />
            Imprimer
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center text-sm">Chargement des achats...</p>
      ) : filteredAchats.length === 0 ? (
        <p className="text-gray-500 text-center text-sm">Aucun achat trouvé correspondant à votre recherche.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            <table className="table-auto w-full text-xs divide-y divide-gray-200">
              <thead className="bg-gray-100 text-gray-700 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Date Achat</th>
                  <th className="px-3 py-2 font-medium">Marque</th>
                  <th className="px-3 py-2 font-medium">Modèle</th>
                  <th className="px-3 py-2 font-medium">Stockage</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Type Carton</th>
                  <th className="px-3 py-2 font-medium">IMEI</th>
                  <th className="px-3 py-2 font-medium text-right">Qté</th>
                  <th className="px-3 py-2 font-medium text-right">Prix Achat Unit.</th>
                  <th className="px-3 py-2 font-medium text-center">Statut</th> {/* ✅ Nouveau Statut */}
                  <th className="px-3 py-2 font-medium text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAchats.map((achat) => (
                  <tr key={achat.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900">
                      {new Date(achat.date_achat).toLocaleDateString('fr-FR', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{achat.marque}</td>
                    <td className="px-3 py-2 text-gray-700">{achat.modele}</td>
                    <td className="px-3 py-2 text-gray-700">{achat.stockage || '—'}</td>
                    <td className="px-3 py-2 text-gray-700">{achat.type || '—'}</td>
                    <td className="px-3 py-2 text-gray-700">{achat.type_carton || '—'}</td>
                    <td className="px-3 py-2 text-gray-700">{achat.imei}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{achat.quantite}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatCFA(achat.prix_achat)}</td>
                    <td className="px-3 py-2 text-center">
                       <span className={`px-2 py-1 rounded-full text-[10px] font-semibold
                         ${achat.statut_achat_vente === 'stock_normal' ? 'bg-blue-100 text-blue-800' : ''}
                         ${achat.statut_achat_vente === 'vente_speciale' ? 'bg-purple-100 text-purple-800' : ''}
                       `}>
                         {achat.statut_achat_vente === 'stock_normal' ? 'En stock' : 'Vente Spéciale'}
                       </span>
                    </td>
                    <td className="px-3 py-2 text-center space-x-1 no-print">
                      {/* Actions spécifiques si besoin (édition, suppression) */}
                      {/* Si statut_achat_vente est 'vente_speciale', peut-être afficher un lien vers la vente */}
                      {achat.statut_achat_vente === 'vente_speciale' && achat.vente_id && (
                          <button
                            title="Voir la vente associée"
                            // onClick={() => navigate(`/ventes/${achat.vente_id}`)} // Exemple avec React Router
                            className="p-1 rounded-full text-indigo-600 hover:bg-indigo-100 transition"
                          >
                            {/* Assurez-vous d'avoir une icône pour "voir" ou "lien" */}
                            <ShoppingCartIcon className="h-4 w-4" />
                          </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modale pour l'ajout d'achat ou vente spéciale */}
      {showAddModal && (
        <NouvelAchat onClose={handleCloseModal} setStatusMessage={setStatusMessage} />
      )}
    </div>
  );
}