// src/pages/NouvelleVentes.jsx
import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, ShoppingCartIcon, CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios'; // Importez axios pour la création de facture

export default function NouvelleVente() {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    client_nom: '',
    client_telephone: '',
    items: [{ imei: '' }], // Quantité par défaut à 1, sera gérée au submit
    montant_paye: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- MODIFICATION ICI : Définition de l'URL de base du backend ---
  // Cette variable est injectée par Vite et Render.
  // Elle sera 'https://choco-backend-api.onrender.com' en production sur Render,
  // et 'http://localhost:3001' en développement local (si vous avez configuré votre .env local).
  const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;
  // --- FIN DE LA MODIFICATION ---

  // Helper function to format currency
  const formatCFA = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'N/A CFA';
    }
    return parseFloat(amount).toLocaleString('fr-FR', {
      useGrouping: false,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) + ' CFA';
  };

  // Fetch initial data (clients and products)
  const fetchData = async () => {
    setLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      // --- MODIFICATION ICI : Utilisation de API_BASE_URL ---
      const clientsRes = await axios.get(`${API_BASE_URL}/api/clients`); // Utilisation d'axios
      // --- FIN DE LA MODIFICATION ---
      if (clientsRes.status !== 200) {
        throw new Error(clientsRes.data.error || 'Échec de la récupération des clients.');
      }
      setClients(clientsRes.data);

      // --- MODIFICATION ICI : Utilisation de API_BASE_URL ---
      const productsRes = await axios.get(`${API_BASE_URL}/api/products`); // Utilisation d'axios
      // --- FIN DE LA MODIFICATION ---
      if (productsRes.status !== 200) {
        throw new Error(productsRes.data.error || 'Échec de la récupération des produits.');
      }
      const productsData = productsRes.data.filter(p => p.status === 'active' && p.quantite === 1).map(p => ({
        ...p,
        prix_vente: p.prix_vente !== undefined && p.prix_vente !== null ? parseFloat(p.prix_vente) : null
      }));
      setProducts(productsData);

    } catch (error) {
      console.error('Erreur lors du chargement des données initiales:', error);
      setStatusMessage({ type: 'error', text: `Erreur lors du chargement des données: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate total amount dynamically based on items in the form
  const totalMontantCalcule = form.items.reduce((sum, item) => {
    const foundProduct = products.find(p => p.imei === item.imei);
    // Pour les mobiles, la quantité vendue est toujours 1
    const qty = 1; // Fixed quantity for IMEI-based products
    const price = (foundProduct && foundProduct.prix_vente !== null) ? foundProduct.prix_vente : 0;
    return sum + (qty * price);
  }, 0);

  // Handle changes in client name or montant_paye
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => {
      const newForm = { ...prevForm, [name]: value };

      // Si le champ modifié est le nom du client
      if (name === 'client_nom') {
        const foundClient = clients.find(client => client.nom === value);
        if (foundClient) {
          newForm.client_telephone = foundClient.telephone || '';
        } else {
          newForm.client_telephone = '';
        }
      }
      return newForm;
    });
    setStatusMessage({ type: '', text: '' });
  };

  // Handle changes in an individual sale item (IMEI)
  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [name]: value };
    setForm({ ...form, items: newItems });
    setStatusMessage({ type: '', text: '' });
  };

  // Add a new empty item line to the sale
  const handleAddItem = () => {
    setForm({
      ...form,
      items: [...form.items, { imei: '' }]
    });
  };

  // Remove an item line from the sale
  const handleRemoveItem = (index) => {
    const newItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: newItems });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    setIsSubmitting(true);

    if (!form.client_nom) {
      setStatusMessage({ type: 'error', text: 'Veuillez sélectionner ou entrer un nom de client.' });
      setIsSubmitting(false);
      return;
    }
    if (form.items.length === 0) {
      setStatusMessage({ type: 'error', text: 'Veuillez ajouter au moins un produit à vendre.' });
      setIsSubmitting(false);
      return;
    }

    const itemsToSend = [];
    // Validate and prepare items to send to backend
    for (const item of form.items) {
      if (!item.imei || !/^\d{6}$/.test(item.imei)) {
        setStatusMessage({ type: 'error', text: `IMEI invalide ou manquant: "${item.imei}". Doit contenir 6 chiffres.` });
        setIsSubmitting(false);
        return;
      }

      const foundProduct = products.find(p => p.imei === item.imei);
      if (!foundProduct) {
        setStatusMessage({ type: 'error', text: `Produit non trouvé pour l'IMEI "${item.imei}".` });
        setIsSubmitting(false);
        return;
      }
      if (foundProduct.prix_vente === null || foundProduct.prix_vente === undefined || isNaN(foundProduct.prix_vente) || parseFloat(foundProduct.prix_vente) <= 0) {
        setStatusMessage({ type: 'error', text: `Prix de vente invalide ou manquant pour le produit avec IMEI "${item.imei}". Veuillez définir un prix dans la gestion des produits.` });
        setIsSubmitting(false);
        return;
      }
      // Pour les mobiles, la quantité vendue est toujours 1
      const qtyRequested = 1;

      // Vérification du stock côté client (doit être 1 pour être vendable ici)
      if (foundProduct.quantite < qtyRequested || foundProduct.quantite !== 1) {
        setStatusMessage({ type: 'error', text: `Le produit avec IMEI "${item.imei}" n'est pas disponible en quantité suffisante ou n'a pas une quantité de 1 pour la vente.` });
        setIsSubmitting(false);
        return;
      }

      itemsToSend.push({
        produit_id: foundProduct.id, // Assurez-vous d'envoyer l'ID du produit
        imei: item.imei,
        quantite_vendue: qtyRequested, // Fixed to 1 for IMEI-based products
        prix_unitaire_vente: parseFloat(foundProduct.prix_vente),
        marque: foundProduct.marque,
        modele: foundProduct.modele,
        stockage: foundProduct.stockage,
        type: foundProduct.type,
        type_carton: foundProduct.type_carton || null,
        prix_unitaire_achat: foundProduct.prix_achat, // Inclure le prix d'achat pour le backend
      });
    }

    const parsedMontantPaye = parseFloat(form.montant_paye);
    if (isNaN(parsedMontantPaye) || parsedMontantPaye < 0) {
      setStatusMessage({ type: 'error', text: 'Le montant payé est invalide.' });
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Créer la Vente
      const venteRes = await axios.post(`${API_BASE_URL}/api/ventes`, {
        nom_client: form.client_nom,
        client_telephone: form.client_telephone,
        items: itemsToSend,
        montant_paye: parsedMontantPaye,
        is_facture_speciale: false, // C'est une vente normale, pas une facture spéciale
        montant_negocie: totalMontantCalcule // Le montant total de la vente est le montant négocié par défaut ici
      });

      if (venteRes.status !== 201) { // Vérifiez le statut HTTP 201 pour la création
        throw new Error(venteRes.data.error || 'Erreur inconnue lors de la création de la vente.');
      }

      // --- DÉBUT DE LA MODIFICATION ---
      // Suppression de la création de la facture associée pour les ventes en détail
      // const venteId = venteRes.data.vente_id;
      // const totalVenteAmount = venteRes.data.montant_total; // Récupérer le montant total de la vente du backend

      // const factureData = {
      //   vente_id: venteId,
      //   nom_client: form.client_nom,
      //   client_telephone: form.client_telephone,
      //   montant_original_facture: totalVenteAmount, // Utiliser le montant total de la vente
      //   montant_paye_facture: parsedMontantPaye,
      // };
      // const factureRes = await axios.post(`${API_BASE_URL}/api/factures`, factureData);
      // if (factureRes.status !== 201) {
      //   throw new Error(factureRes.data.error || 'Erreur inconnue lors de la création de la facture.');
      // }
      // --- FIN DE LA MODIFICATION ---

      setStatusMessage({ type: 'success', text: 'Vente enregistrée avec succès.' }); // Message mis à jour
      // Reset form to initial state
      setForm({
        client_nom: '',
        client_telephone: '',
        items: [{ imei: '' }],
        montant_paye: 0
      });
      fetchData(); // Re-fetch products to update stock quantities
    } catch (error) {
      console.error('Erreur lors de la soumission de la vente:', error);
      setStatusMessage({ type: 'error', text: `Erreur: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Chargement des données...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans bg-gray-50 rounded-3xl shadow-xl border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center">
        <ShoppingCartIcon className="h-7 w-7 text-blue-600 mr-2" />
        Nouvelle Vente
      </h2>

      {statusMessage.text && (
        <div className={`mb-6 p-3 rounded-lg flex items-center justify-between text-sm
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="client_nom" className="block text-sm font-semibold text-gray-700 mb-2">
              Nom du Client *
            </label>
            <input
              list="clients-list"
              id="client_nom"
              name="client_nom"
              placeholder="Sélectionner ou entrer un client"
              value={form.client_nom}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
              required
            />
            <datalist id="clients-list">
              {clients.map((client) => (
                <option key={client.id} value={client.nom} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="client_telephone" className="block text-sm font-semibold text-gray-700 mb-2">
              Téléphone du Client
            </label>
            <input
              type="text"
              id="client_telephone"
              name="client_telephone"
              placeholder="Numéro de téléphone du client"
              value={form.client_telephone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
            />
          </div>
        </div>

        <div>
          <label htmlFor="montant_paye" className="block text-sm font-semibold text-gray-700 mb-2">
            Montant Payé (CFA) *
          </label>
          <input
            type="number"
            id="montant_paye"
            name="montant_paye"
            placeholder="Montant reçu du client"
            value={form.montant_paye}
            onChange={handleChange}
            min={0}
            step="1" // Modifié à step="1" car CFA est généralement entier
            className={`w-full border rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition duration-200 border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent`}
            required
          />
        </div>


        <div className="space-y-5 p-5 rounded-2xl bg-gray-50 border border-gray-200 shadow-inner">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4">Articles à vendre</h3>
          {form.items.map((item, index) => {
            const foundProduct = products.find(p => p.imei === item.imei);
            const displayPrice = foundProduct && foundProduct.prix_vente !== null ? formatCFA(foundProduct.prix_vente) : 'N/A CFA';
            const storageInfo = foundProduct && foundProduct.stockage ? ` (${foundProduct.stockage})` : '';
            const displayProductInfo = foundProduct ?
              `${foundProduct.marque} ${foundProduct.modele}${storageInfo} - Qté dispo: ${foundProduct.quantite}` :
              'Produit inconnu';

            return (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                <div>
                  <label htmlFor={`imei-${index}`} className="block text-xs font-medium text-gray-600 mb-1">
                    IMEI (6 chiffres) *
                  </label>
                  <input
                    list="products-imei-list"
                    id={`imei-${index}`}
                    name="imei"
                    placeholder="IMEI du produit"
                    value={item.imei}
                    onChange={(e) => handleItemChange(index, e)}
                    maxLength={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition duration-200"
                    required
                  />
                  <datalist id="products-imei-list">
                    {products.map((p) => (
                      <option key={p.id || p.imei} value={p.imei}>
                        {p.marque} {p.modele} {p.stockage ? `(${p.stockage})` : ''} - Qté: {p.quantite} - Prix: {formatCFA(p.prix_vente)}
                      </option>
                    ))}
                  </datalist>
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-semibold">{displayProductInfo}</span><br/>
                    Prix unitaire: <span className="font-semibold">{displayPrice}</span>
                  </p>
                </div>
                <div className="flex justify-end items-center h-full pt-6 md:pt-0">
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 transition duration-200"
                      title="Supprimer cet article"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={handleAddItem}
            className="mt-4 flex items-center px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition duration-200 text-sm font-medium shadow-md"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Ajouter un article
          </button>
        </div>

        <div className="text-right text-2xl font-bold text-gray-800 pt-4 border-t border-gray-200">
          Montant Total de la Vente: <span className="text-blue-600">{formatCFA(totalMontantCalcule)}</span>
        </div>

        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-10 py-4 rounded-full font-bold text-lg shadow-lg transform transition duration-300
              ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl hover:scale-105'}`}
          >
            {isSubmitting ? 'Validation en cours...' : 'Valider la Vente'}
          </button>
        </div>
      </form>
    </div>
  );
}
