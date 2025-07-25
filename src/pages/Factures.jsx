import React, { useState, useEffect, useRef } from 'react';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PrinterIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUturnLeftIcon, // Pour annuler la facture entière
  ArrowDownTrayIcon, // Pour retourner un article (avec remboursement)
  ExclamationTriangleIcon, // Pour le statut "défectueux"
  NoSymbolIcon // Pour annuler un article sans remboursement
} from '@heroicons/react/24/outline';

export default function Factures() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvoiceDetailModal, setShowInvoiceDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newMontantPaye, setNewMontantPaye] = useState('');
  const [newTotalAmount, setNewTotalAmount] = useState(''); // Pour la négociation
  const [paymentModalError, setPaymentModalError] = useState('');

  // États pour la modale de confirmation générique (Annulation Facture / Annulation Article / Défectueux)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalContent, setConfirmModalContent] = useState({ title: "", message: null });
  const [onConfirmAction, setOnConfirmAction] = useState(null);
  const [reasonInput, setReasonInput] = useState(''); // Pour la raison d'annulation/retour/défectuosité
  const [confirmModalError, setConfirmModalError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const textareaRef = useRef(null); // Référence pour le champ de texte de la raison

  // États pour la modale de retour d'article (avec remboursement)
  const [showReturnItemModal, setShowReturnItemModal] = useState(false);
  const [itemToReturn, setItemToReturn] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [montantRembourseItem, setMontantRembourseItem] = useState('');
  const [returnItemModalError, setReturnItemModalError] = useState('');
  const [isReturningItem, setIsReturningItem] = useState(false);

  // Définition de l'URL de l'API pour l'environnement Canvas
  const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;

  // Fonction utilitaire pour formater les montants en CFA
  const formatCFA = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'N/A CFA';
    }
    return parseFloat(amount).toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Fonction utilitaire pour formater les dates pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return date.toLocaleDateString('fr-FR', options);
    } catch (e) {
      console.error("Erreur de formatage de date:", e, "Chaîne originale:", dateString);
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'creee': return 'bg-blue-100 text-blue-800';
      case 'paiement_partiel': return 'bg-orange-100 text-orange-800';
      case 'payee_integralement': return 'bg-green-100 text-green-800';
      case 'annulee': return 'bg-red-100 text-red-800';
      case 'retour_partiel': return 'bg-purple-100 text-purple-800';
      case 'retour_total': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getItemStatusColor = (status) => {
    switch (status) {
      case 'actif': return 'bg-green-100 text-green-800';
      case 'annule': return 'bg-red-100 text-red-800'; // Annulé sans remboursement
      case 'retourne': return 'bg-purple-100 text-purple-800'; // Retourné avec remboursement
      case 'defective_returned': return 'bg-orange-100 text-orange-800'; // Défectueux retourné au stock sans remboursement
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  const fetchFactures = async () => {
    setLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const response = await fetch(`${API_BASE_URL}/api/factures`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de la récupération des factures.');
      }
      const data = await response.json();
      setFactures(data);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
      setStatusMessage({ type: 'error', text: `Erreur lors du chargement des factures: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactures();
  }, []);

  const fetchInvoiceDetails = async (invoiceId) => {
    setLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const response = await fetch(`${API_BASE_URL}/api/factures/${invoiceId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de la récupération des détails de la facture.');
      }
      const data = await response.json();
      setSelectedInvoice(data);
      setShowInvoiceDetailModal(true);
    } catch (error) {
      console.error('Erreur lors du chargement des détails de la facture:', error);
      setStatusMessage({ type: 'error', text: `Erreur lors du chargement des détails: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredFactures = factures.filter(facture => {
    const searchLower = searchTerm.toLowerCase();
    const numeroFactureMatch = facture.numero_facture.toLowerCase().includes(searchLower);
    const clientNomMatch = facture.client_nom.toLowerCase().includes(searchLower);
    const clientTelMatch = facture.client_telephone ? facture.client_telephone.toLowerCase().includes(searchLower) : false;
    const statutMatch = facture.statut_facture.toLowerCase().includes(searchLower);

    return numeroFactureMatch || clientNomMatch || clientTelMatch || statutMatch;
  });

  // --- Fonctions pour la modale de confirmation générique ---
  // Utilisée pour l'annulation de facture, l'annulation d'article sans remboursement, et le marquage défectueux
  const openConfirmModal = (title, message, action) => {
    setConfirmModalContent({ title, message });
    setOnConfirmAction(() => (currentReason) => action(currentReason));
    setConfirmModalError('');
    setReasonInput('');
    setIsConfirming(false);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmModalContent({ title: "", message: null });
    setOnConfirmAction(null);
    setReasonInput('');
    setConfirmModalError('');
    setIsConfirming(false);
  };

  // Focus sur le textarea de la modale de confirmation
  useEffect(() => {
    if (showConfirmModal && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showConfirmModal, reasonInput]);

  // --- Actions de facture ---
  const handleCancelInvoice = (invoiceId) => {
    openConfirmModal(
      "Confirmer l'annulation de la facture",
      (
        <>
          <p className="text-gray-700 mb-2 text-sm md:text-base">
            Êtes-vous sûr de vouloir annuler cette facture ? Cette action est irréversible et annulera tous les articles de vente associés.
          </p>
          <label htmlFor="reasonInput" className="block text-xs font-medium text-gray-700 mb-1 md:text-sm">
            Raison de l'annulation :
          </label>
          <textarea
            ref={textareaRef}
            id="reasonInput"
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200"
            placeholder="Ex: Erreur de saisie, client a changé d'avis..."
            required
            autoFocus
          ></textarea>
          {confirmModalError && (
            <p className="text-red-500 text-xs mt-1">{confirmModalError}</p>
          )}
        </>
      ),
      async (reason) => {
        setIsConfirming(true);
        try {
          const res = await fetch(`${API_BASE_URL}/api/factures/${invoiceId}/cancel`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ raison_annulation: reason }),
          });
          const data = await res.json();
          if (res.ok) {
            setStatusMessage({ type: 'success', text: data.message });
            fetchFactures();
            closeConfirmModal();
          } else {
            setConfirmModalError(data.error || 'Erreur lors de l\'annulation de la facture.');
          }
        } catch (error) {
          console.error('Erreur lors de l\'annulation de la facture:', error);
          setConfirmModalError('Erreur de communication avec le serveur.');
        } finally {
          setIsConfirming(false);
        }
      }
    );
  };

  // --- Fonctions pour la modale de paiement ---
  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setNewMontantPaye(invoice.montant_paye_facture);
    setNewTotalAmount(invoice.montant_original_facture); // Initialiser avec le montant original
    setPaymentModalError('');
    setShowPaymentModal(true);
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    setPaymentModalError('');
    setStatusMessage({ type: '', text: '' });

    if (!selectedInvoice) return;

    const invoiceId = selectedInvoice.facture_id;
    const parsedNewMontantPaye = parseFloat(newMontantPaye);
    const parsedNewTotalAmount = parseFloat(newTotalAmount);

    if (isNaN(parsedNewMontantPaye) || parsedNewMontantPaye < 0) {
      setPaymentModalError('Le montant payé doit être un nombre positif ou zéro.');
      return;
    }
    if (isNaN(parsedNewTotalAmount) || parsedNewTotalAmount < 0) {
      setPaymentModalError('Le nouveau montant total doit être un nombre positif ou zéro.');
      return;
    }
    if (parsedNewMontantPaye > parsedNewTotalAmount) {
      setPaymentModalError('Le montant payé ne peut pas dépasser le nouveau montant total.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/factures/${invoiceId}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montant_paye_facture: parsedNewMontantPaye,
          new_total_amount: parsedNewTotalAmount
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ type: 'success', text: data.message });
        fetchFactures();
        setShowPaymentModal(false);
        setShowInvoiceDetailModal(false); // Fermer aussi la modale de détail si ouverte
      } else {
        setPaymentModalError(data.error || 'Erreur lors de la mise à jour du paiement.');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paiement:', error);
      setPaymentModalError('Erreur de communication avec le serveur.');
    }
  };

  // --- Fonctions pour la modale de retour d'article (avec remboursement) ---
  const openReturnItemModal = (item, invoice) => {
    setItemToReturn(item);
    setSelectedInvoice(invoice); // Assurez-vous que la facture est sélectionnée
    setReturnReason('');
    setMontantRembourseItem(item.prix_unitaire_vente); // Pré-remplir avec le prix de vente
    setReturnItemModalError('');
    setIsReturningItem(false);
    setShowReturnItemModal(true);
  };

  const handleReturnItem = async (e) => {
    e.preventDefault();
    setReturnItemModalError('');
    setStatusMessage({ type: '', text: '' });
    setIsReturningItem(true);

    if (!itemToReturn || !selectedInvoice) return;

    const parsedMontantRembourse = parseFloat(montantRembourseItem);
    if (!returnReason.trim()) {
      setReturnItemModalError('La raison du retour est requise.');
      setIsReturningItem(false);
      return;
    }
    if (isNaN(parsedMontantRembourse) || parsedMontantRembourse < 0) {
      setReturnItemModalError('Le montant remboursé doit être un nombre positif ou zéro.');
      setIsReturningItem(false);
      return;
    }
    if (parsedMontantRembourse > itemToReturn.prix_unitaire_vente) {
      setReturnItemModalError('Le montant remboursé ne peut pas être supérieur au prix de vente de l\'article.');
      setIsReturningItem(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/factures/${selectedInvoice.facture_id}/return-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vente_item_id: itemToReturn.item_id,
          reason: returnReason,
          montant_rembourse_item: parsedMontantRembourse,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ type: 'success', text: data.message });
        fetchFactures(); // Rafraîchir la liste principale des factures
        fetchInvoiceDetails(selectedInvoice.facture_id); // Rafraîchir les détails de la facture ouverte
        setShowReturnItemModal(false);
      } else {
        setReturnItemModalError(data.error || 'Erreur lors du traitement du retour de l\'article.');
      }
    } catch (error) {
      console.error('Erreur lors du retour de l\'article:', error);
      setReturnItemModalError('Erreur de communication avec le serveur.');
    } finally {
      setIsReturningItem(false);
    }
  };

  // --- NOUVELLE FONCTION : Marquer comme Défectueux (sans impact financier sur la facture) ---
  const handleMarkDefective = (item, invoice) => {
    openConfirmModal(
      "Marquer l'article comme Défectueux",
      (
        <>
          <p className="text-gray-700 mb-2 text-sm md:text-base">
            Êtes-vous sûr de vouloir marquer l'article "{item.marque} {item.modele} ({item.imei})" comme défectueux ?
            Cela le remettra en stock sans affecter le montant de la facture.
          </p>
          <label htmlFor="reasonInput" className="block text-xs font-medium text-gray-700 mb-1 md:text-sm">
            Raison de la défectuosité :
          </label>
          <textarea
            ref={textareaRef}
            id="reasonInput"
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200"
            placeholder="Ex: Écran cassé, problème batterie..."
            required
            autoFocus
          ></textarea>
          {confirmModalError && (
            <p className="text-red-500 text-xs mt-1">{confirmModalError}</p>
          )}
        </>
      ),
      async (reason) => {
        setIsConfirming(true);
        try {
          const res = await fetch(`${API_BASE_URL}/api/factures/${invoice.facture_id}/items/${item.item_id}/mark-as-defective`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: reason }),
          });
          const data = await res.json();
          if (res.ok) {
            setStatusMessage({ type: 'success', text: data.message });
            fetchFactures();
            fetchInvoiceDetails(invoice.facture_id);
            closeConfirmModal();
          } else {
            setConfirmModalError(data.error || 'Erreur lors du marquage de l\'article comme défectueux.');
          }
        } catch (error) {
          console.error('Erreur lors du marquage de l\'article comme défectueux:', error);
          setConfirmModalError('Erreur de communication avec le serveur.');
        } finally {
          setIsConfirming(false);
        }
      }
    );
  };

  // --- NOUVELLE FONCTION : Annuler Article (sans remboursement) ---
  const handleCancelItemNoRefund = (item, invoice) => {
    openConfirmModal(
      "Annuler l'article (sans remboursement)",
      (
        <>
          <p className="text-gray-700 mb-2 text-sm md:text-base">
            Êtes-vous sûr de vouloir annuler l'article "{item.marque} {item.modele} ({item.imei})" ?
            Cela le remettra en stock. Le montant de la facture ne sera PAS affecté.
          </p>
          <label htmlFor="reasonInput" className="block text-xs font-medium text-gray-700 mb-1 md:text-sm">
            Raison de l'annulation :
          </label>
          <textarea
            ref={textareaRef}
            id="reasonInput"
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200"
            placeholder="Ex: Client a changé d'avis, erreur de commande..."
            required
            autoFocus
          ></textarea>
          {confirmModalError && (
            <p className="text-red-500 text-xs mt-1">{confirmModalError}</p>
          )}
        </>
      ),
      async (reason) => {
        setIsConfirming(true);
        try {
          const res = await fetch(`${API_BASE_URL}/api/factures/${invoice.facture_id}/items/${item.item_id}/cancel-item-no-refund`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: reason }),
          });
          const data = await res.json();
          if (res.ok) {
            setStatusMessage({ type: 'success', text: data.message });
            fetchFactures();
            fetchInvoiceDetails(invoice.facture_id);
            closeConfirmModal();
          } else {
            setConfirmModalError(data.error || 'Erreur lors de l\'annulation de l\'article.');
          }
        } catch (error) {
          console.error('Erreur lors de l\'annulation de l\'article:', error);
          setConfirmModalError('Erreur de communication avec le serveur.');
        } finally {
          setIsConfirming(false);
        }
      }
    );
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
        <DocumentTextIcon className="h-6 w-6 text-gray-600 mr-2 print-hidden" />
        Gestion des Factures
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
            placeholder="Rechercher par numéro de facture, client, téléphone ou statut"
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
        <p className="text-gray-500 text-center text-sm">Chargement des factures...</p>
      ) : filteredFactures.length === 0 ? (
        <p className="text-gray-500 text-center text-sm">Aucune facture trouvée correspondant à votre recherche.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            <table className="table-auto w-full text-xs divide-y divide-gray-200">
              <thead className="bg-gray-100 text-gray-700 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Numéro Facture</th>
                  <th className="px-3 py-2 font-medium">Date Facture</th>
                  <th className="px-3 py-2 font-medium">Client</th>
                  <th className="px-3 py-2 font-medium">Téléphone</th>
                  <th className="px-3 py-2 font-medium text-right">Montant Original</th>
                  <th className="px-3 py-2 font-medium text-right">Montant Payé</th>
                  <th className="px-3 py-2 font-medium text-right">Montant Dû</th>
                  <th className="px-3 py-2 font-medium text-right">Montant Remboursé</th>
                  <th className="px-3 py-2 font-medium text-center">Statut</th>
                  <th className="px-3 py-2 font-medium text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFactures.map((facture) => (
                  <tr key={facture.facture_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900 font-medium">{facture.numero_facture}</td>
                    <td className="px-3 py-2 text-gray-700">{formatDate(facture.date_facture)}</td>
                    <td className="px-3 py-2 text-gray-700">{facture.client_nom}</td>
                    <td className="px-3 py-2 text-gray-700">{facture.client_telephone}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatCFA(facture.montant_original_facture)}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatCFA(facture.montant_paye_facture)}</td>
                    <td className="px-3 py-2 text-right text-red-600 font-semibold">{formatCFA(facture.montant_actuel_du)}</td>
                    <td className="px-3 py-2 text-right text-purple-600 font-semibold">{formatCFA(facture.montant_rembourse)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${getStatusColor(facture.statut_facture)}`}>
                        {facture.statut_facture.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center space-x-1 no-print">
                      <button
                        onClick={() => fetchInvoiceDetails(facture.facture_id)}
                        className="p-1 rounded-full text-blue-600 hover:bg-blue-100 transition"
                        title="Voir les détails"
                      >
                        <MagnifyingGlassIcon className="h-4 w-4" />
                      </button>
                      {(facture.statut_facture !== 'annulee' && facture.statut_facture !== 'retour_total') && (
                        <>
                          <button
                            onClick={() => openPaymentModal(facture)}
                            className="p-1 rounded-full text-yellow-600 hover:bg-yellow-100 transition"
                            title="Modifier paiement / Négocier"
                          >
                            <CurrencyDollarIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCancelInvoice(facture.facture_id)}
                            className="p-1 rounded-full text-red-600 hover:bg-red-100 transition"
                            title="Annuler la facture entière"
                          >
                            <ArrowUturnLeftIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modale de détail de la facture */}
      {showInvoiceDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 no-print">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-xl font-bold text-gray-800">Détails de la Facture #{selectedInvoice.numero_facture}</h3>
              <button onClick={() => setShowInvoiceDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <p><strong>Client:</strong> {selectedInvoice.client_nom} ({selectedInvoice.client_telephone})</p>
                <p><strong>Date de Vente:</strong> {formatDate(selectedInvoice.date_vente)}</p>
                <p><strong>Statut de la Facture:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(selectedInvoice.statut_facture)}`}>
                  {selectedInvoice.statut_facture.replace(/_/g, ' ')}
                </span></p>
              </div>
              <div>
                <p><strong>Montant Original:</strong> {formatCFA(selectedInvoice.montant_original_facture)}</p>
                <p><strong>Montant Payé:</strong> {formatCFA(selectedInvoice.montant_paye_facture)}</p>
                <p><strong>Montant Dû:</strong> <span className="text-red-600 font-semibold">{formatCFA(selectedInvoice.montant_actuel_du)}</span></p>
                <p><strong>Montant Remboursé:</strong> <span className="text-purple-600 font-semibold">{formatCFA(selectedInvoice.montant_rembourse)}</span></p>
              </div>
              {selectedInvoice.observation && <p className="col-span-full"><strong>Observation:</strong> {selectedInvoice.observation}</p>}
              {selectedInvoice.raison_annulation && <p className="col-span-full text-red-600"><strong>Raison Annulation:</strong> {selectedInvoice.raison_annulation}</p>}
            </div>

            <h4 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Articles Vendus:</h4>
            {selectedInvoice.articles_vendus && selectedInvoice.articles_vendus.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50 text-gray-700 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Article</th>
                      <th className="px-3 py-2 font-medium">IMEI</th>
                      <th className="px-3 py-2 font-medium text-right">Prix Vente</th>
                      <th className="px-3 py-2 font-medium text-right">Prix Achat</th>
                      <th className="px-3 py-2 font-medium text-center">Statut Article</th>
                      <th className="px-3 py-2 font-medium text-right">Remboursé Article</th>
                      <th className="px-3 py-2 font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedInvoice.articles_vendus.map(item => (
                      <tr key={item.item_id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-900">
                          {item.marque} {item.modele} ({item.stockage || 'N/A'}) {item.type_carton ? `(${item.type_carton})` : ''}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{item.imei}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{formatCFA(item.prix_unitaire_vente)}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{formatCFA(item.prix_unitaire_achat)}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${getItemStatusColor(item.statut_vente)}`}>
                            {item.statut_vente.replace(/_/g, ' ')}
                          </span>
                          {item.cancellation_reason && <p className="text-[8px] text-gray-500 mt-0.5">({item.cancellation_reason})</p>}
                        </td>
                        <td className="px-3 py-2 text-right text-purple-600 font-semibold">
                          {formatCFA(item.montant_rembourse_item || 0)}
                        </td>
                        <td className="px-3 py-2 text-center space-x-1">
                          {/* Boutons d'action par article (visibles si la facture n'est pas annulée/retournée totalement et l'article est actif) */}
                          {(selectedInvoice.statut_facture !== 'annulee' && selectedInvoice.statut_facture !== 'retour_total' && item.statut_vente === 'actif') && (
                            <>
                              {/* Annuler Article (Sans Remboursement) */}
                              <button
                                onClick={() => handleCancelItemNoRefund(item, selectedInvoice)}
                                className="p-1 rounded-full text-red-600 hover:bg-red-100 transition"
                                title="Annuler cet article (sans remboursement)"
                              >
                                <NoSymbolIcon className="h-4 w-4" />
                              </button>
                              {/* Marquer comme Défectueux (retour stock sans impact facture) */}
                              <button
                                onClick={() => handleMarkDefective(item, selectedInvoice)}
                                className="p-1 rounded-full text-orange-600 hover:bg-orange-100 transition"
                                title="Marquer comme Défectueux (retour stock sans impact facture)"
                              >
                                <ExclamationTriangleIcon className="h-4 w-4" />
                              </button>
                              {/* Retourner Article (avec remboursement) */}
                              <button
                                onClick={() => openReturnItemModal(item, selectedInvoice)}
                                className="p-1 rounded-full text-purple-600 hover:bg-purple-100 transition"
                                title="Retourner cet article (avec remboursement)"
                              >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 text-center">Aucun article vendu pour cette facture.</p>
            )}
          </div>
        </div>
      )}

      {/* Modale de modification de paiement */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 no-print">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Modifier Paiement / Négocier</h3>
            <form onSubmit={handleUpdatePayment}>
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  Facture #{selectedInvoice.numero_facture} - Client: {selectedInvoice.client_nom}
                </p>
                <label htmlFor="newTotalAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau Montant Total de la Facture (CFA)
                </label>
                <input
                  type="number"
                  id="newTotalAmount"
                  value={newTotalAmount}
                  onChange={(e) => setNewTotalAmount(e.target.value)}
                  required
                  min="0"
                  step="1"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="newMontantPaye" className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau Montant Payé (CFA)
                </label>
                <input
                  type="number"
                  id="newMontantPaye"
                  value={newMontantPaye}
                  onChange={(e) => setNewMontantPaye(e.target.value)}
                  required
                  min="0"
                  step="1"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {paymentModalError && (
                <p className="text-red-600 text-sm mb-4">{paymentModalError}</p>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale de confirmation générique (Annulation de facture, Annulation article, Défectueux) */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 no-print">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full relative z-[60] pointer-events-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{confirmModalContent.title}</h3>
            {typeof confirmModalContent.message === 'string' ? (
              <p className="text-gray-700 mb-6">{confirmModalContent.message}</p>
            ) : (
              <div className="text-gray-700 mb-6">{confirmModalContent.message}</div>
            )}
            {confirmModalError && (
              <p className="text-red-500 text-xs mt-1">{confirmModalError}</p>
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
                onClick={() => onConfirmAction(reasonInput)}
                className={`px-4 py-2 rounded-md transition ${
                  isConfirming || !reasonInput.trim() // Désactiver si le champ de raison est vide
                    ? 'bg-red-400 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
                disabled={isConfirming || !reasonInput.trim()} // Désactiver si le champ de raison est vide
              >
                {isConfirming ? 'Confirmation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de retour d'article (avec remboursement) */}
      {showReturnItemModal && itemToReturn && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 no-print">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Retourner Article (Avec Remboursement)</h3>
            <form onSubmit={handleReturnItem}>
              <p className="text-sm text-gray-700 mb-3">
                Article: <span className="font-semibold">{itemToReturn.marque} {itemToReturn.modele} ({itemToReturn.imei})</span>
              </p>
              <p className="text-sm text-gray-700 mb-3">
                Prix de vente unitaire: <span className="font-semibold">{formatCFA(itemToReturn.prix_unitaire_vente)}</span>
              </p>
              <div className="mb-3">
                <label htmlFor="returnReason" className="block text-sm font-medium text-gray-700 mb-1">Raison du retour *</label>
                <textarea
                  id="returnReason"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  rows="3"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                ></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="montantRembourseItem" className="block text-sm font-medium text-gray-700 mb-1">Montant à rembourser (CFA) *</label>
                <input
                  type="number"
                  id="montantRembourseItem"
                  value={montantRembourseItem}
                  onChange={(e) => setMontantRembourseItem(e.target.value)}
                  required
                  min="0"
                  step="1"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              {returnItemModalError && (
                <p className="text-red-600 text-sm mb-4">{returnItemModalError}</p>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReturnItemModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                  disabled={isReturningItem}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-md transition ${
                    isReturningItem ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                  disabled={isReturningItem}
                >
                  {isReturningItem ? 'Traitement...' : 'Confirmer Retour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
