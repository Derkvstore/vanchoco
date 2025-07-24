import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PencilIcon,
  ArrowUturnLeftIcon, // Pour Annuler
  ArrowPathIcon, // Pour Retour Défectueux
  ArrowDownTrayIcon, // Icône pour Rendu
  CheckCircleIcon,
  XCircleIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

export default function Sorties() {
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // États pour la modale de modification de paiement
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentSaleToEdit, setCurrentSaleToEdit] = useState(null);
  const [newMontantPaye, setNewMontantPaye] = useState('');
  // État pour le nouveau montant total négocié
  const [newTotalAmountNegotiated, setNewTotalAmountNegotiated] = useState('');

  // États pour la modale de confirmation personnalisée
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalContent, setConfirmModalContent] = useState({ title: "", message: null });
  const [onConfirmAction, setOnConfirmAction] = useState(null);
  const [returnReasonInput, setReturnReasonInput] = useState('');
  const [modalError, setModalError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const textareaRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;

  const openConfirmModal = (title, message, action) => {
    setConfirmModalContent({ title, message });
    setOnConfirmAction(() => (currentReason) => action(currentReason));
    setModalError('');
    setIsConfirming(false);
    setReturnReasonInput('');
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmModalContent({ title: "", message: null });
    setOnConfirmAction(null);
    setReturnReasonInput('');
    setModalError('');
    setIsConfirming(false);
  };

  // Fonction de formatage FCFA
  const formatCFA = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'N/A CFA';
    }
    // Assurez-vous que le montant est un nombre avant de le formater
    const numericAmount = parseFloat(amount);
    return numericAmount.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const fetchVentes = async () => {
    setLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const ventesRes = await fetch(`${API_BASE_URL}/api/ventes`);
      if (!ventesRes.ok) {
        const errorData = await ventesRes.json();
        throw new Error(errorData.error || 'Échec de la récupération des ventes.');
      }
      const ventesData = await ventesRes.json();
      setVentes(ventesData);
    } catch (error) {
      console.error('Erreur lors du chargement des ventes:', error);
      setStatusMessage({ type: 'error', text: `Erreur lors du chargement de l'historique des ventes: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentes();
  }, []);

  // Aplatir les données de vente pour l'affichage dans le tableau
  // Inclure TOUS les articles de la vente, quel que soit leur statut
  const flattenedVentes = ventes.flatMap(vente => {
    // Calculer le prix d'achat total pour cette vente spécifique
    const totalPrixAchatVente = (vente.articles || []).reduce((sum, item) => {
      const qty = parseFloat(item.quantite_vendue) || 0;
      const prixAchat = parseFloat(item.prix_unitaire_achat) || 0;
      return sum + (qty * prixAchat);
    }, 0);

    return (vente.articles || []).map(item => {
      let resteAPayerItem = 0;
      // Si l'article est actif, le reste à payer est le reste à payer de la vente globale
      if (item.statut_vente === 'actif') {
        const totalVente = parseFloat(vente.montant_total) || 0;
        const montantPayeVente = parseFloat(vente.montant_paye) || 0;
        resteAPayerItem = totalVente - montantPayeVente;
      } else {
        // Si l'article n'est pas actif (annulé, retourné, etc.), son reste à payer est 0
        resteAPayerItem = 0;
      }

      return {
        vente_id: vente.vente_id,
        date_vente: vente.date_vente,
        client_nom: vente.client_nom,
        client_telephone: vente.client_telephone || 'N/A', // Gardé pour d'autres logiques si besoin
        montant_total_vente: vente.montant_total,
        montant_paye_vente: vente.montant_paye,
        reste_a_payer_vente: resteAPayerItem, // Utilise le reste à payer calculé
        statut_paiement_vente: vente.statut_paiement,
        marque: item.marque,
        modele: item.modele,
        stockage: item.stockage,
        imei: item.imei,
        type_carton: item.type_carton,
        type: item.type,
        quantite_vendue: item.quantite_vendue,
        prix_unitaire_vente: item.prix_unitaire_vente,
        item_id: item.item_id,
        produit_id: item.produit_id,
        statut_vente: item.statut_vente, // Le statut réel de l'article sera affiché
        is_special_sale_item: item.is_special_sale_item,
        source_achat_id: item.source_achat_id,
        prix_unitaire_achat: item.prix_unitaire_achat,
        total_prix_achat_de_la_vente: totalPrixAchatVente,
      };
    });
  });

  // Filtrer les ventes aplaties selon les critères définis par l'utilisateur
  const filteredVentes = flattenedVentes.filter(data => {
    const searchLower = searchTerm.toLowerCase();
    const clientMatch = data.client_nom.toLowerCase().includes(searchLower);
    const imeiMatch = data.imei ? data.imei.toLowerCase().includes(searchLower) : false;
    const marqueMatch = data.marque ? data.marque.toLowerCase().includes(searchLower) : false;
    const modeleMatch = data.modele ? data.modele.toLowerCase().includes(searchLower) : false;

    return clientMatch || imeiMatch || marqueMatch || modeleMatch;
  });

  // Fonctions de gestion des actions

  const handleUpdatePaymentClick = (saleId, currentMontantPaye, montantTotal, totalPrixAchatDeLaVente) => {
    setCurrentSaleToEdit({
      id: saleId,
      montant_paye: currentMontantPaye,
      montant_total: montantTotal,
      total_prix_achat_de_la_vente: totalPrixAchatDeLaVente
    });
    setNewMontantPaye(String(Math.round(currentMontantPaye)));
    setNewTotalAmountNegotiated(String(Math.round(montantTotal)));
    setShowPaymentModal(true);
  };

  const handleConfirmUpdatePayment = async () => {
    const parsedNewMontantPaye = parseFloat(newMontantPaye);
    const parsedNewTotalAmountNegotiated = parseFloat(newTotalAmountNegotiated);
    const totalPrixAchatDeLaVente = currentSaleToEdit.total_prix_achat_de_la_vente;

    if (isNaN(parsedNewMontantPaye) || parsedNewMontantPaye < 0) {
      setStatusMessage({ type: 'error', text: 'Le nouveau montant payé est invalide.' });
      return;
    }

    if (isNaN(parsedNewTotalAmountNegotiated) || parsedNewTotalAmountNegotiated <= 0) {
        setStatusMessage({ type: 'error', text: 'Le nouveau montant total négocié est invalide ou négatif.' });
        return;
    }

    if (parsedNewTotalAmountNegotiated < totalPrixAchatDeLaVente) {
      setStatusMessage({ type: 'error', text: `Le nouveau montant total (${formatCFA(parsedNewTotalAmountNegotiated)}) ne peut pas être inférieur au prix d'achat total de la vente (${formatCFA(totalPrixAchatDeLaVente)}).` });
      return;
    }

    if (parsedNewMontantPaye > parsedNewTotalAmountNegotiated) {
      setStatusMessage({ type: 'error', text: `Le montant payé (${formatCFA(parsedNewMontantPaye)}) ne peut pas être supérieur au nouveau montant total de la vente (${formatCFA(parsedNewTotalAmountNegotiated)}).` });
      return;
    }

    if (parsedNewMontantPaye > 0 && parsedNewTotalAmountNegotiated < currentSaleToEdit.montant_paye) {
        setStatusMessage({ type: 'error', text: `Le nouveau montant total (${formatCFA(parsedNewTotalAmountNegotiated)}) ne peut pas être inférieur au montant déjà payé (${formatCFA(currentSaleToEdit.montant_paye)}).` });
        return;
    }

    try {
      const payload = { montant_paye: parseInt(parsedNewMontantPaye, 10) };
      if (parsedNewTotalAmountNegotiated !== currentSaleToEdit.montant_total) {
        payload.new_total_amount = parseInt(parsedNewTotalAmountNegotiated, 10);
      }

      const res = await fetch(`${API_BASE_URL}/api/ventes/${currentSaleToEdit.id}/update-payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Paiement et/ou montant total mis à jour avec succès !' });
        fetchVentes();
        setShowPaymentModal(false);
        setCurrentSaleToEdit(null);
        setNewMontantPaye('');
        setNewTotalAmountNegotiated('');
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Erreur inconnue lors de la mise à jour du paiement.' });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paiement:', error);
      setStatusMessage({ type: 'error', text: 'Erreur de communication avec le serveur lors de la mise à jour du paiement.' });
    }
  };

  const handleCancelItemClick = (item) => {
    openConfirmModal(
      "Confirmer l'annulation de l'article",
      `Êtes-vous sûr de vouloir annuler l'article "${item.marque} ${item.modele} (${item.imei})" et le remettre en stock ?`,
      async (currentReason) => {
        setIsConfirming(true);
        try {
          const res = await fetch(`${API_BASE_URL}/api/ventes/cancel-item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              venteId: item.vente_id,
              itemId: item.item_id,
              produitId: item.produit_id,
              imei: item.imei,
              quantite: item.quantite_vendue,
              reason: currentReason || 'Annulation standard',
              is_special_sale_item: item.is_special_sale_item,
            }),
          });

          const data = await res.json();
          if (res.ok) {
            setStatusMessage({ type: 'success', text: 'Article annulé et stock mis à jour avec succès !' });
            fetchVentes();
            closeConfirmModal();
          } else {
            setModalError(data.error || 'Erreur lors de l\'annulation de l\'article.');
          }
        } catch (error) {
          console.error('Erreur lors de l\'annulation de l\'article:', error);
          setModalError('Erreur de communication avec le serveur lors de l\'annulation.');
        } finally {
          setIsConfirming(false);
        }
      }
    );
  };

  const handleReturnItemClick = (item) => {
    console.log("Bouton Retour cliqué pour l'article:", item);

    const executeReturnAction = async (currentReason) => {
      console.log("Confirmation action déclenchée. Valeur actuelle de currentReason:", currentReason);
      if (!currentReason.trim()) {
        setModalError('Veuillez saisir le motif du retour.');
        return;
      }
      setIsConfirming(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/ventes/return-item`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vente_item_id: item.item_id,
            vente_id: item.vente_id,
            client_nom: item.client_nom,
            imei: item.imei,
            reason: currentReason.trim(),
            produit_id: item.produit_id,
            is_special_sale_item: item.is_special_sale_item,
            source_achat_id: item.source_achat_id,
            marque: item.marque,
            modele: item.modele,
            stockage: item.stockage,
            type: item.type,
            type_carton: item.type_carton,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setStatusMessage({ type: 'success', text: 'Mobile marqué comme défectueux et retiré du stock !' });
          fetchVentes();
          closeConfirmModal();
        } else {
          setModalError(data.error || 'Erreur lors du retour du mobile.');
        }
      } catch (error) {
        console.error('Erreur lors du retour du mobile:', error);
        setModalError('Erreur de communication avec le serveur lors du retour du mobile.');
      } finally {
        setIsConfirming(false);
      }
    };

    openConfirmModal(
      "Confirmer le retour de mobile défectueux",
      (
        <>
          <p className="text-gray-700 mb-4">
            Êtes-vous sûr de vouloir marquer le mobile "{item.marque} {item.modele} ({item.imei})" comme défectueux et le retirer du stock ? Il sera ensuite visible dans la section "Retour mobile".
          </p>
          <label htmlFor="returnReason" className="block text-sm font-medium text-gray-700 mb-2">
            Veuillez décrire le problème du mobile :
          </label>
          <textarea
            ref={textareaRef}
            id="returnReason"
            value={returnReasonInput}
            onChange={(e) => {
              setReturnReasonInput(e.target.value);
            }}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
            style={{ color: 'black !important', backgroundColor: 'white !important' }}
            placeholder="Ex: Écran cassé, batterie défectueuse, ne s'allume pas..."
            required
            autoFocus
          ></textarea>
          {modalError && (
            <p className="text-red-500 text-sm mt-2">{modalError}</p>
          )}
        </>
      ),
      executeReturnAction
    );
  };

  const handleMarkAsRenduClick = (item) => {
    console.log("Frontend: Bouton Rendu cliqué pour l'article:", item);
    // AJOUT DE LOGS POUR VÉRIFIER LES DONNÉES ENVOYÉES
    console.log("Frontend: Données envoyées pour le rendu:", {
      vente_item_id: item.item_id,
      vente_id: item.vente_id,
      produit_id: item.produit_id, // TRÈS IMPORTANT : Vérifier cette valeur
      imei: item.imei,             // TRÈS IMPORTANT : Vérifier cette valeur
      reason: "...", // La raison sera remplie par l'utilisateur
      is_special_sale_item: item.is_special_sale_item,
      marque: item.marque,
      modele: item.modele,
      stockage: item.stockage,
      type: item.type,
      type_carton: item.type_carton,
    });


    const executeRenduAction = async (currentReason) => {
      console.log("Confirmation action Rendu déclenchée. Valeur actuelle de currentReason:", currentReason);
      if (!currentReason.trim()) {
        setModalError('Veuillez saisir le motif du rendu.');
        return;
      }
      setIsConfirming(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/ventes/mark-as-rendu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vente_item_id: item.item_id,
            vente_id: item.vente_id,
            client_nom: item.client_nom,
            imei: item.imei,
            reason: currentReason.trim(),
            produit_id: item.produit_id,
            is_special_sale_item: item.is_special_sale_item,
            source_achat_id: item.source_achat_id,
            marque: item.marque,
            modele: item.modele,
            stockage: item.stockage,
            type: item.type,
            type_carton: item.type_carton,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setStatusMessage({ type: 'success', text: 'Mobile marqué comme rendu avec succès !' });
          fetchVentes();
          closeConfirmModal();
        } else {
          setModalError(data.error || 'Erreur lors du marquage comme rendu du mobile.');
        }
      } catch (error) {
        console.error('Erreur lors du marquage comme rendu du mobile:', error);
        setModalError('Erreur de communication avec le serveur lors du marquage comme rendu.');
      } finally {
        setIsConfirming(false);
      }
    };

    openConfirmModal(
      "Confirmer le Rendu du mobile",
      (
        <>
          <p className="text-gray-700 mb-4">
            Êtes-vous sûr de vouloir marquer le mobile "{item.marque} {item.modele} ({item.imei})" comme "Rendu" ? Il sera enregistré comme tel et son statut sera mis à jour.
          </p>
          <label htmlFor="returnReason" className="block text-sm font-medium text-gray-700 mb-2">
            Veuillez saisir le motif du rendu :
          </label>
          <textarea
            ref={textareaRef}
            id="returnReason"
            value={returnReasonInput}
            onChange={(e) => {
              setReturnReasonInput(e.target.value);
            }}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition duration-200"
            style={{ color: 'black !important', backgroundColor: 'white !important' }}
            placeholder="Ex: Changement d'avis du client, erreur de modèle..."
            required
            autoFocus
          ></textarea>
          {modalError && (
            <p className="text-red-500 text-sm mt-2">{modalError}</p>
          )}
        </>
      ),
      executeRenduAction
    );
  };


  useEffect(() => {
    if (showConfirmModal && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.value = returnReasonInput;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showConfirmModal, returnReasonInput]);

  const handlePrint = () => {
    window.print();
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
          th, td { border: 1px solid #ddd; padding: 8px; font-size: 9pt; white-space: normal; }
          body { font-size: 10pt; }
          .print-header { display: block !important; text-align: center; margin-bottom: 20px; font-size: 18pt; font-weight: bold; color: #333; }
        }
        `}
      </style>

      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center flex items-center justify-center print-header">
        <ShoppingCartIcon className="h-6 w-6 text-gray-600 mr-2 print-hidden" />
        Historique des Sorties
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
            placeholder="Rechercher par client, IMEI, marque ou modèle"
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
        <p className="text-gray-500 text-center text-sm">Chargement des ventes...</p>
      ) : filteredVentes.length === 0 ? (
        <p className="text-gray-500 text-center text-sm">Aucune vente trouvée correspondant à votre recherche.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1500px] table-container"> {/* Augmenté la largeur minimale */}
            <table className="table-auto w-full text-xs divide-y divide-gray-200">
              <thead className="bg-gray-100 text-gray-700 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium w-[4%]">ID Vente</th>
                  <th className="px-3 py-2 font-medium w-[9%]">Date Vente</th>
                  <th className="px-3 py-2 font-medium w-[9%]">Client</th>
                  <th className="px-3 py-2 font-medium w-[8%]">Marque</th> {/* Séparé */}
                  <th className="px-3 py-2 font-medium w-[8%]">Modèle</th> {/* Séparé */}
                  <th className="px-3 py-2 font-medium w-[6%]">Type</th> {/* Séparé */}
                  <th className="px-3 py-2 font-medium w-[6%]">Type Carton</th> {/* Séparé */}
                  <th className="px-3 py-2 font-medium w-[6%]">Stockage</th> {/* Séparé */}
                  <th className="px-3 py-2 font-medium w-[7%]">IMEI</th>
                  <th className="px-3 py-2 font-medium text-right w-[4%]">Qté</th>
                  <th className="px-3 py-2 font-medium text-right w-[7%]">Prix Unit.</th>
                  <th className="px-3 py-2 font-medium text-right w-[7%]">Total Vente</th>
                  <th className="px-3 py-2 font-medium text-right w-[7%]">Montant Payé</th>
                  <th className="px-3 py-2 font-medium text-right w-[7%]">Reste à Payer</th>
                  <th className="px-3 py-2 font-medium text-center w-[7%]">Statut Article</th>
                  <th className="px-3 py-2 text-right no-print w-[8%]">Actions</th> {/* Aligné à droite */}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVentes.map((data) => {
                  // Calculer si plus de 24 heures se sont écoulées depuis la date de vente
                  const saleDate = new Date(data.date_vente);
                  const now = new Date();
                  const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
                  const isOlderThan24Hours = (now.getTime() - saleDate.getTime()) > twentyFourHoursInMs;

                  return (
                    <tr key={`${data.vente_id}-${data.item_id}`} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-900 font-medium">
                        <div className="max-w-[60px] truncate" title={data.vente_id}>{data.vente_id}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {new Date(data.date_vente).toLocaleDateString('fr-FR', {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        <div className="max-w-[100px] truncate" title={data.client_nom}>{data.client_nom}</div>
                      </td>
                      {/* Colonnes Article Séparées */}
                      <td className="px-3 py-2 text-gray-700">
                        <div className="max-w-[80px] truncate" title={data.marque}>{data.marque}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        <div className="max-w-[80px] truncate" title={data.modele}>{data.modele}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        <div className="max-w-[60px] truncate" title={data.type || '—'}>{data.type || '—'}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        <div className="max-w-[60px] truncate" title={data.type_carton || '—'}>{data.type_carton || '—'}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        <div className="max-w-[60px] truncate" title={data.stockage || '—'}>{data.stockage || '—'}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        <div className="max-w-[80px] truncate" title={data.imei}>{data.imei}</div>
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">{data.quantite_vendue}</td>
                      {/* Appliquer formatCFA aux colonnes monétaires */}
                      <td className="px-3 py-2 text-right text-gray-700">{formatCFA(data.prix_unitaire_vente)}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">{formatCFA(data.montant_total_vente)}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">{formatCFA(data.montant_paye_vente)}</td>
                      <td className="px-3 py-2 text-right font-medium text-red-600">{formatCFA(data.reste_a_payer_vente)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap
                          ${data.statut_vente === 'annule' ? 'bg-orange-100 text-orange-800' : ''}
                          ${data.statut_vente === 'retourne' ? 'bg-purple-100 text-purple-800' : ''}
                          ${data.statut_vente === 'remplace' ? 'bg-indigo-100 text-indigo-800' : ''}
                          ${data.statut_vente === 'rendu' ? 'bg-cyan-100 text-cyan-800' : ''}
                          ${data.statut_vente === 'actif' && data.reste_a_payer_vente === 0 ? 'bg-green-100 text-green-800' : ''}
                          ${data.statut_vente === 'actif' && data.reste_a_payer_vente > 0 ? 'bg-blue-100 text-blue-800' : ''}
                        `}>
                          {data.statut_vente === 'annule'
                            ? 'ANNULÉ'
                            : data.statut_vente === 'retourne'
                              ? 'RETOURNÉ'
                              : data.statut_vente === 'remplace'
                                ? 'REMPLACÉ'
                                : data.statut_vente === 'rendu'
                                  ? 'RENDU'
                                  : data.reste_a_payer_vente === 0
                                    ? 'VENDU'
                                    : 'EN COURS'
                          }
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right space-x-1 no-print"> {/* Aligné à droite */}
                        {/* Bouton Modifier Paiement (visible si la vente n'est pas intégralement payée ou annulée ET si ce n'est PAS un article de facture spéciale) */}
                        {!data.is_special_sale_item && data.statut_paiement_vente !== 'payee_integralement' && data.statut_paiement_vente !== 'annulee' && data.statut_vente === 'actif' && (
                          <button
                            onClick={() => handleUpdatePaymentClick(data.vente_id, data.montant_paye_vente, data.montant_total_vente, data.total_prix_achat_de_la_vente)}
                            className="p-1 rounded-full text-blue-600 hover:bg-blue-100 transition"
                            title="Modifier paiement de la vente"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                        {/* Bouton Annuler Article (visible si l'article est actif, si ce n'est PAS un article de facture spéciale ET si MOINS de 24h se sont écoulées) */}
                        {!data.is_special_sale_item && data.statut_vente === 'actif' && !isOlderThan24Hours && (
                          <button
                            onClick={() => handleCancelItemClick(data)}
                            className="p-1 rounded-full text-red-600 hover:bg-red-100 transition"
                            title="Annuler cet article et remettre en stock"
                          >
                            <ArrowUturnLeftIcon className="h-4 w-4" />
                          </button>
                        )}
                        {/* Bouton Retour Défectueux (visible seulement si l'article est actif) */}
                        {data.statut_vente === 'actif' && (
                          <button
                            onClick={() => handleReturnItemClick(data)}
                            className="p-1 rounded-full text-purple-600 hover:bg-purple-100 transition"
                            title="Retourner ce mobile (défectueux)"
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                          </button>
                        )}
                        {/* Nouveau Bouton : Marquer comme Rendu (visible seulement si l'article est actif ET si PLUS de 24h se sont écoulées) */}
                        {data.statut_vente === 'actif' && isOlderThan24Hours && (
                          <button
                            onClick={() => handleMarkAsRenduClick(data)}
                            className="p-1 rounded-full text-cyan-600 hover:bg-cyan-100 transition"
                            title="Marquer comme Rendu"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modale de modification de paiement */}
      {showPaymentModal && currentSaleToEdit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 no-print">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Modifier le Paiement de la Vente #{currentSaleToEdit.id}</h3>
            <p className="text-gray-700 text-base mb-3">Montant Total Initial: <span className="font-semibold">{formatCFA(currentSaleToEdit.montant_total)}</span></p>
            <p className="text-gray-700 text-base mb-4">Montant Actuellement Payé: <span className="font-semibold">{formatCFA(currentSaleToEdit.montant_paye)}</span></p>

            <label htmlFor="newTotalAmountNegotiated" className="block text-base font-semibold text-gray-700 mb-2">
              Nouveau Montant Total Négocié (CFA):
            </label>
            <input
              type="number"
              id="newTotalAmountNegotiated"
              name="newTotalAmountNegotiated"
              value={newTotalAmountNegotiated}
              onChange={(e) => setNewTotalAmountNegotiated(e.target.value)}
              min={0}
              step="1"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 shadow-sm mb-4"
            />

            <label htmlFor="newMontantPaye" className="block text-base font-semibold text-gray-700 mb-2">
              Nouveau Montant Payé Total (CFA):
            </label>
            <input
              type="number"
              id="newMontantPaye"
              name="newMontantPaye"
              value={newMontantPaye}
              onChange={(e) => setNewMontantPaye(e.target.value)}
              min={0}
              step="1"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 shadow-sm"
            />
            <div className="flex justify-center space-x-4 mt-8">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setNewTotalAmountNegotiated('');
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition duration-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmUpdatePayment}
                className="px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition duration-200 font-medium shadow-md"
              >
                Confirmer la Mise à Jour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation personnalisée (pour suppression/annulation/retour) */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 no-print">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full relative z-[60] pointer-events-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{confirmModalContent.title}</h3>
            {typeof confirmModalContent.message === 'string' ? (
              <p className="text-gray-700 mb-6">{confirmModalContent.message}</p>
            ) : (
              <div className="text-gray-700 mb-6">{confirmModalContent.message}</div>
            )}
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
                disabled={isConfirming}
              >
                Annuler
              </button>
              <button
                onClick={() => onConfirmAction(returnReasonInput)}
                className={`px-4 py-2 rounded-md transition ${
                  isConfirming || (confirmModalContent.message && typeof confirmModalContent.message !== 'string' && !returnReasonInput.trim()) // Désactiver si le champ de raison est vide
                    ? 'bg-red-400 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
                disabled={isConfirming || (confirmModalContent.message && typeof confirmModalContent.message !== 'string' && !returnReasonInput.trim())} // Désactiver si le champ de raison est vide
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
