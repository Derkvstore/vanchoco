import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DocumentTextIcon, MagnifyingGlassIcon, PlusIcon, PrinterIcon,
  XMarkIcon, CheckCircleIcon, XCircleIcon, CurrencyDollarIcon, ArrowUturnLeftIcon,
  TrashIcon, PlusCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

export default function Factures() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // États pour la création de facture
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [newInvoiceClientName, setNewInvoiceClientName] = useState('');
  const [newInvoiceClientPhone, setNewInvoiceClientPhone] = useState('');
  const [invoiceRows, setInvoiceRows] = useState([]);
  const [createInvoiceError, setCreateInvoiceError] = useState('');
  const [newInvoicePayment, setNewInvoicePayment] = useState(0);
  const [allAvailableProducts, setAllAvailableProducts] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [negotiatedPrice, setNegotiatedPrice] = useState(''); // État pour le prix négocié lors de la création

  // États pour les actions sur facture existante
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [currentFacture, setCurrentFacture] = useState(null);
  const [currentFactureDetails, setCurrentFactureDetails] = useState(null); // Utilisé pour charger les articles de la facture dans la modale de retour
  const [paymentAmount, setPaymentAmount] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnAmount, setReturnAmount] = useState('');
  const [selectedReturnItem, setSelectedReturnItem] = useState(null);
  const [currentVenteItems, setCurrentVenteItems] = useState([]); // Articles actifs de la facture pour la modale de retour
  const [newPaymentTotal, setNewPaymentTotal] = useState(''); // NOUVEAU ÉTAT pour le montant total à négocier dans la modale de paiement

  // Définition de l'URL de l'API pour l'environnement Canvas
  // MODIFICATION ICI : Utilisation de VITE_APP_BACKEND_URL
  const API_URL = import.meta.env.VITE_APP_BACKEND_URL;

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined || isNaN(parseFloat(amount))) {
      return 'N/A';
    }
    // Formate le montant sans décimales et sans séparateur de milliers, puis ajoute ' CFA'
    return Math.round(parseFloat(amount)).toString() + ' CFA';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const fetchFactures = async () => {
    setLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const response = await axios.get(`${API_URL}/api/factures`);
      console.log('Frontend: Données brutes des factures récupérées par /api/factures:', response.data);
      setFactures(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
      setStatusMessage({ type: 'error', text: `Erreur lors du chargement des factures: ${error.response?.data?.error || error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAvailableProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`);
      setAllAvailableProducts(response.data.filter(p => p.status === 'active'));
    } catch (error) {
      console.error('Erreur lors du chargement des produits disponibles:', error);
      setStatusMessage({ type: 'error', text: `Erreur lors du chargement des produits disponibles: ${error.response?.data?.error || error.message}` });
    }
  };

  const fetchAllClients = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/clients`);
      setAllClients(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    }
  };

  useEffect(() => {
    fetchFactures();
    fetchAllAvailableProducts();
    fetchAllClients();
  }, []);

  const handleAddRow = () => {
    setInvoiceRows(prevRows => [
      ...prevRows,
      {
        id: Date.now(),
        selectedProduct: null,
        productSearchTerm: '',
        imeiInput: '',
        imeiList: [],
        quantity: 0,
        unitPrice: '',
        purchasePrice: 0, // Stocke le prix d'achat
        totalPrice: 0,
        validationError: '',
        imeiRefs: {}
      }
    ]);
    setCreateInvoiceError('');
  };

  const handleRemoveRow = (idToRemove) => {
    setInvoiceRows(prevRows => prevRows.filter(row => row.id !== idToRemove));
    setCreateInvoiceError('');
  };

  const handleClientNameChange = (e) => {
    const name = e.target.value;
    setNewInvoiceClientName(name);
    const matchedClient = allClients.find(client => client.nom === name);
    if (matchedClient) {
      setNewInvoiceClientPhone(matchedClient.telephone || '');
    } else {
      setNewInvoiceClientPhone('');
    }
    setCreateInvoiceError('');
  };

  const handleProductInputChange = useCallback((e, rowId) => {
    const input = e.target.value;
    setInvoiceRows(prevRows => prevRows.map(row => {
      if (row.id === rowId) {
        return { ...row, productSearchTerm: input, validationError: '' };
      }
      return row;
    }));
  }, []);

  const handleProductSelect = useCallback((e, rowId) => {
    const value = e.target.value;
    const selectedProduct = allAvailableProducts.find(p =>
      `${p.marque} ${p.modele} ${p.stockage} ${p.type} ${p.type_carton || ''}`.trim().toLowerCase() === value.toLowerCase()
    );

    setInvoiceRows(prevRows => prevRows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          selectedProduct: selectedProduct || null,
          productSearchTerm: value,
          unitPrice: selectedProduct ? selectedProduct.prix_vente : '',
          purchasePrice: selectedProduct ? selectedProduct.prix_achat : 0, // Stocke le prix d'achat
          imeiInput: '',
          imeiList: [],
          quantity: 0,
          totalPrice: 0,
          validationError: selectedProduct ? '' : 'Produit non valide ou non trouvé.'
        };
      }
      return row;
    }));
    setCreateInvoiceError('');
  }, [allAvailableProducts]);


  const handleImeiInputChange = useCallback((e, rowId) => {
    const input = e.target.value;
    setInvoiceRows(prevRows => prevRows.map(row => {
      if (row.id === rowId) {
        return { ...row, imeiInput: input, validationError: '' };
      }
      return row;
    }));
  }, []);

  const validateImeiAndCalculateQuantity = useCallback(async (rowId) => {
    setInvoiceRows(prevRows => prevRows.map(row => {
        if (row.id === rowId) {
            return { ...row, validationError: 'Validation en cours...' };
        }
        return row;
    }));

    const rowToValidate = invoiceRows.find(row => row.id === rowId);
    if (!rowToValidate || !rowToValidate.selectedProduct) {
        setInvoiceRows(prevRows => prevRows.map(row => {
            if (row.id === rowId) {
                return { ...row, validationError: 'Veuillez sélectionner un produit d\'abord.', imeiList: [], quantity: 0, totalPrice: 0 };
            }
            return row;
        }));
        return;
    }

    const imeiStrings = rowToValidate.imeiInput.split(/[\n,]/).map(s => s.trim()).filter(s => s !== '');
    const validImeis = [];
    let currentError = '';

    for (const imei of imeiStrings) {
        if (!/^\d{6}$/.test(imei)) {
            currentError = `IMEI "${imei}" invalide (doit contenir 6 chiffres).`;
            break;
        }

        const isImeiUsedInOtherRow = invoiceRows.some(r =>
            r.id !== rowId && r.imeiList.includes(imei)
        );
        if (isImeiUsedInOtherRow) {
            currentError = `L'IMEI "${imei}" est déjà utilisé dans une autre ligne de cette facture.`;
            break;
        }

        const productFound = allAvailableProducts.find(p =>
            p.imei === imei &&
            p.marque === rowToValidate.selectedProduct.marque &&
            p.modele === rowToValidate.selectedProduct.modele &&
            p.stockage === rowToValidate.selectedProduct.stockage &&
            p.type === rowToValidate.selectedProduct.type &&
            (p.type_carton === rowToValidate.selectedProduct.type_carton || (!p.type_carton && !rowToValidate.selectedProduct.type_carton)) &&
            p.status === 'active'
        );

        if (!productFound) {
            currentError = `IMEI "${imei}" ne correspond pas au produit sélectionné ou n'est pas disponible en stock.`;
            break;
        }
        validImeis.push(imei);
    }

    setInvoiceRows(prevRows => prevRows.map(row => {
        if (row.id === rowId) {
            const newQuantity = validImeis.length;
            const newTotalPrice = newQuantity * parseFloat(row.unitPrice || 0);
            return {
                ...row,
                imeiList: validImeis,
                quantity: newQuantity,
                totalPrice: newTotalPrice,
                validationError: currentError
            };
        }
        return row;
    }));
    setCreateInvoiceError('');
  }, [invoiceRows, allAvailableProducts]);

  const handleUnitPriceChange = (e, rowId) => {
    const value = e.target.value;
    setInvoiceRows(prevRows => prevRows.map(row => {
      if (row.id === rowId) {
        // Round the value to an integer before setting it in state
        const newUnitPrice = Math.round(parseFloat(value) || 0);
        let validationError = '';

        // Validation: Prix de vente ne peut pas être inférieur au prix d'achat
        if (row.selectedProduct && newUnitPrice < row.purchasePrice) {
          validationError = `Le prix de vente (${formatAmount(newUnitPrice)}) ne peut pas être inférieur au prix d'achat (${formatAmount(row.purchasePrice)}).`;
        } else if (newUnitPrice <= 0 && row.quantity > 0) { // Si quantité > 0, le prix doit être > 0
          validationError = 'Le prix unitaire doit être positif.';
        }

        const newTotalPrice = row.quantity * newUnitPrice;
        // Set unitPrice as the rounded number
        return { ...row, unitPrice: newUnitPrice, totalPrice: newTotalPrice, validationError: validationError };
      }
      return row;
    }));
    setCreateInvoiceError('');
  };

  const calculateOverallTotals = () => {
    const calculatedTotal = invoiceRows.reduce((sum, row) => sum + row.totalPrice, 0);
    // Si un prix négocié est saisi, utilisez-le, sinon utilisez le total calculé
    const finalTotal = negotiatedPrice !== '' && !isNaN(parseFloat(negotiatedPrice))
                       ? parseFloat(negotiatedPrice)
                       : calculatedTotal;
    const paid = parseFloat(newInvoicePayment || 0);
    const balance = finalTotal - paid;
    return { total: finalTotal, paid, balance };
  };

  const { total, paid, balance } = calculateOverallTotals() || {};

  const handleConfirmCreateInvoice = async () => {
    console.log("--- Début de handleConfirmCreateInvoice ---");
    console.log("1. État initial du formulaire:", {
      newInvoiceClientName,
      newInvoiceClientPhone,
      invoiceRows,
      newInvoicePayment,
      negotiatedPrice
    });

    if (!newInvoiceClientName.trim()) {
      setCreateInvoiceError("Le nom du client est requis.");
      console.log("Validation échouée: Nom du client manquant.");
      return;
    }
    console.log("2. Validation nom client passée.");

    if (invoiceRows.length === 0) {
      setCreateInvoiceError("Veuillez ajouter au moins un produit à la facture.");
      console.log("Validation échouée: Aucune ligne de facture.");
      return;
    }
    console.log("3. Validation lignes de facture (non vide) passée.");

    let hasRowError = false;
    for (const row of invoiceRows) {
        console.log(`Validation de la ligne ${row.id}:`, row);
        if (!row.selectedProduct) {
            setCreateInvoiceError(`La ligne ${row.id} n'a pas de produit sélectionné.`);
            hasRowError = true;
            console.log(`Validation échouée pour la ligne ${row.id}: Aucun produit sélectionné.`);
            break;
        }
        if (row.imeiList.length === 0) {
            setCreateInvoiceError(`La ligne ${row.id} ne contient aucun IMEI valide.`);
            hasRowError = true;
            console.log(`Validation échouée pour la ligne ${row.id}: Aucun IMEI valide.`);
            break;
        }
        // La validation du prix unitaire est maintenant dans handleUnitPriceChange
        if (row.validationError) { // Vérifie s'il y a une erreur de validation sur la ligne (y compris prix < prix_achat)
            setCreateInvoiceError(`Erreur de validation sur la ligne ${row.id}: ${row.validationError}`);
            hasRowError = true;
            console.log(`Validation échouée pour la ligne ${row.id}: Erreur de validation: ${row.validationError}`);
            break;
        }
    }
    if (hasRowError) {
        console.log("4. Validation globale échouée: Erreur sur une ligne.");
        return;
    }
    console.log("4. Validation de toutes les lignes de facture passée.");


    const { total: finalTotal, paid: finalPaid } = calculateOverallTotals();
    console.log("5. Totaux calculés:", { finalTotal, finalPaid });

    if (isNaN(finalPaid) || finalPaid < 0) {
        setCreateInvoiceError("Le montant payé est invalide. Veuillez entrer un montant numérique positif.");
        console.log("Validation échouée: Montant payé invalide.");
        return;
    }
    console.log("6. Validation montant payé passée.");

    const itemsToSendForVente = [];
    for (const row of invoiceRows) {
        for (const imei of row.imeiList) {
            const product = allAvailableProducts.find(p => p.imei === imei);
            if (product) {
                itemsToSendForVente.push({
                    produit_id: product.id,
                    imei: imei,
                    marque: product.marque,
                    modele: product.modele,
                    stockage: product.stockage,
                    type: product.type,
                    type_carton: product.type_carton,
                    prix_unitaire_vente: parseFloat(row.unitPrice),
                    prix_unitaire_achat: product.prix_achat, // Assurez-vous que le prix d'achat est envoyé pour la validation backend
                    quantite_vendue: 1
                });
            }
        }
    }
    console.log("7. Items à envoyer au backend pour la vente:", itemsToSendForVente);

    setCreateInvoiceError(''); // Clear previous errors
    try {
      console.log("8. Tentative de création de la Vente...");
      const venteResponse = await axios.post(`${API_URL}/api/ventes`, {
        nom_client: newInvoiceClientName,
        client_telephone: newInvoiceClientPhone,
        items: itemsToSendForVente,
        montant_paye: finalPaid, // Montant payé pour la vente initiale
        is_facture_speciale: true, // Flag pour distinguer des ventes régulières
        montant_negocie: negotiatedPrice !== '' ? parseFloat(negotiatedPrice) : undefined
      });
      console.log("9. Réponse de la création de Vente:", venteResponse.data);

      const venteId = venteResponse.data.vente_id; // Supposons que le backend retourne l'ID de la nouvelle vente

      if (!venteId) {
        throw new Error("L'ID de la vente n'a pas été retourné par le backend après la création de la vente.");
      }
      console.log("10. Vente créée avec ID:", venteId);

      console.log("11. Tentative de création de la Facture...");
      const factureResponse = await axios.post(`${API_URL}/api/factures`, {
        vente_id: venteId, // Fourniture de l'ID de la vente
        nom_client: newInvoiceClientName,
        client_telephone: newInvoiceClientPhone,
        montant_paye_facture: finalPaid,
        montant_original_facture: finalTotal, // Utilise le montant total final (négocié ou calculé)
      });

      setStatusMessage({ type: 'success', text: factureResponse.data.message || 'Facture créée avec succès.' });
      fetchFactures(); // Re-fetch uniquement les factures
      resetCreateInvoiceForm();
      setShowCreateInvoiceModal(false);
      console.log("12. Facture créée avec succès. Formulaire réinitialisé et modale fermée.");
    } catch (error) {
      console.error('Erreur lors de la création de la facture (catch block):', error);
      setCreateInvoiceError(`Erreur: ${error.response?.data?.error || error.message}`);
      console.log("13. Création de facture échouée dans le bloc catch. Message d'erreur défini.");
    } finally {
      console.log("--- Fin de handleConfirmCreateInvoice ---");
    }
  };

  const resetCreateInvoiceForm = () => {
    setNewInvoiceClientName('');
    setNewInvoiceClientPhone('');
    setInvoiceRows([]);
    setNewInvoicePayment(0);
    setCreateInvoiceError('');
    setNegotiatedPrice(''); // Réinitialiser le prix négocié
  };

  const handleOpenPaymentModal = (facture) => {
    if (!facture || !facture.facture_id) {
      console.error("Impossible d'ouvrir la modale de paiement: Facture ou ID de facture manquant.", { facture });
      setStatusMessage({ type: 'error', text: 'Impossible de gérer le paiement: Facture invalide.' });
      return;
    }
    setCurrentFacture(facture);
    setPaymentAmount(facture.montant_paye_facture);
    setNewPaymentTotal(facture.montant_original_facture); // Initialise le montant total pour la négociation
    setShowPaymentModal(true);
  };

  const handleUpdatePayment = async () => {
    if (!currentFacture || !currentFacture.facture_id || isNaN(parseFloat(paymentAmount)) || isNaN(parseFloat(newPaymentTotal))) {
      setStatusMessage({ type: 'error', text: 'Montant de paiement ou montant total invalide ou facture non sélectionnée.' });
      return;
    }
    if (parseFloat(paymentAmount) > parseFloat(newPaymentTotal)) {
        setStatusMessage({ type: 'error', text: 'Le montant payé ne peut pas dépasser le nouveau montant total.' });
        return;
    }

    try {
      const response = await axios.put(`${API_URL}/api/factures/${currentFacture.facture_id}/payment`, {
        montant_paye_facture: parseFloat(paymentAmount),
        new_total_amount: parseFloat(newPaymentTotal) // Envoie le nouveau montant total
      });
      setStatusMessage({ type: 'success', text: response.data.message || 'Paiement et montant total mis à jour.' });
      fetchFactures();
      setShowPaymentModal(false);
      setPaymentAmount('');
      setNewPaymentTotal(''); // Réinitialise l'état
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paiement:', error);
      setStatusMessage({ type: 'error', text: `Erreur: ${error.response?.data?.error || error.message}` });
    }
  };

  // Calcul du montant dû actuel dans la modale de paiement
  const currentPaymentModalBalanceDue = currentFacture
    ? (parseFloat(newPaymentTotal || 0) - parseFloat(paymentAmount || 0))
    : 0;

  const handleOpenCancelModal = (facture) => {
    if (!facture || !facture.facture_id) {
      console.error("Impossible d'ouvrir la modale d'annulation: Facture ou ID de facture manquant.", { facture });
      setStatusMessage({ type: 'error', text: 'Impossible d\'annuler la facture: Facture invalide.' });
      return;
    }
    setCurrentFacture(facture);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelInvoice = async () => {
    if (!currentFacture || !currentFacture.facture_id || !cancelReason) {
      setStatusMessage({ type: 'error', text: 'Veuillez fournir une raison d\'annulation et s\'assurer que la facture est liée.' });
      return;
    }
    try {
      // Appel à la route PUT /api/factures/:id/cancel
      const response = await axios.put(`${API_URL}/api/factures/${currentFacture.facture_id}/cancel`, {
        raison_annulation: cancelReason
      });
      setStatusMessage({ type: 'success', text: response.data.message || 'Facture annulée avec succès.' });
      fetchFactures();
      setShowCancelModal(false);
      setCancelReason('');
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la facture:', error);
      setStatusMessage({ type: 'error', text: `Erreur: ${error.response?.data?.error || error.message}` });
    }
  };

  const handleOpenReturnModal = async (facture) => {
    if (!facture || !facture.facture_id) {
      console.error("Impossible d'ouvrir la modale de retour: Facture ou ID de facture manquant.", { facture });
      setStatusMessage({ type: 'error', text: 'Impossible de gérer le retour: Facture invalide.' });
      return;
    }
    setCurrentFacture(facture);
    setReturnReason('');
    setReturnAmount('');
    setSelectedReturnItem(null);
    try {
        // Utilise facture.facture_id dans l'URL
        const response = await axios.get(`${API_URL}/api/factures/${facture.facture_id}`);
        setCurrentFactureDetails(response.data);
        // Filtrer les articles actifs de la vente liée pour le retour
        setCurrentVenteItems(response.data.articles_vendus.filter(item => item.statut_vente === 'actif')); // articles_vendus du backend
        setShowReturnModal(true);
    } catch (error) {
        setStatusMessage({ type: 'error', text: `Erreur lors du chargement des articles de la facture: ${error.response?.data?.error || error.message}` });
    }
  };

  const handleReturnItem = async () => {
    if (!currentFacture || !currentFacture.facture_id || !selectedReturnItem || !returnReason || isNaN(parseFloat(returnAmount))) {
      setStatusMessage({ type: 'error', text: 'Données de retour incomplètes ou invalides.' });
      return;
    }
    try {
      // Appel à la route POST /api/factures/:id/return-item
      const response = await axios.post(`${API_URL}/api/factures/${currentFacture.facture_id}/return-item`, {
        vente_item_id: selectedReturnItem.item_id,
        reason: returnReason,
        montant_rembourse_item: parseFloat(returnAmount)
      });
      setStatusMessage({ type: 'success', text: response.data.message || "Retour d'article traité pour la facture." });
      fetchFactures();
      setShowReturnModal(false);
      setReturnReason('');
      setReturnAmount('');
      setSelectedReturnItem(null);
      setCurrentFactureDetails(null);
    } catch (error) {
      console.error('Erreur lors du traitement du retour:', error);
      setStatusMessage({ type: 'error', text: `Erreur: ${error.response?.data?.error || error.message}` });
    }
  };

  const handlePrintInvoice = async (factureId) => {
    const factureToPrint = factures.find(f => f.facture_id === factureId); // Utilise facture_id
    if (!factureToPrint || !factureToPrint.vente_id) {
      setStatusMessage({ type: 'error', text: 'Impossible d\'imprimer: ID de vente non trouvé pour cette facture.' });
      return;
    }

    try {
      // Appel à la route /api/ventes/:id/pdf (qui utilise l'ID de la VENTE)
      const response = await axios.get(`${API_URL}/api/ventes/${factureToPrint.vente_id}/pdf`, {
        responseType: 'blob',
      });

      const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(fileURL, '_blank');
      setStatusMessage({ type: 'success', text: `PDF de la facture ${factureId} généré avec succès.` });
    } catch (error) {
      console.error('Erreur lors de l\'impression de la facture:', error);
      setStatusMessage({ type: 'error', text: `Erreur lors de la génération du PDF: ${error.response?.data?.error || error.message}` });
    }
  };

  const filteredFactures = factures.filter(facture => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (facture.facture_id && facture.facture_id.toString().includes(searchLower)) || // Utilise facture_id
      (facture.numero_facture && facture.numero_facture.toLowerCase().includes(searchLower)) ||
      (facture.client_nom && facture.client_nom.toLowerCase().includes(searchLower)) ||
      (facture.statut_facture && facture.statut_facture.toLowerCase().includes(searchLower)) ||
      (facture.articles_vendus && facture.articles_vendus.some(item => // articles_vendus du backend
        item.imei?.toLowerCase().includes(searchLower) ||
        item.marque?.toLowerCase().includes(searchLower) ||
        item.modele?.toLowerCase().includes(searchLower)
      ))
    );
  });

  // Logique pour désactiver le bouton de confirmation de création de facture
  const isConfirmButtonDisabled = !newInvoiceClientName.trim() || invoiceRows.length === 0 || isNaN(parseFloat(newInvoicePayment)) || invoiceRows.some(row => row.validationError || !row.selectedProduct || row.imeiList.length === 0 || parseFloat(row.unitPrice) <= 0);
  console.log("État du bouton Confirmer Facture (disabled):", isConfirmButtonDisabled);


  return (
    <div className="p-4 max-w-full mx-auto font-sans bg-gray-50 rounded-xl shadow border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center flex items-center justify-center">
        <DocumentTextIcon className="h-6 w-6 text-gray-600 mr-2" />
        Gestion des Factures
      </h2>

      {statusMessage.text && (
        <div className={`mb-4 p-3 rounded-md flex items-center justify-between text-sm
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

      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => { setShowCreateInvoiceModal(true); handleAddRow(); }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 font-medium shadow-md"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Créer une Nouvelle Facture
        </button>
        <div className="relative w-full max-w-sm ml-4">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Rechercher par numéro, client, statut, IMEI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center text-sm">Chargement des factures...</p>
      ) : filteredFactures.length === 0 ? (
        <p className="text-gray-500 text-center text-sm">Aucune facture trouvée.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            <table className="table-auto w-full text-xs divide-y divide-gray-200">
              <thead className="bg-gray-100 text-gray-700 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">ID Facture</th>
                  <th className="px-3 py-2 font-medium">Numéro Facture</th>
                  <th className="px-3 py-2 font-medium">Date Facture</th>
                  <th className="px-3 py-2 font-medium">Client</th>
                  <th className="px-3 py-2 font-medium">Téléphone</th>
                  <th className="px-3 py-2 font-medium text-right">Montant Original</th>
                  <th className="px-3 py-2 font-medium text-right">Montant Payé</th>
                  <th className="px-3 py-2 font-right">Montant Dû Actuel</th>
                  <th className="px-3 py-2 font-medium text-right">Montant Remboursé</th>
                  <th className="px-3 py-2 font-medium">Statut Facture</th>
                  <th className="px-3 py-2 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFactures.map((facture) => {
                  console.log('Frontend: Facture rendue dans le tableau:', facture);
                  // Déterminer le texte du statut à afficher
                  let displayStatusText = facture.statut_facture.replace(/_/g, ' ');
                  let statusBgClass = '';

                  switch (facture.statut_facture) {
                    case 'payee_integralement':
                      displayStatusText = 'Vendu';
                      statusBgClass = 'bg-green-100 text-green-800';
                      break;
                    case 'paiement_partiel':
                      displayStatusText = 'En cours (partiel)';
                      statusBgClass = 'bg-yellow-100 text-yellow-800';
                      break;
                    case 'creee':
                      displayStatusText = 'En cours (créée)';
                      statusBgClass = 'bg-blue-100 text-blue-800';
                      break;
                    case 'annulee':
                      displayStatusText = 'Annulée';
                      statusBgClass = 'bg-red-100 text-red-800';
                      break;
                    case 'retour_partiel':
                      displayStatusText = 'Retour partiel';
                      statusBgClass = 'bg-purple-100 text-purple-800';
                      break;
                    case 'retour_total':
                      displayStatusText = 'Retour total';
                      statusBgClass = 'bg-gray-100 text-gray-800'; // Ou une autre couleur pour retour total
                      break;
                    default:
                      statusBgClass = 'bg-gray-100 text-gray-800';
                  }

                  return (
                    <tr key={facture.facture_id} className="hover:bg-blue-50">
                      <td className="px-3 py-2 text-gray-900 font-medium">{facture.facture_id}</td>
                      <td className="px-3 py-2 text-gray-700">{facture.numero_facture || 'N/A'}</td>
                      <td className="px-3 py-2 text-gray-700">{formatDate(facture.date_facture)}</td>
                      <td className="px-3 py-2 text-gray-700">{facture.client_nom}</td>
                      <td className="px-3 py-2 text-gray-700">{facture.client_telephone || 'N/A'}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{formatAmount(facture.montant_original_facture)}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{formatAmount(facture.montant_paye_facture)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-red-600">{formatAmount(facture.montant_actuel_du)}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{formatAmount(facture.montant_rembourse || 0)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${statusBgClass}`}>
                          {displayStatusText}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center space-x-1">
                        <button
                          onClick={() => {
                            console.log('Frontend: Tentative d\'ouverture modale paiement pour facture:', facture);
                            handleOpenPaymentModal(facture);
                          }}
                          className="p-1 rounded-full text-blue-600 hover:bg-blue-100 transition"
                          title="Gérer Paiement"
                          disabled={facture.statut_facture === 'annulee' || facture.statut_facture === 'retour_total' || (facture.montant_actuel_du <= 0 && facture.statut_facture !== 'paiement_partiel')}
                          // Le bouton de paiement reste actif si paiement partiel même si montant dû est 0 pour permettre ajustement
                        >
                          <CurrencyDollarIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            console.log('Frontend: Tentative d\'ouverture modale annulation pour facture:', facture);
                            handleOpenCancelModal(facture);
                          }}
                          className="p-1 rounded-full text-red-600 hover:bg-red-100 transition"
                          title="Annuler Facture"
                          disabled={facture.statut_facture === 'annulee' || facture.statut_facture === 'retour_total'}
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                        {/* Bouton "Gérer Retour" commenté pour le moment
                        <button
                          onClick={() => {
                            console.log('Frontend: Tentative d\'ouverture modale retour pour facture:', facture);
                            handleOpenReturnModal(facture);
                          }}
                          className="p-1 rounded-full text-purple-600 hover:bg-purple-100 transition"
                          title="Gérer Retour"
                          disabled={facture.statut_facture === 'annulee' || facture.statut_facture === 'retour_total'}
                        >
                          <ArrowUturnLeftIcon className="h-4 w-4" />
                        </button>
                        */}
                        <button
                          onClick={() => {
                            console.log('Frontend: Tentative d\'impression pour facture ID:', facture.facture_id, 'Vente ID:', facture.vente_id);
                            handlePrintInvoice(facture.facture_id);
                          }}
                          className="p-1 rounded-full text-blue-600 hover:bg-blue-100 transition"
                          title="Imprimer Facture"
                        >
                          <PrinterIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Créer Nouvelle Facture */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Créer une Nouvelle Facture</h3>
            {createInvoiceError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{createInvoiceError}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">Nom du Client *</label>
                <input
                  type="text"
                  id="clientName"
                  list="clients-list"
                  value={newInvoiceClientName}
                  onChange={handleClientNameChange}
                  className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                  required
                />
                <datalist id="clients-list">
                  {allClients.map(client => (
                    <option key={client.id} value={client.nom} />
                  ))}
                </datalist>
              </div>
              <div>
                <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 mb-1">Téléphone Client</label>
                <input
                  type="text"
                  id="clientPhone"
                  value={newInvoiceClientPhone}
                  onChange={(e) => setNewInvoiceClientPhone(e.target.value)}
                  className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                />
              </div>
            </div>

            <h4 className="text-md font-semibold text-gray-800 mb-2">Articles de la Facture</h4>
            <div className="mb-4 max-h-80 overflow-y-auto border border-gray-200 rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left w-[20%]">Produit</th>
                    <th className="px-3 py-2 text-left w-[25%]">IMEI(s)</th>
                    <th className="px-3 py-2 text-right w-[8%]">Qté</th>
                    <th className="px-3 py-2 text-right w-[15%]">P.Unit</th>
                    <th className="px-3 py-2 text-right w-[15%]">Montant</th>
                    <th className="px-3 py-2 text-center w-[17%]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceRows.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          list={`products-list-${row.id}`}
                          placeholder="Sélectionner un produit"
                          value={row.productSearchTerm}
                          onChange={(e) => handleProductInputChange(e, row.id)}
                          onBlur={(e) => handleProductSelect(e, row.id)}
                          className="w-full border border-blue-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                        <datalist id={`products-list-${row.id}`}>
                          {allAvailableProducts
                            .filter(p =>
                              `${p.marque} ${p.modele} ${p.stockage} ${p.type} ${p.type_carton || ''}`.trim().toLowerCase().includes(row.productSearchTerm.toLowerCase())
                            )
                            .map(p => (
                              <option key={p.id} value={`${p.marque} ${p.modele} ${p.stockage} ${p.type} ${p.type_carton || ''}`.trim()} />
                            ))}
                        </datalist>
                      </td>
                      <td className="px-3 py-2">
                        <textarea
                          placeholder="IMEI(s) séparés par virgule ou retour à la ligne"
                          value={row.imeiInput}
                          onChange={(e) => handleImeiInputChange(e, row.id)}
                          onBlur={() => validateImeiAndCalculateQuantity(row.id)}
                          className="w-full border border-blue-300 rounded-md px-2 py-1 text-xs h-16 resize-y focus:outline-none focus:ring-1 focus:ring-blue-400"
                        ></textarea>
                        {row.validationError && <p className="text-red-500 text-[10px] mt-1">{row.validationError}</p>}
                      </td>
                      <td className="px-3 py-2 text-right">{row.quantity}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={row.unitPrice}
                          onChange={(e) => handleUnitPriceChange(e, row.id)}
                          className="w-full border border-blue-300 rounded-md px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
                          step="1" // MODIFIÉ: step="1" pour les entiers
                          min="0"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">{formatAmount(row.totalPrice)}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-full"
                          title="Supprimer la ligne"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition text-sm font-medium mb-4"
            >
              <PlusCircleIcon className="h-4 w-4 mr-1" />
              Ajouter une ligne
            </button>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="negotiatedPrice" className="block text-sm font-medium text-gray-700 mb-1">Montant Négocié (Optionnel)</label>
                <input
                  type="number"
                  id="negotiatedPrice"
                  value={negotiatedPrice}
                  onChange={(e) => setNegotiatedPrice(e.target.value)}
                  className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                  step="1" // MODIFIÉ: step="1" pour les entiers
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="newInvoicePayment" className="block text-sm font-medium text-gray-700 mb-1">Montant Payé *</label>
                <input
                  type="number"
                  id="newInvoicePayment"
                  value={newInvoicePayment}
                  onChange={(e) => setNewInvoicePayment(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                  className="w-full border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                  step="1" // MODIFIÉ: step="1" pour les entiers
                  min="0"
                  max={total}
                  required
                />
              </div>
              <div className="col-span-2 text-right pt-2">
                <p className="text-lg font-bold text-gray-900">Sous-total: {formatAmount(total)}</p>
                <p className="text-lg font-bold text-red-600">Balance: {formatAmount(balance)}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => { setShowCreateInvoiceModal(false); resetCreateInvoiceForm(); }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateInvoice}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                disabled={isConfirmButtonDisabled}
              >
                Confirmer Facture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gérer Paiement */}
      {showPaymentModal && currentFacture && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Gérer Paiement Facture #{currentFacture.facture_id}</h3>
            <p className="text-gray-700 mb-2">Montant Original de la Facture: {formatAmount(currentFacture.montant_original_facture)}</p>
            <p className="text-gray-700 mb-2">Montant Payé Actuel: {formatAmount(currentFacture.montant_paye_facture)}</p>

            <label htmlFor="newPaymentTotal" className="block text-sm font-medium text-gray-700 mb-1">Nouveau Montant Total (Négocié):</label>
            <input
              type="number"
              id="newPaymentTotal"
              value={newPaymentTotal}
              onChange={(e) => setNewPaymentTotal(e.target.value)}
              className="w-full border border-blue-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              step="1" // MODIFIÉ: step="1" pour les entiers
              min="0"
            />

            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">Nouveau Montant Payé:</label>
            <input
              type="number"
              id="paymentAmount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full border border-blue-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              step="1" // MODIFIÉ: step="1" pour les entiers
              min="0"
              max={newPaymentTotal} // Max est le nouveau montant total
            />
            <p className="text-lg font-bold text-red-600 mb-4">Montant Dû Actuel: {formatAmount(currentPaymentModalBalanceDue)}</p>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdatePayment}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Mettre à Jour Paiement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Annuler Facture */}
      {showCancelModal && currentFacture && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Annuler Facture #{currentFacture.facture_id}</h3>
            <p className="text-gray-700 mb-4">Êtes-vous sûr de vouloir annuler cette facture ? Tous les articles de la vente associée seront également annulés et les produits réactivés.</p>
            <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700 mb-1">Raison de l'annulation:</label>
            <textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full border border-blue-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              rows="3"
              required
            ></textarea>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleCancelInvoice}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                Confirmer Annulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gérer Retour */}
      {showReturnModal && currentFacture && currentFactureDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Gérer Retour pour Facture #{currentFacture.facture_id}</h3>
            <p className="text-gray-700 mb-4">Sélectionnez l'article à retourner :</p>

            {currentVenteItems.length === 0 ? (
                <p className="text-gray-500 mb-4">Aucun article actif disponible pour le retour sur cette facture.</p>
            ) : (
                <select
                    className="w-full border border-blue-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                    onChange={(e) => {
                        const itemId = parseInt(e.target.value, 10);
                        const item = currentVenteItems.find(i => i.item_id === itemId);
                        setSelectedReturnItem(item);
                        setReturnAmount(item ? item.prix_unitaire_vente : '');
                    }}
                    value={selectedReturnItem ? selectedReturnItem.item_id : ''}
                >
                    <option value="">-- Sélectionner un article --</option>
                    {currentVenteItems.map(item => (
                        <option key={item.item_id} value={item.item_id}>
                            {item.marque} {item.modele} ({item.imei}) - {formatAmount(item.prix_unitaire_vente)}
                        </option>
                    ))}
                </select>
            )}

            {selectedReturnItem && (
                <>
                    <label htmlFor="returnReason" className="block text-sm font-medium text-gray-700 mb-1">Raison du retour:</label>
                    <textarea
                        id="returnReason"
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        className="w-full border border-blue-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                        rows="2"
                        required
                    ></textarea>

                    <label htmlFor="returnAmount" className="block text-sm font-medium text-gray-700 mb-1">Montant à rembourser:</label>
                    <input
                        type="number"
                        id="returnAmount"
                        value={returnAmount}
                        onChange={(e) => setReturnAmount(e.target.value)}
                        className="w-full border border-blue-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                        step="1" // MODIFIÉ: step="1" pour les entiers
                        min="0"
                        max={selectedReturnItem.prix_unitaire_vente}
                        required
                    />
                </>
            )}

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => { setShowReturnModal(false); setSelectedReturnItem(null); setReturnReason(''); setReturnAmount(''); setCurrentFactureDetails(null); }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleReturnItem}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
                disabled={!selectedReturnItem || !returnReason || isNaN(parseFloat(returnAmount))}
              >
                Confirmer Retour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
