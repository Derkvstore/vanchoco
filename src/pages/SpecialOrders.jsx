import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  TruckIcon,
  ArchiveBoxIcon,
  PhoneIcon,
  UserIcon,
  BuildingStorefrontIcon,
  TagIcon,
  CubeIcon,
  ClockIcon,
  XMarkIcon,
  ArrowPathIcon, // For replacement (Return)
  ClipboardDocumentListIcon, // Icon for special orders
  CurrencyDollarIcon, // For payment icon
  ArrowUturnLeftIcon, // For Cancel
  MagnifyingGlassIcon // For the search bar
} from '@heroicons/react/24/outline';

export default function SpecialOrders() {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [errorOrders, setErrorOrders] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal for adding/editing
  const [currentOrder, setCurrentOrder] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState(''); // NEW: State for the search term
  const [totalSoldBenefice, setTotalSoldBenefice] = useState(0); // NEW: State for total profit of sold orders

  // States for the payment modification modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrderToEditPayment, setCurrentOrderToEditPayment] = useState(null);
  const [newMontantPaye, setNewMontantPaye] = useState('');
  const [paymentModalError, setPaymentModalError] = useState(''); // CORRECTION: Initialisation avec useState('')

  // States for the custom confirmation modal (for Cancel / Replace)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalContent, setConfirmModalContent] = useState({ title: "", message: null });
  const [onConfirmAction, setOnConfirmAction] = useState(null);
  const [returnReasonInput, setReturnReasonInput] = useState(''); // Used for cancellation/replacement reason
  const [confirmModalError, setConfirmModalError] = useState(''); // Specific error for the confirmation modal
  const [isConfirming, setIsConfirming] = useState(false); // For confirmation button loading state

  const textareaRef = useRef(null); // Reference for the reason text field

  // Form states for new/edit special order
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [fournisseurName, setFournisseurName] = useState('');
  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState(''); // Correctly declared
  const [stockage, setStockage] = useState('');
  const [type, setType] = useState('TELEPHONE');
  const [typeCarton, setTypeCarton] = useState('');
  const [imei, setImei] = useState('');
  const [prixAchatFournisseur, setPrixAchatFournisseur] = useState('');
  const [prixVenteClient, setPrixVenteClient] = useState('');
  const [statut, setStatut] = useState('en_attente'); // Initial status for the form
  const [raisonAnnulation, setRaisonAnnulation] = useState('');
  const [initialMontantPaye, setInitialMontantPaye] = useState(''); // For order creation

  // --- MODIFICATION ICI : Définition de l'URL de base du backend ---
  // Cette variable est injectée par Vite et Render.
  // Elle sera 'https://choco-backend-api.onrender.com' en production sur Render,
  // et 'http://localhost:3001' en développement local (si vous avez configuré votre .env local).
  const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;
  // --- FIN DE LA MODIFICATION ---

  // --- Utility functions ---
  const formatCFA = (amount) => {
    if (amount === null || amount === undefined || isNaN(parseFloat(amount))) {
      return 'N/A CFA';
    }
    return parseFloat(amount).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' CFA';
  };

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
      console.error("Date formatting error:", e, "Original string:", dateString);
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'commandé': return 'bg-blue-100 text-blue-800';
      case 'reçu': return 'bg-purple-100 text-purple-800';
      case 'vendu': return 'bg-green-100 text-green-800';
      case 'annulé': return 'bg-red-100 text-red-800';
      case 'remplacé': return 'bg-indigo-100 text-indigo-800';
      case 'paiement_partiel': return 'bg-orange-100 text-orange-800'; // New status
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  // --- Data fetching functions ---

  const fetchSpecialOrders = async () => {
    setLoadingOrders(true);
    setErrorOrders(null);
    try {
      // --- MODIFICATION ICI : Utilisation de API_BASE_URL ---
      const response = await axios.get(`${API_BASE_URL}/api/special-orders`);
      // --- FIN DE LA MODIFICATION ---
      setOrders(response.data);
    } catch (err) {
      console.error('Error loading special orders:', err);
      setErrorOrders('Unable to load special orders.');
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchClientsAndFournisseurs = async () => {
    try {
      // --- MODIFICATION ICI : Utilisation de API_BASE_URL ---
      const clientsRes = await axios.get(`${API_BASE_URL}/api/clients`);
      // --- FIN DE LA MODIFICATION ---
      setClients(clientsRes.data);
      // --- MODIFICATION ICI : Utilisation de API_BASE_URL ---
      const fournisseursRes = await axios.get(`${API_BASE_URL}/api/fournisseurs`);
      // --- FIN DE LA MODIFICATION ---
      setFournisseurs(fournisseursRes.data);
    } catch (err) {
      console.error('Error loading clients or suppliers:', err);
      // Handle error, but do not block order display
    }
  };

  useEffect(() => {
    fetchSpecialOrders();
    fetchClientsAndFournisseurs();
  }, []);

  // Effect to auto-fill client phone number
  useEffect(() => {
    const foundClient = clients.find(c => c.nom && clientName && c.nom.toLowerCase() === clientName.toLowerCase());
    if (foundClient) {
      setClientPhone(foundClient.telephone || '');
    } else {
      setClientPhone('');
    }
  }, [clientName, clients]);


  // --- Special order management functions (CRUD & Status) ---

  const resetForm = () => {
    setClientName('');
    setClientPhone('');
    setFournisseurName('');
    setMarque('');
    setModele('');
    setStockage('');
    setType('TELEPHONE');
    setTypeCarton('');
    setImei('');
    setPrixAchatFournisseur('');
    setPrixVenteClient('');
    setStatut('en_attente');
    setRaisonAnnulation('');
    setCurrentOrder(null);
    setInitialMontantPaye(''); // Reset for creation
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (order) => {
    setCurrentOrder(order);
    setClientName(order.client_nom);
    setClientPhone(order.client_telephone || '');
    setFournisseurName(order.fournisseur_nom);
    setMarque(order.marque);
    setModele(order.modele);
    setStockage(order.stockage || '');
    setType(order.type);
    setTypeCarton(order.type_carton || '');
    setImei(order.imei || '');
    setPrixAchatFournisseur(order.prix_achat_fournisseur);
    setPrixVenteClient(order.prix_vente_client);
    setStatut(order.statut);
    setRaisonAnnulation(order.raison_annulation || '');
    setInitialMontantPaye(order.montant_paye); // Load existing paid amount
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });

    const orderData = {
      client_nom: clientName,
      fournisseur_nom: fournisseurName,
      marque,
      modele,
      stockage: stockage || null,
      type,
      type_carton: typeCarton || null,
      imei: imei || null,
      prix_achat_fournisseur: parseFloat(prixAchatFournisseur),
      prix_vente_client: parseFloat(prixVenteClient),
      montant_paye: parseFloat(initialMontantPaye || 0) // Include initial paid amount
    };

    try {
      if (currentOrder) {
        // For editing, use the status update route if applicable
        // Note: This form does not update all order fields, only status and reason
        // --- MODIFICATION ICI : Utilisation de API_BASE_URL ---
        await axios.put(`${API_BASE_URL}/api/special-orders/${currentOrder.order_id}/update-status`, {
        // --- FIN DE LA MODIFICATION ---
            statut: statut,
            raison_annulation: raisonAnnulation
        });
        setStatusMessage({ type: 'success', text: 'Special order updated successfully!' });
      } else {
        // --- MODIFICATION ICI : Utilisation de API_BASE_URL ---
        await axios.post(`${API_BASE_URL}/api/special-orders`, orderData);
        // --- FIN DE LA MODIFICATION ---
        setStatusMessage({ type: 'success', text: 'Special order added successfully!' });
      }
      setIsModalOpen(false);
      fetchSpecialOrders(); // Refresh special orders list
    } catch (err) {
      console.error('Error submitting special order:', err);
      setStatusMessage({ type: 'error', text: `Error: ${err.response?.data?.error || err.message}` });
    }
  };

  // Generic function to update status, called by specific actions
  const updateOrderStatus = async (orderId, newStatus, reason = null) => {
    setStatusMessage({ type: '', text: '' });
    setConfirmModalError('');
    setIsConfirming(true); // Activate confirmation button loading state
    try {
      // --- MODIFICATION ICI : Utilisation de API_BASE_URL ---
      const res = await axios.put(`${API_BASE_URL}/api/special-orders/${orderId}/update-status`, {
      // --- FIN DE LA MODIFICATION ---
        statut: newStatus,
        raison_annulation: reason
      });
      setStatusMessage({ type: 'success', text: `Order status updated to "${newStatus}"!` });
      closeConfirmModal(); // Close confirmation modal
      fetchSpecialOrders(); // Refresh list
    } catch (err) {
      console.error(`Error updating order status ${orderId}:`, err);
      setConfirmModalError(`Error updating status: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsConfirming(false); // Deactivate confirmation state
    }
  };

  // --- Payment modal management functions ---
  const handleUpdatePaymentClick = (order) => {
    setCurrentOrderToEditPayment(order);
    setNewMontantPaye(order.montant_paye);
    setPaymentModalError('');
    setShowPaymentModal(true);
  };

  const handleConfirmUpdatePayment = async (e) => {
    e.preventDefault();
    setPaymentModalError('');
    setStatusMessage({ type: '', text: '' });

    if (!currentOrderToEditPayment) return;

    const orderId = currentOrderToEditPayment.order_id;
    const prixVenteClient = parseFloat(currentOrderToEditPayment.prix_vente_client);
    const parsedNewMontantPaye = parseFloat(newMontantPaye);

    if (isNaN(parsedNewMontantPaye) || parsedNewMontantPaye < 0) {
      setPaymentModalError('The paid amount must be a positive number or zero.');
      return;
    }

    if (parsedNewMontantPaye > prixVenteClient) {
      setPaymentModalError(`The paid amount (${formatCFA(parsedNewMontantPaye)}) cannot be greater than the order's selling price (${formatCFA(prixVenteClient)}).`);
      return;
    }

    try {
      // --- MODIFICATION ICI : Utilisation de API_BASE_URL ---
      await axios.put(`${API_BASE_URL}/api/special-orders/${orderId}/update-payment`, {
      // --- FIN DE LA MODIFICATION ---
        new_montant_paye: parsedNewMontantPaye
      });
      setStatusMessage({ type: 'success', text: 'Special order payment updated successfully!' });
      setShowPaymentModal(false);
      fetchSpecialOrders(); // Refresh list
    } catch (err) {
      console.error('Error updating payment:', err);
      setPaymentModalError(err.response?.data?.error || 'Error updating payment.');
    }
  };

  // --- Status actions with confirmation functions ---

  const openConfirmModal = (title, message, action) => {
    setConfirmModalContent({ title, message });
    setOnConfirmAction(() => (currentReason) => action(currentReason));
    setConfirmModalError(''); // Reset modal error
    setReturnReasonInput(''); // Reset reason field
    setIsConfirming(false);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmModalContent({ title: "", message: null });
    setOnConfirmAction(null);
    setReturnReasonInput('');
    setConfirmModalError('');
    setIsConfirming(false);
  };

  const handleCancelSpecialOrderClick = (order) => {
    openConfirmModal(
      "Confirm order cancellation",
      (
        <>
          <p className="text-gray-700 mb-2 text-sm md:text-base">
            Are you sure you want to cancel the special order for "{order.marque} {order.modele}" from client "{order.client_nom}"?
            {order.statut === 'vendu' && (
              <span className="font-semibold text-red-600 block mt-1 text-xs md:text-sm">
                Warning: This order is already sold. Cancellation may require manual refund management.
              </span>
            )}
          </p>
          <label htmlFor="reasonInput" className="block text-xs font-medium text-gray-700 mb-1 md:text-sm">
            Reason for cancellation:
          </label>
          <textarea
            ref={textareaRef}
            id="reasonInput"
            value={returnReasonInput}
            onChange={(e) => setReturnReasonInput(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200"
            placeholder="Ex: Client changed mind..."
            required
            autoFocus
          ></textarea>
          {confirmModalError && (
            <p className="text-red-500 text-xs mt-1">{confirmModalError}</p>
          )}
        </>
      ),
      (reason) => updateOrderStatus(order.order_id, 'annulé', reason)
    );
  };

  const handleReplaceSpecialOrderClick = (order) => {
    openConfirmModal(
      "Confirm order replacement",
      (
        <>
          <p className="text-gray-700 mb-2 text-sm md:text-base">
            Are you sure you want to mark the special order for "{order.marque} {order.modele}" as "Replaced"?
          </p>
          <label htmlFor="reasonInput" className="block text-xs font-medium text-gray-700 mb-1 md:text-sm">
            Reason for replacement:
          </label>
          <textarea
            ref={textareaRef}
            id="reasonInput"
            value={returnReasonInput}
            onChange={(e) => setReturnReasonInput(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
            placeholder="Ex: Defective product..."
            required
            autoFocus
          ></textarea>
          {confirmModalError && (
            <p className="text-red-500 text-xs mt-1">{confirmModalError}</p>
          )}
        </>
      ),
      (reason) => updateOrderStatus(order.order_id, 'remplacé', reason)
    );
  };

  // Focus on the confirmation modal textarea
  useEffect(() => {
    if (showConfirmModal && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showConfirmModal, returnReasonInput]);

  // Filter orders by client, supplier, brand, model, or IMEI
  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (order.client_nom && order.client_nom.toLowerCase().includes(searchLower)) ||
      (order.fournisseur_nom && order.fournisseur_nom.toLowerCase().includes(searchLower)) ||
      (order.marque && order.marque.toLowerCase().includes(searchLower)) ||
      (order.modele && order.modele.toLowerCase().includes(searchLower)) ||
      (order.imei && order.imei.toLowerCase().includes(searchLower))
    );
  });

  // NEW: Calculate total profit for sold orders
  useEffect(() => {
    const calculatedBenefice = filteredOrders.reduce((sum, order) => {
      if (order.statut === 'vendu') {
        const prixVente = parseFloat(order.prix_vente_client) || 0;
        const prixAchat = parseFloat(order.prix_achat_fournisseur) || 0;
        return sum + (prixVente - prixAchat);
      }
      return sum;
    }, 0);
    setTotalSoldBenefice(calculatedBenefice);
  }, [filteredOrders]);

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen font-sans">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">Gestion des Commandes Spéciales</h2>

      {/* Display total profit of sold orders - MOVED HERE */}
      <div className="mt-4 p-3 sm:p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg shadow-md text-center mb-4 sm:mb-6">
        <p className="text-lg sm:text-xl font-semibold">Bénéfice Total des Commandes Spéciales Vendues :</p>
        <p className="text-2xl sm:text-3xl font-extrabold mt-1 sm:mt-2">{formatCFA(totalSoldBenefice)}</p>
      </div>

      {statusMessage.text && (
        <div className={`mb-3 p-2 sm:p-3 rounded-md flex items-center justify-between text-xs sm:text-sm
          ${statusMessage.type === 'success' ? 'bg-green-100 text-green-700 border border-green-400' : 'bg-red-100 text-red-700 border border-red-400'}`}>
          <span>
            {statusMessage.type === 'success' ? <CheckCircleIcon className="h-4 w-4 inline mr-1" /> : <XCircleIcon className="h-4 w-4 inline mr-1" />}
            {statusMessage.text}
          </span>
          <button onClick={() => setStatusMessage({ type: '', text: '' })} className="ml-2">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search and add section - Improved responsiveness */}
      <div className="flex flex-col md:flex-row items-center md:justify-between space-y-3 md:space-y-0 mb-4 sm:mb-6">
        {/* Multi-criteria search bar */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="w-3 h-3 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Rechercher par client, fournisseur, marque, modèle ou IMEI"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-full bg-white text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          />
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors w-full md:w-auto justify-center text-sm"
        >
          <PlusIcon className="h-4 w-4 mr-1.5" />
          Ajouter une Commande Spéciale
        </button>
      </div>

      {loadingOrders ? (
        <p className="text-center text-gray-600 text-sm">Chargement des commandes spéciales...</p>
      ) : errorOrders ? (
        <p className="text-center text-red-600 text-sm">{errorOrders}</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-center text-gray-600 text-sm">Aucune commande spéciale trouvée.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-100 text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="px-2 py-2 text-left">Client</th>
                <th className="px-2 py-2 text-left">Fournisseur</th>
                <th className="px-2 py-2 text-left">Article</th>
                <th className="px-2 py-2 text-left">IMEI</th>
                <th className="px-2 py-2 text-right">Prix Achat</th>
                <th className="px-2 py-2 text-right">Prix Vente</th>
                <th className="px-2 py-2 text-right">Montant Payé</th>
                <th className="px-2 py-2 text-right">Reste à Payer</th>
                <th className="px-2 py-2 text-left">Date Commande</th>
                <th className="px-2 py-2 text-center">Statut</th>
                <th className="px-2 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order.order_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-2 py-2 whitespace-nowrap">
                    <div className="font-medium text-gray-900 flex items-center">
                      <UserIcon className="h-3 w-3 mr-1 text-gray-500" /> {order.client_nom}
                    </div>
                    <div className="text-gray-500 text-[10px] flex items-center">
                      <PhoneIcon className="h-2.5 w-2.5 mr-1" /> {order.client_telephone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <BuildingStorefrontIcon className="h-3 w-3 mr-1 text-gray-500" /> {order.fournisseur_nom}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="font-medium text-gray-900 flex items-center">
                      <TagIcon className="h-3 w-3 mr-1 text-gray-500" /> {order.marque} {order.modele}
                    </div>
                    <div className="text-gray-500 text-[10px] flex items-center">
                      <CubeIcon className="h-2.5 w-2.5 mr-1" /> {order.stockage || 'N/A'} ({order.type}{order.type_carton ? ` ${order.type_carton}` : ''})
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">{order.imei || 'N/A'}</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">{formatCFA(order.prix_achat_fournisseur)}</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap font-semibold text-blue-700">{formatCFA(order.prix_vente_client)}</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">{formatCFA(order.montant_paye)}</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap font-semibold text-red-600">{formatCFA(order.montant_restant)}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <ClockIcon className="h-3 w-3 mr-1 text-gray-500" /> {formatDate(order.date_commande)}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span className={`px-1.5 inline-flex text-[9px] leading-4 font-semibold rounded-full ${getStatusColor(order.statut)}`}>
                      {order.statut}
                    </span>
                    {order.raison_annulation && (
                      <p className="text-[8px] text-gray-500 mt-0.5">Raison: {order.raison_annulation}</p>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center whitespace-nowrap">
                    <div className="flex space-x-1 justify-center">
                      {/* Edit Payment Button */}
                      {(order.statut !== 'vendu' && order.statut !== 'annulé' && order.statut !== 'remplacé') && (
                        <button
                          onClick={() => handleUpdatePaymentClick(order)}
                          className="p-1 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
                          title="Modifier Paiement"
                        >
                          <CurrencyDollarIcon className="h-4 w-4" />
                        </button>
                      )}

                      {/* Cancel Button (visible if order is not already cancelled or replaced) */}
                      {(order.statut !== 'annulé' && order.statut !== 'remplacé') && (
                        <button
                          onClick={() => handleCancelSpecialOrderClick(order)}
                          className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          title="Annuler la commande"
                        >
                          <ArrowUturnLeftIcon className="h-4 w-4" />
                        </button>
                      )}

                      {/* Mark as Ordered Button (if pending) */}
                      {order.statut === 'en_attente' && (
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'commandé')}
                          className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                          title="Marquer comme Commandé"
                        >
                          <TruckIcon className="h-4 w-4" />
                        </button>
                      )}
                      {/* Mark as Received Button (if ordered) */}
                      {order.statut === 'commandé' && (
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'reçu')}
                          className="p-1 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                          title="Marquer comme Reçu"
                        >
                          <ArchiveBoxIcon className="h-4 w-4" />
                        </button>
                      )}
                      {/* Mark as Sold Button (if received or partial payment AND fully paid) */}
                      {(order.statut === 'reçu' || order.statut === 'paiement_partiel') && parseFloat(order.montant_restant) <= 0 && (
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'vendu')}
                          className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                          title="Marquer comme Vendu"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                      )}
                      {/* Replace Button (Return) - visible if sold, received or partial payment */}
                      {(order.statut === 'vendu' || order.statut === 'reçu' || order.statut === 'paiement_partiel') && (
                        <button
                          onClick={() => handleReplaceSpecialOrderClick(order)}
                          className="p-1 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                          title="Marquer comme Remplacé (Retourner)"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for adding/editing a special order */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-4 sm:p-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
              {currentOrder ? 'Modifier la Commande Spéciale' : 'Ajouter une Nouvelle Commande Spéciale'}
            </h3>
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Client */}
              <div>
                <label htmlFor="clientName" className="block text-xs sm:text-sm font-medium text-gray-700">Nom du Client</label>
                <input
                  type="text"
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  list="client-names"
                  required
                  className="mt-0.5 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <datalist id="client-names">
                  {clients.map(client => (
                    <option key={client.id} value={client.nom} />
                  ))}
                </datalist>
                {clientPhone && <p className="text-[10px] text-gray-500 mt-0.5">Téléphone: {clientPhone}</p>}
              </div>

              {/* Fournisseur */}
              <div>
                <label htmlFor="fournisseurName" className="block text-xs sm:text-sm font-medium text-gray-700">Nom du Fournisseur</label>
                <input
                  type="text"
                  id="fournisseurName"
                  value={fournisseurName}
                  onChange={(e) => setFournisseurName(e.target.value)}
                  list="fournisseur-names"
                  required
                  className="mt-0.5 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <datalist id="fournisseur-names">
                  {fournisseurs.map(fournisseur => (
                    <option key={fournisseur.id} value={fournisseur.nom} />
                  ))}
                </datalist>
              </div>

              {/* Marque */}
              <div>
                <label htmlFor="marque" className="block text-xs sm:text-sm font-medium text-gray-700">Marque</label>
                <input
                  type="text"
                  id="marque"
                  value={marque}
                  onChange={(e) => setMarque(e.target.value)}
                  required
                  className="mt-0.5 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Modèle */}
              <div>
                <label htmlFor="modele" className="block text-xs sm:text-sm font-medium text-gray-700">Modèle</label>
                <input
                  type="text"
                  id="modele"
                  value={modele}
                  onChange={(e) => setModele(e.target.value)} // Correction: Utilise un commentaire JavaScript ici
                  required
                  className="mt-0.5 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Stockage */}
              <div>
                <label htmlFor="stockage" className="block text-xs sm:text-sm font-medium text-gray-700">Stockage (Go)</label>
                <input
                  type="text"
                  id="stockage"
                  value={stockage}
                  onChange={(e) => setStockage(e.target.value)}
                  className="mt-0.5 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Type */}
              <div>
                <label htmlFor="type" className="block text-xs sm:text-sm font-medium text-gray-700">Type</label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                  className="mt-0.5 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="TELEPHONE">TÉLÉPHONE</option>
                  <option value="ACCESSOIRE">ACCESSOIRE</option>
                  <option value="CARTON">CARTON</option>
                  <option value="ARRIVAGE">ARRIVAGE</option>
                </select>
              </div>

              {/* Type Carton (if applicable) */}
              {type === 'CARTON' && (
                <div>
                  <label htmlFor="typeCarton" className="block text-xs sm:text-sm font-medium text-gray-700">Type Carton</label>
                  <input
                    type="text"
                    id="typeCarton"
                    value={typeCarton}
                    onChange={(e) => setTypeCarton(e.target.value)}
                    className="mt-0.5 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {/* IMEI */}
              <div>
                <label htmlFor="imei" className="block text-xs sm:text-sm font-medium text-gray-700">IMEI (optional)</label>
                <input
                  type="text"
                  id="imei"
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  maxLength="6"
                  className="mt-0.5 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Supplier Purchase Price */}
              <div>
                <label htmlFor="prixAchatFournisseur" className="block text-xs sm:text-sm font-medium text-gray-700">Prix Achat Fournisseur (CFA)</label>
                <input
                  type="number"
                  id="prixAchatFournisseur"
                  value={prixAchatFournisseur}
                  onChange={(e) => setPrixAchatFournisseur(e.target.value)}
                  required
                  min="0"
                  step="1"
                  className="mt-0.5 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Client Selling Price */}
              <div>
                <label htmlFor="prixVenteClient" className="block text-xs sm:text-sm font-medium text-gray-700">Prix Vente Client (CFA)</label>
                <input
                  type="number"
                  id="prixVenteClient"
                  value={prixVenteClient}
                  onChange={(e) => setPrixVenteClient(e.target.value)}
                  required
                  min="0"
                  step="1"
                  className="mt-0.5 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Initial Paid Amount (only for creation) */}
              {!currentOrder && (
                <div>
                  <label htmlFor="initialMontantPaye" className="block text-xs sm:text-sm font-medium text-gray-700">Montant Payé Initial (CFA)</label>
                  <input
                    type="number"
                    id="initialMontantPaye"
                    value={initialMontantPaye}
                    onChange={(e) => setInitialMontantPaye(e.target.value)}
                    min="0"
                    step="1"
                    className="mt-0.5 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {/* Form action buttons */}
              <div className="md:col-span-2 flex justify-end space-x-2 mt-4 sm:mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {currentOrder ? 'Mettre à jour' : 'Ajouter la Commande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment modification modal */}
      {showPaymentModal && currentOrderToEditPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-4 sm:p-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">Modifier Paiement Commande Spéciale</h3>
            <form onSubmit={handleConfirmUpdatePayment}>
              <div className="mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">
                  Client: <span className="font-semibold">{currentOrderToEditPayment.client_nom}</span>
                </p>
                <p className="text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">
                  Article: <span className="font-semibold">{currentOrderToEditPayment.marque} {currentOrderToEditPayment.modele}</span>
                </p>
                <p className="text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2">
                  Prix de Vente Total: <span className="font-semibold">{formatCFA(currentOrderToEditPayment.prix_vente_client)}</span>
                </p>
                <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-4">
                  Montant Actuellement Payé: <span className="font-semibold">{formatCFA(currentOrderToEditPayment.montant_paye)}</span>
                </p>

                <label htmlFor="newMontantPaye" className="block text-xs sm:text-sm font-medium text-gray-700">Nouveau Montant Payé Total (CFA)</label>
                <input
                  type="number"
                  id="newMontantPaye"
                  value={newMontantPaye}
                  onChange={(e) => setNewMontantPaye(e.target.value)}
                  required
                  min="0"
                  step="1"
                  className="mt-0.5 block w-full border border-gray-300 rounded-md shadow-sm p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {paymentModalError && (
                <p className="text-red-600 text-xs sm:text-sm mb-3 sm:mb-4">{paymentModalError}</p>
              )}

              <div className="flex justify-end space-x-2 mt-4 sm:mt-6">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Confirmer le Paiement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom confirmation modal (for cancellation/replacement) */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50 no-print">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl max-w-xs sm:max-w-sm w-full relative z-[60] pointer-events-auto">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">{confirmModalContent.title}</h3>
            {typeof confirmModalContent.message === 'string' ? (
              <p className="text-sm text-gray-700 mb-4 sm:mb-6">{confirmModalContent.message}</p>
            ) : (
              <div className="text-sm text-gray-700 mb-4 sm:mb-6">{confirmModalContent.message}</div>
            )}
            {confirmModalError && (
              <p className="text-red-500 text-xs mt-1 sm:mt-2">{confirmModalError}</p>
            )}
            <div className="flex justify-end space-x-2 sm:space-x-4">
              <button
                onClick={closeConfirmModal}
                className="px-3 py-1.5 text-sm bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
                disabled={isConfirming}
              >
                Annuler
              </button>
              <button
                onClick={() => onConfirmAction(returnReasonInput)}
                className={`px-3 py-1.5 text-sm rounded-md transition ${
                  isConfirming || (confirmModalContent.message && typeof confirmModalContent.message !== 'string' && !returnReasonInput.trim())
                    ? 'bg-red-400 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
                disabled={isConfirming || (confirmModalContent.message && typeof confirmModalContent.message !== 'string' && !returnReasonInput.trim())}
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
