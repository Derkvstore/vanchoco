// frontend/src/components/RemplacementsFournisseur.jsx
import React, { useState, useEffect } from 'react';
import {
  TruckIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  PrinterIcon,
  ArrowDownCircleIcon // Nouvelle icône pour la réception
} from '@heroicons/react/24/outline';

export default function RemplacementsFournisseur() {
  const [replacedMobiles, setReplacedMobiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // États pour la modale de réception du fournisseur
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [currentReplacementToReceive, setCurrentReplacementToReceive] = useState(null);
  const [resolutionType, setResolutionType] = useState(''); // 'repaired' ou 'replaced'
  const [newProductDetails, setNewProductDetails] = useState({
    marque: '', modele: '', stockage: '', type: '', type_carton: '', imei: '', prix_achat: '', prix_vente: ''
  });
  const [receiveModalError, setReceiveModalError] = useState('');
  const [isReceiving, setIsReceiving] = useState(false);

  const fetchReplacedMobiles = async () => {
    setLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const response = await fetch('http://localhost:3001/api/remplacements');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de la récupération des mobiles remplacés.');
      }
      const data = await response.json();
      setReplacedMobiles(data);
    } catch (error) {
      console.error('Erreur lors du chargement des mobiles remplacés:', error);
      setStatusMessage({ type: 'error', text: `Erreur lors du chargement des remplacements: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplacedMobiles();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const openReceiveModal = (mobile) => {
    setCurrentReplacementToReceive(mobile);
    setResolutionType(''); // Réinitialiser le type de résolution
    setNewProductDetails({ marque: '', modele: '', stockage: '', type: '', type_carton: '', imei: '', prix_achat: '', prix_vente: '' });
    setReceiveModalError('');
    setIsReceiving(false);
    setShowReceiveModal(true);
  };

  const closeReceiveModal = () => {
    setShowReceiveModal(false);
    setCurrentReplacementToReceive(null);
    setResolutionType('');
    setNewProductDetails({ marque: '', modele: '', stockage: '', type: '', type_carton: '', imei: '', prix_achat: '', prix_vente: '' });
    setReceiveModalError('');
    setIsReceiving(false);
  };

  const handleNewProductDetailsChange = (e) => {
    const { name, value } = e.target;
    setNewProductDetails(prev => ({ ...prev, [name]: value }));
    setReceiveModalError('');
  };

  const handleConfirmReceive = async () => {
    setIsReceiving(true);
    setReceiveModalError('');

    if (!resolutionType) {
      setReceiveModalError('Veuillez sélectionner un type de résolution (Réparé ou Remplacé).');
      setIsReceiving(false);
      return;
    }

    let payload = {
      remplacer_id: currentReplacementToReceive.id,
      resolution_type: resolutionType,
    };

    if (resolutionType === 'replaced') {
      const { marque, modele, imei, prix_achat, prix_vente } = newProductDetails;
      if (!marque || !modele || !imei || !prix_achat || !prix_vente || !/^\d{6}$/.test(imei)) {
        setReceiveModalError('Veuillez remplir tous les détails du nouveau produit et assurez-vous que l\'IMEI a 6 chiffres.');
        setIsReceiving(false);
        return;
      }
      payload.new_product_details = {
        ...newProductDetails,
        prix_achat: parseFloat(prix_achat),
        prix_vente: parseFloat(prix_vente),
      };
    }

    try {
      const res = await fetch('http://localhost:3001/api/remplacements/receive-from-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ type: 'success', text: data.message });
        fetchReplacedMobiles(); // Rafraîchir la liste
        closeReceiveModal();
      } else {
        setReceiveModalError(data.error || 'Erreur lors de la réception du mobile du fournisseur.');
      }
    } catch (error) {
      console.error('Erreur lors de la réception du mobile du fournisseur:', error);
      setReceiveModalError('Erreur de communication avec le serveur.');
    } finally {
      setIsReceiving(false);
    }
  };

  const filteredMobiles = replacedMobiles.filter(mobile => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (mobile.marque && mobile.marque.toLowerCase().includes(searchLower)) ||
      (mobile.modele && mobile.modele.toLowerCase().includes(searchLower)) ||
      (mobile.imei && mobile.imei.toLowerCase().includes(searchLower)) ||
      (mobile.stockage && mobile.stockage.toLowerCase().includes(searchLower)) ||
      (mobile.type && mobile.type.toLowerCase().includes(searchLower)) ||
      (mobile.type_carton && mobile.type_carton.toLowerCase().includes(searchLower)) ||
      (mobile.resolution_status && mobile.resolution_status.toLowerCase().includes(searchLower))
    );
  });

  // Déterminer le texte du bouton de confirmation
  const getConfirmButtonText = () => {
    if (isReceiving) {
      return 'Enregistrement...';
    }
    if (resolutionType === 'repaired') {
      return 'Confirmer la réparation';
    }
    if (resolutionType === 'replaced') {
      return 'Confirmer le remplacement';
    }
    return 'Confirmer la réception';
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
        <TruckIcon className="h-6 w-6 text-gray-600 mr-2 print-hidden" />
        Mobiles Envoyés aux Fournisseurs (Remplacements)
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
            placeholder="Rechercher par marque, modèle, IMEI, etc."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          />
        </div>
      </div>

      <div className="flex justify-end mb-4 no-print">
        <button
          onClick={handlePrint}
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200 font-medium"
        >
          <PrinterIcon className="h-5 w-5 mr-2" />
          Imprimer la liste
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center text-sm">Chargement des mobiles envoyés aux fournisseurs...</p>
      ) : filteredMobiles.length === 0 ? (
        <p className="text-gray-500 text-center text-sm">Aucun mobile envoyé au fournisseur trouvé.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            <table className="table-auto w-full text-xs divide-y divide-gray-200">
              <thead className="bg-gray-100 text-gray-700 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Date Envoi</th>
                  <th className="px-3 py-2 font-medium">Marque</th>
                  <th className="px-3 py-2 font-medium">Modèle</th>
                  <th className="px-3 py-2 font-medium">Stockage</th>
                  <th className="px-3 py-2 font-medium">Type Carton</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">IMEI</th>
                  <th className="px-3 py-2 font-medium">Statut Résolution</th>
                  <th className="px-3 py-2 font-medium">Date Réception</th>
                  <th className="px-3 py-2 font-medium no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMobiles.map((mobile) => (
                  <tr key={mobile.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900">
                      {new Date(mobile.date_sent_to_supplier).toLocaleDateString('fr-FR', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{mobile.marque}</td>
                    <td className="px-3 py-2 text-gray-700">{mobile.modele}</td>
                    <td className="px-3 py-2 text-gray-700">{mobile.stockage || '—'}</td>
                    <td className="px-3 py-2 text-gray-700">{mobile.type_carton || '—'}</td>
                    <td className="px-3 py-2 text-gray-700">{mobile.type || '—'}</td>
                    <td className="px-3 py-2 text-gray-700">{mobile.imei}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold
                        ${mobile.resolution_status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${mobile.resolution_status === 'REPAIRED' ? 'bg-green-100 text-green-800' : ''}
                        ${mobile.resolution_status === 'REPLACED' ? 'bg-blue-100 text-blue-800' : ''}
                      `}>
                        {mobile.resolution_status === 'PENDING' ? 'En attente' : mobile.resolution_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {mobile.received_date ? new Date(mobile.received_date).toLocaleDateString('fr-FR', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) : '—'}
                    </td>
                    <td className="px-3 py-2 text-center space-x-1 no-print">
                      {mobile.resolution_status === 'PENDING' && (
                        <button
                          onClick={() => openReceiveModal(mobile)}
                          className="p-1 rounded-full text-green-600 hover:bg-green-100 transition"
                          title="Marquer comme reçu du fournisseur"
                        >
                          <ArrowDownCircleIcon className="h-4 w-4" />
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

      {/* Modale de réception du fournisseur */}
      {showReceiveModal && currentReplacementToReceive && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 no-print">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
              Réception du mobile "{currentReplacementToReceive.marque} {currentReplacementToReceive.modele} ({currentReplacementToReceive.imei})"
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de résolution du fournisseur :
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="resolutionType"
                    value="repaired"
                    checked={resolutionType === 'repaired'}
                    onChange={() => setResolutionType('repaired')}
                    className="form-radio text-green-600"
                  />
                  <span className="ml-2 text-gray-700">Réparé</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="resolutionType"
                    value="replaced"
                    checked={resolutionType === 'replaced'}
                    onChange={() => setResolutionType('replaced')}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">Remplacé</span>
                </label>
              </div>
            </div>

            {resolutionType === 'replaced' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"> {/* ✅ Changement ici : grid-cols-2 */}
                <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3 col-span-full">Détails du nouveau produit (remplacement)</h4>
                <div>
                  <label htmlFor="newMarque" className="block text-sm font-medium text-gray-700 mb-1">Marque *</label>
                  <input type="text" id="newMarque" name="marque" value={newProductDetails.marque} onChange={handleNewProductDetailsChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="newModele" className="block text-sm font-medium text-gray-700 mb-1">Modèle *</label>
                  <input type="text" id="newModele" name="modele" value={newProductDetails.modele} onChange={handleNewProductDetailsChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="newStockage" className="block text-sm font-medium text-gray-700 mb-1">Stockage</label>
                  <input type="text" id="newStockage" name="stockage" value={newProductDetails.stockage} onChange={handleNewProductDetailsChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="newType" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <input type="text" id="newType" name="type" value={newProductDetails.type} onChange={handleNewProductDetailsChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="newTypeCarton" className="block text-sm font-medium text-gray-700 mb-1">Type Carton</label>
                  <input type="text" id="newTypeCarton" name="type_carton" value={newProductDetails.type_carton} onChange={handleNewProductDetailsChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="newImei" className="block text-sm font-medium text-gray-700 mb-1">IMEI (6 chiffres) *</label>
                  <input type="text" id="newImei" name="imei" value={newProductDetails.imei} onChange={handleNewProductDetailsChange} maxLength={6} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="newPrixAchat" className="block text-sm font-medium text-gray-700 mb-1">Prix Achat *</label>
                  <input type="number" id="newPrixAchat" name="prix_achat" value={newProductDetails.prix_achat} onChange={handleNewProductDetailsChange} min="0" step="0.01" required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label htmlFor="newPrixVente" className="block text-sm font-medium text-gray-700 mb-1">Prix Vente *</label>
                  <input type="number" id="newPrixVente" name="prix_vente" value={newProductDetails.prix_vente} onChange={handleNewProductDetailsChange} min="0" step="0.01" required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
            )}

            {receiveModalError && (
              <p className="text-red-500 text-sm mt-2">{receiveModalError}</p>
            )}

            <div className="flex justify-center space-x-4 mt-8">
              <button
                onClick={closeReceiveModal}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition duration-200 font-medium"
                disabled={isReceiving}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReceive}
                className={`px-6 py-3 rounded-full transition duration-200 font-medium shadow-md ${
                  isReceiving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                disabled={isReceiving}
              >
                {getConfirmButtonText()} {/* ✅ Utilisation de la fonction pour le texte dynamique */}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
