import React, { useState, useEffect } from 'react';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CheckIcon // Ajout de CheckIcon pour le bouton global
} from '@heroicons/react/24/outline';

export default function RetoursMobiles() {
  const [returnedMobiles, setReturnedMobiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalContent, setConfirmModalContent] = useState({ title: "", message: "" });
  const [onConfirmAction, setOnConfirmAction] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedMobiles, setSelectedMobiles] = useState([]); // Nouveau: pour stocker les IDs des mobiles sélectionnés

  const openConfirmModal = (title, message, action) => {
    setConfirmModalContent({ title, message });
    setOnConfirmAction(() => action);
    setIsConfirming(false);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmModalContent({ title: "", message: "" });
    setOnConfirmAction(null);
    setIsConfirming(false);
  };

  const fetchReturnedMobiles = async () => {
    setLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const response = await fetch('http://localhost:3001/api/returns');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de la récupération des mobiles retournés.');
      }
      const data = await response.json();
      setReturnedMobiles(data);
    } catch (error) {
      console.error('Erreur lors du chargement des mobiles retournés:', error);
      setStatusMessage({ type: 'error', text: `Erreur lors du chargement des retours: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnedMobiles();
  }, []);

  // Gère le changement d'état d'une case à cocher individuelle
  const handleCheckboxChange = (returnId) => {
    setSelectedMobiles(prevSelected => {
      if (prevSelected.includes(returnId)) {
        return prevSelected.filter(id => id !== returnId);
      } else {
        return [...prevSelected, returnId];
      }
    });
  };

  // Gère la sélection/désélection de toutes les cases à cocher
  const handleSelectAllChange = (e) => {
    if (e.target.checked) {
      const allReturnIds = filteredMobiles
        .filter(mobile => mobile.status === 'retourne') // Seulement les mobiles en attente d'envoi
        .map(mobile => mobile.return_id);
      setSelectedMobiles(allReturnIds);
    } else {
      setSelectedMobiles([]);
    }
  };

  // Fonction pour envoyer les mobiles sélectionnés au fournisseur
  const handleSendSelectedToSupplier = () => {
    if (selectedMobiles.length === 0) {
      setStatusMessage({ type: 'error', text: 'Veuillez sélectionner au moins un mobile à envoyer.' });
      return;
    }

    const mobilesToSend = returnedMobiles.filter(mobile => selectedMobiles.includes(mobile.return_id) && mobile.status === 'retourne');

    if (mobilesToSend.length === 0) {
      setStatusMessage({ type: 'error', text: 'Aucun mobile sélectionné n\'est en attente d\'envoi.' });
      return;
    }

    openConfirmModal(
      "Confirmer l'envoi groupé au fournisseur",
      `Êtes-vous sûr de vouloir envoyer ${mobilesToSend.length} mobile(s) sélectionné(s) au fournisseur pour remplacement ?`,
      async () => {
        setIsConfirming(true);
        try {
          // Envoyer un tableau d'IDs au backend
          const res = await fetch('http://localhost:3001/api/returns/send-to-supplier-batch', { // Nouvelle route ou modification de l'existante
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ return_ids: mobilesToSend.map(m => m.return_id) }),
          });

          const data = await res.json();
          if (res.ok) {
            setStatusMessage({ type: 'success', text: `${mobilesToSend.length} mobile(s) marqué(s) comme envoyé(s) au fournisseur !` });
            setSelectedMobiles([]); // Réinitialiser la sélection
            fetchReturnedMobiles(); // Rafraîchir la liste
          } else {
            setStatusMessage({ type: 'error', text: data.error || 'Erreur lors de l\'envoi groupé au fournisseur.' });
          }
        } catch (error) {
          console.error('Erreur lors de l\'envoi groupé au fournisseur:', error);
          setStatusMessage({ type: 'error', text: 'Erreur de communication avec le serveur lors de l\'envoi groupé.' });
        } finally {
          setIsConfirming(false);
          closeConfirmModal();
        }
      }
    );
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtrer les mobiles retournés :
  // 1. Exclure ceux qui ont le statut 'sent_to_supplier'
  // 2. Appliquer la recherche par terme
  const filteredMobiles = returnedMobiles.filter(mobile => {
    // Condition 1: Exclure les mobiles déjà envoyés au fournisseur
    if (mobile.status === 'sent_to_supplier') {
      return false;
    }

    // Condition 2: Appliquer le filtre de recherche
    const searchLower = searchTerm.toLowerCase();
    return (
      (mobile.client_nom && mobile.client_nom.toLowerCase().includes(searchLower)) ||
      (mobile.imei && mobile.imei.toLowerCase().includes(searchLower)) ||
      (mobile.marque && mobile.marque.toLowerCase().includes(searchLower)) ||
      (mobile.modele && mobile.modele.toLowerCase().includes(searchLower)) ||
      (mobile.reason && mobile.reason.toLowerCase().includes(searchLower))
    );
  });

  // Vérifie si tous les mobiles affichés (et en attente d'envoi) sont sélectionnés
  const allDisplayedMobilesSelected = filteredMobiles
    .filter(mobile => mobile.status === 'retourne') // Seulement les mobiles en attente d'envoi
    .every(mobile => selectedMobiles.includes(mobile.return_id));


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
        <ArrowLeftIcon className="h-6 w-6 text-gray-600 mr-2 print-hidden" />
        Mobiles Retournés
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

      <div className="mb-6 flex justify-center no-print">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Rechercher par client, IMEI, marque, modèle ou motif"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          />
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 no-print">
        {/* Bouton global pour envoyer au fournisseur */}
        <button
          onClick={handleSendSelectedToSupplier}
          disabled={selectedMobiles.length === 0 || isConfirming}
          className={`flex items-center px-4 py-2 rounded-md font-medium transition duration-200
            ${selectedMobiles.length === 0 || isConfirming
              ? 'bg-indigo-300 text-white cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
            }`}
        >
          <CheckIcon className="h-5 w-5 mr-2" />
          Envoyer Sélection au Fournisseur ({selectedMobiles.length})
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200 font-medium"
        >
          <PrinterIcon className="h-5 w-5 mr-2" />
          Imprimer la liste
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center text-sm">Chargement des mobiles retournés...</p>
      ) : filteredMobiles.length === 0 ? (
        <p className="text-gray-500 text-center text-sm">Aucun mobile retourné trouvé.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            <table className="table-auto w-full text-xs divide-y divide-gray-200">
              <thead className="bg-gray-100 text-gray-700 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium no-print">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                      onChange={handleSelectAllChange}
                      checked={allDisplayedMobilesSelected && filteredMobiles.filter(mobile => mobile.status === 'retourne').length > 0}
                      disabled={filteredMobiles.filter(mobile => mobile.status === 'retourne').length === 0}
                    />
                  </th>
                  <th className="px-3 py-2 font-medium">Date Retour</th>
                  <th className="px-3 py-2 font-medium">Client</th>
                  <th className="px-3 py-2 font-medium">Téléphone</th>
                  <th className="px-3 py-2 font-medium">Marque</th>
                  <th className="px-3 py-2 font-medium">Modèle</th>
                  <th className="px-3 py-2 font-medium">Stockage</th>
                  <th className="px-3 py-2 font-medium">IMEI</th>
                  <th className="px-3 py-2 font-medium">Motif</th>
                  <th className="px-3 py-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMobiles.map((mobile) => (
                  <tr key={mobile.return_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-center no-print">
                      {mobile.status === 'retourne' && ( // Seulement si le statut est 'retourne'
                        <input
                          type="checkbox"
                          className="form-checkbox h-4 w-4 text-indigo-600 rounded"
                          checked={selectedMobiles.includes(mobile.return_id)}
                          onChange={() => handleCheckboxChange(mobile.return_id)}
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-900">
                      {new Date(mobile.return_date).toLocaleDateString('fr-FR', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{mobile.client_nom}</td>
                    <td className="px-3 py-2 text-gray-700">{mobile.client_telephone}</td>
                    <td className="px-3 py-2 text-gray-700">{mobile.marque}</td>
                    <td className="px-3 py-2 text-gray-700">{mobile.modele}</td>
                    <td className="px-3 py-2 text-gray-700">{mobile.stockage || '—'}</td>
                    <td className="px-3 py-2 text-gray-700">{mobile.imei}</td>
                    <td className="px-3 py-2 text-gray-700">{mobile.reason}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold
                        ${mobile.status === 'retourne' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${mobile.status === 'sent_to_supplier' ? 'bg-blue-100 text-blue-800' : ''}
                      `}>
                        {mobile.status === 'retourne' ? 'En attente d\'envoi' : 'Envoyé au fournisseur'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 no-print">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full relative z-[60] pointer-events-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{confirmModalContent.title}</h3>
            <p className="text-gray-700 mb-6">{confirmModalContent.message}</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
                disabled={isConfirming}
              >
                Annuler
              </button>
              <button
                onClick={onConfirmAction}
                className={`px-4 py-2 rounded-md transition ${
                  isConfirming ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
                disabled={isConfirming}
              >
                {isConfirming ? 'Confirmation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
