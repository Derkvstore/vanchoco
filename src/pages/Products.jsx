import React, { useState, useEffect } => 'react';
import {
  CubeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

// Listes pour autocomplétion
const MARQUES = ["iPhone", "Samsung", "iPad", "AirPod"];
const MODELES = {
  iPhone: [
    "X", "XR", "XS", "XS MAX", "11 SIMPLE", "11 PRO", "11 PRO MAX",
    "12 SIMPLE", "12 MINI", "12 PRO", "12 PRO MAX",
    "13 SIMPLE", "13 MINI", "13 PRO", "13 PRO MAX",
    "14 SIMPLE", "14 PLUS", "14 PRO", "14 PRO MAX",
    "15 SIMPLE", "15 PLUS", "15 PRO", "15 PRO MAX",
    "16 SIMPLE", "16 PLUS", "16 PRO", "16 PRO MAX",
  ],
  Samsung: ["Galaxy S21", "Galaxy S22", "Galaxy A14", "Galaxy Note 20"],
  iPad: ["Air 10éme Gen", "Air 11éme Gen", "Pro", "Mini"],
  AirPod: ["1ère Gen", "2ème Gen", "3ème Gen", "4ème Gen", "Pro 1ème Gen,", "2ème Gen",],
};
const STOCKAGES = ["64 Go", "128 Go", "256 Go", "512 Go", "1 To"];


export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // Renommé de 'search' à 'searchTerm' pour la cohérence
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    marque: "",
    modele: "",
    stockage: "",
    type: "",
    type_carton: "",
    imei: "",
    quantite: 1,
    prix_vente: "",
    prix_achat: "",
    fournisseur_id: "",
  });
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fournisseurs, setFournisseurs] = useState([]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalContent, setConfirmModalContent] = useState({ title: "", message: "" });
  const [onConfirmAction, setOnConfirmAction] = useState(null);

  // --- MODIFICATION ICI : Définition de l'URL de base du backend ---
  // Cette variable est injectée par Vite et Render.
  // Elle sera 'https://choco-backend-api.onrender.com' en production sur Render,
  // et 'http://localhost:3001' en développement local (si vous avez configuré votre .env local).
  const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;
  // --- FIN DE LA MODIFICATION ---

  const openConfirmModal = (title, message, action) => {
    setConfirmModalContent({ title, message });
    setOnConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmModalContent({ title: "", message: "" });
    setOnConfirmAction(null);
  };

  // Fonction pour formater les nombres avec des espaces comme séparateurs de milliers
  const formatNumber = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'N/A';
    }
    // Utilise toLocaleString pour formater avec des espaces et sans décimales
    return parseFloat(amount).toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const fetchProducts = () => {
    setLoading(true);
    setFormError("");
    setSuccessMessage("");
    // --- MODIFICATION ICI : Utilisation de API_BASE_URL pour l'appel fetch ---
    fetch(`${API_BASE_URL}/api/products`)
    // --- FIN DE LA MODIFICATION ---
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur réseau lors de la récupération des produits.");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Produits reçus du backend (fetchProducts):", data); // LOG IMPORTANT
        setProducts(data);
      })
      .catch((error) => {
        console.error('Erreur lors du chargement des produits:', error);
        setFormError("Impossible de charger les produits. Veuillez réessayer plus tard.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchFournisseurs = () => {
    // --- MODIFICATION ICI : Utilisation de API_BASE_URL pour l'appel fetch ---
    fetch(`${API_BASE_URL}/api/fournisseurs`)
    // --- FIN DE LA MODIFICATION ---
      .then((res) => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || "Erreur réseau inconnue lors de la récupération des fournisseurs."); });
        }
        return res.json();
      })
      .then((data) => {
        setFournisseurs(data);
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des fournisseurs :", error);
        setFormError(`Impossible de charger la liste des fournisseurs: ${error.message}. Le formulaire pourrait être incomplet.`);
      });
  };

  useEffect(() => {
    fetchProducts();
    fetchFournisseurs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Pour les champs numériques (prix et quantité), filtrez les caractères non numériques
    if (name === "prix_achat" || name === "prix_vente") {
        newValue = value.replace(/[^0-9]/g, ''); // N'autorise que les chiffres (pas de point pour les décimales)
    } else if (name === "quantite" && editingId) {
        newValue = value.replace(/[^0-9]/g, ''); // N'autorise que les chiffres
    } else if (name === "imei") {
        if (editingId) {
            newValue = value.replace(/[^0-9]/g, '').slice(0, 6); // Max 6 chiffres
        }
    }

    setForm((prevForm) => ({ ...prevForm, [name]: newValue }));
    setFormError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    if (!form.marque || !form.modele || !form.type || !form.prix_vente || !form.prix_achat || !form.fournisseur_id) {
      setFormError("Veuillez remplir tous les champs obligatoires (Marque, Modèle, Type, Prix de vente, Prix d'achat, Fournisseur).");
      setIsSubmitting(false);
      return;
    }
    
    // Conversion en nombres entiers pour les prix
    const parsedPrixVente = parseInt(form.prix_vente, 10);
    if (isNaN(parsedPrixVente) || parsedPrixVente <= 0) {
      setFormError("Le prix de vente doit être un nombre entier positif.");
      setIsSubmitting(false);
      return;
    }

    const parsedPrixAchat = parseInt(form.prix_achat, 10);
    if (isNaN(parsedPrixAchat) || parsedPrixAchat <= 0) {
      setFormError("Le prix d'achat doit être un nombre entier positif.");
      setIsSubmitting(false);
      return;
    }

    // NOUVELLE CONDITION : Le prix de vente ne peut pas être inférieur au prix d'achat
    if (parsedPrixVente <= parsedPrixAchat) {
      setFormError("Le prix de vente ne peut pas être inférieur ou égale au prix d'achat.");
      setIsSubmitting(false);
      return;
    }

    let parsedQuantite = form.quantite;
    if (editingId) {
      parsedQuantite = parseInt(form.quantite, 10);
      if (isNaN(parsedQuantite) || parsedQuantite <= 0) {
        setFormError("La quantité doit être un nombre entier positif.");
        setIsSubmitting(false);
        return;
      }
    }

    if (form.marque && MODELES[form.marque] && !MODELES[form.marque].includes(form.modele)) {
      setFormError("Modèle invalide pour cette marque.");
      setIsSubmitting(false);
      return;
    }

    if (form.type === "CARTON" && form.marque.toLowerCase() === "iphone" && !form.type_carton) {
      setFormError("Le type de carton est requis pour les iPhones en carton.");
      setIsSubmitting(false);
      return;
    }

    let dataToSend = {
      ...form,
      prix_vente: parsedPrixVente,
      prix_achat: parsedPrixAchat,
      fournisseur_id: parseInt(form.fournisseur_id, 10),
    };
    let url = "";
    let method = "";

    if (editingId) {
      if (!/^\d{6}$/.test(form.imei)) {
        setFormError("L'IMEI doit contenir exactement 6 chiffres.");
        setIsSubmitting(false);
        return;
      }
      dataToSend.quantite = parsedQuantite;
      // --- MODIFICATION ICI : Utilisation de API_BASE_URL pour l'URL ---
      url = `${API_BASE_URL}/api/products/${editingId}`;
      // --- FIN DE LA MODIFICATION ---
      method = "PUT";
    } else {
      const imeiInput = form.imei
        .split(/[\n,]/)
        .map((imei) => imei.trim())
        .filter((imei) => imei !== "");

      if (imeiInput.length === 0) {
        setFormError("Veuillez entrer au moins un IMEI.");
        setIsSubmitting(false);
        return;
      }

      // --- NOUVELLE VÉRIFICATION : Détecter les doublons DANS l'entrée IMEI ---
      const uniqueImeis = new Set(imeiInput);
      if (uniqueImeis.size !== imeiInput.length) {
        setFormError("Des IMEIs dupliqués ont été détectés dans votre liste. Chaque IMEI doit être unique.");
        setIsSubmitting(false);
        return;
      }
      // --- FIN NOUVELLE VÉRIFICATION ---

      for (const imei of imeiInput) {
        if (!/^\d{6}$/.test(imei)) {
          setFormError(`IMEI invalide : "${imei}". Chaque IMEI doit contenir exactement 6 chiffres.`);
          setIsSubmitting(false);
          return;
        }
      }

      dataToSend = {
        ...form,
        imei: imeiInput, // Utilisez imeiInput qui est un tableau
        prix_vente: parsedPrixVente,
        prix_achat: parsedPrixAchat,
        fournisseur_id: parseInt(form.fournisseur_id, 10),
      };
      delete dataToSend.quantite;
      // --- MODIFICATION ICI : Utilisation de API_BASE_URL pour l'URL ---
      url = `${API_BASE_URL}/api/products/batch`;
      // --- FIN DE LA MODIFICATION ---
      method = "POST";
    }

    // Log du payload avant l'envoi
    console.log("Données envoyées au backend:", dataToSend);

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      // --- DÉBOGAGE AMÉLIORÉ ICI ---
      const responseText = await res.text(); // Lire la réponse comme texte d'abord
      let responseData;
      try {
          responseData = JSON.parse(responseText); // Tenter de parser en JSON
      } catch (jsonError) {
          console.error("Erreur de parsing JSON de la réponse:", jsonError);
          console.error("Réponse brute du serveur:", responseText);
          setFormError(`Erreur inattendue du serveur: ${responseText.substring(0, 100)}... (Voir console pour plus de détails)`);
          setIsSubmitting(false);
          return; // Arrêter ici si la réponse n'est pas un JSON valide
      }
      // --- FIN DÉBOGAGE AMÉLIORÉ ---

      console.log("Réponse du backend après soumission:", responseData); // LOG IMPORTANT

      if (res.ok) {
        setSuccessMessage(editingId ? "Produit modifié avec succès !" : "Produits ajoutés avec succès !");
        fetchProducts(); // Re-fetch all products after successful operation
        resetForm();
        setShowForm(false);
      } else {
        let errorMessage = `Erreur lors de l'enregistrement : ${responseData.error || responseData.message || 'Erreur inconnue.'}`;

        if (responseData.failedProducts && responseData.failedProducts.length > 0) {
          const failedList = responseData.failedProducts.map(
            (fp) => `- IMEI ${fp.imei} : ${fp.error}`
          ).join('\n');
          errorMessage += `\n\nDétails des échecs :\n${failedList}`;
        } else if (responseData.constraint === "products_marque_modele_stockage_type_type_carton_imei_key") {
            errorMessage = "Cette combinaison de produit (Marque, Modèle, Stockage, Type, Qualité Carton, IMEI) existe déjà. Chaque produit doit être unique selon ces critères.";
        }
        // --- LOG SUPPLÉMENTAIRE POUR DÉBOGAGE ---
        console.error("Erreur détaillée du backend:", responseData);
        // --- FIN LOG SUPPLÉMENTAIRE ---
        setFormError(errorMessage);
      }
    } catch (error) {
      console.error("Erreur réseau ou serveur :", error);
      setFormError("Erreur de communication avec le serveur. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    openConfirmModal(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible et ne peut être effectuée que si le produit n'est lié à aucune vente.",
      async () => {
        try {
          // --- MODIFICATION ICI : Utilisation de API_BASE_URL pour l'appel fetch ---
          const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
          // --- FIN DE LA MODIFICATION ---
            method: "DELETE",
          });
          if (res.ok) {
            setSuccessMessage("Produit supprimé avec succès.");
            fetchProducts();
          } else {
            const errorData = await res.json();
            setFormError(`Erreur lors de la suppression : ${errorData.error || 'Erreur inconnue.'}`);
          }
        } catch (error) {
          console.error("Erreur de suppression :", error);
          setFormError("Erreur de communication avec le serveur lors de la suppression.");
        } finally {
          closeConfirmModal();
        }
      }
    );
  };

  const handleEdit = (p) => {
    console.log("Produit sélectionné pour édition (handleEdit):", p); // LOG IMPORTANT
    setForm({
      marque: p.marque,
      modele: p.modele,
      stockage: p.stockage || "",
      type: p.type,
      type_carton: p.type_carton || "",
      imei: p.imei,
      quantite: p.quantite || 1,
      // Formatage pour l'édition : sans décimales si elles sont .00, sinon les afficher
      prix_vente: p.prix_vente !== undefined && p.prix_vente !== null ? parseFloat(p.prix_vente).toFixed(0) : "",
      prix_achat: p.prix_achat !== undefined && p.prix_achat !== null ? parseFloat(p.prix_achat).toFixed(0) : "",
      fournisseur_id: p.fournisseur_id || "",
    });
    setEditingId(p.id);
    setShowForm(true);
    setFormError("");
    setSuccessMessage("");
  };

  const resetForm = () => {
    setForm({
      marque: "",
      modele: "",
      stockage: "",
      type: "",
      type_carton: "",
      imei: "",
      quantite: 1,
      prix_vente: "",
      prix_achat: "",
      fournisseur_id: "",
    });
    setEditingId(null);
    setFormError("");
    setSuccessMessage("");
  };

  const modelesDispo = form.marque ? MODELES[form.marque] || [] : [];

  const filteredProducts = products.filter((p) => {
    // Assure que p.fournisseur_id est un nombre pour la comparaison
    const fournisseurNom = fournisseurs.find(f => f.id === parseInt(p.fournisseur_id, 10))?.nom || p.nom_fournisseur || "Non défini";

    const text = `${p.marque} ${p.modele} ${p.stockage} ${p.type} ${p.type_carton ||
      ""} ${p.imei} ${p.prix_vente || ""} ${fournisseurNom || ""}`.toLowerCase();

    const matchesSearch = searchTerm.toLowerCase().split(' ').every(term => text.includes(term)); // Using searchTerm
    const isActive = p.status === 'active'; // Le filtre clé

    return isActive && matchesSearch;
  });

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans">
      <h1 className="text-3xl font-semibold text-blue-700 mb-6 flex items-center">
        <CubeIcon className="h-8 w-8 text-blue-600 mr-2" />
        Gestion des produits
      </h1>

      <div className="flex items-center space-x-3 mb-4 max-w-md">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Rechercher (marque, modèle, IMEI, fournisseur...)"
          value={searchTerm} // Using searchTerm
          onChange={(e) => setSearchTerm(e.target.value)} // Using setSearchTerm
          className="border border-blue-300 rounded-full px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
        />
      </div>

      <button
        onClick={() => {
          setShowForm(true);
          resetForm();
        }}
        className="mb-6 flex items-center px-5 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Ajouter un produit
      </button>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center justify-between" role="alert">
          <span className="block sm:inline">{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="ml-4 text-green-700 hover:text-green-900">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}
      {formError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center justify-between" role="alert">
          <span className="block sm:inline">{formError}</span>
          <button onClick={() => setFormError("")} className="ml-4 text-red-700 hover:text-red-900">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-2xl shadow-lg max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 border border-blue-200 mb-8"
          autoComplete="off"
        >
          <h2 className="text-2xl font-semibold text-blue-700 mb-4 text-center col-span-full">
            {editingId ? "Modifier un produit" : "Nouveau produit"}
          </h2>

          <div>
            <label htmlFor="marque" className="block text-sm font-medium text-gray-700 mb-1">
              Marque *
            </label>
            <input
              id="marque"
              name="marque"
              list="marques-list"
              placeholder="Choisir une marque"
              value={form.marque}
              onChange={handleChange}
              required
              className="w-full border border-blue-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
            <datalist id="marques-list">
              {MARQUES.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="modele" className="block text-sm font-medium text-gray-700 mb-1">
              Modèle *
            </label>
            <input
              id="modele"
              name="modele"
              list="modeles-list"
              placeholder={
                form.marque
                  ? "Choisir un modèle"
                  : "Sélectionnez d'abord une marque"
              }
              value={form.modele}
              onChange={handleChange}
              required
              disabled={!form.marque}
              className={`w-full border rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none transition ${
                form.marque
                  ? "border-blue-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  : "bg-gray-100 cursor-not-allowed"
              }`}
            />
            <datalist id="modeles-list">
              {modelesDispo.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="stockage" className="block text-sm font-medium text-gray-700 mb-1">
              Stockage *
            </label>
            <input
              id="stockage"
              name="stockage"
              list="stockages-list"
              placeholder="Choisir un stockage"
              value={form.stockage}
              onChange={handleChange}
              required
              className="w-full border border-blue-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
            <datalist id="stockages-list">
              {STOCKAGES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              id="type"
              name="type"
              value={form.type}
              onChange={handleChange}
              required
              className="w-full border border-blue-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            >
              <option value="">Choisir un type</option>
              <option value="CARTON">CARTON</option>
              <option value="ARRIVAGE">ARRIVAGE</option>
            </select>
          </div>

          {form.marque.toLowerCase() === "iphone" && form.type === "CARTON" && (
            <div className="col-span-full">
              <label htmlFor="type_carton" className="block text-sm font-medium text-gray-700 mb-1">
                Qualité du carton *
              </label>
              <select
                id="type_carton"
                name="type_carton"
                value={form.type_carton}
                onChange={handleChange}
                required
                className="w-full border border-blue-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              >
                <option value="">Choisir la qualité</option>
                <option value="GW">GW</option>
                <option value="ORG">ORG</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="NO ACTIVE">NO ACTIVE</option>
              </select>
            </div>
          )}

          <div>
            <label htmlFor="prix_achat" className="block text-sm font-medium text-gray-700 mb-1">
              Prix d'achat (CFA) *
            </label>
            <input
              type="text"
              id="prix_achat"
              name="prix_achat"
              placeholder="Entrer le prix d'achat (ex: 20000)"
              value={form.prix_achat}
              onChange={handleChange}
              required
              className="w-full border border-blue-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="prix_vente" className="block text-sm font-medium text-gray-700 mb-1">
              Prix de vente (CFA) *
            </label>
            <input
              type="text"
              id="prix_vente"
              name="prix_vente"
              placeholder="Entrer le prix de vente (ex: 25000)"
              value={form.prix_vente}
              onChange={handleChange}
              required
              className="w-full border border-blue-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="fournisseur_id" className="block text-sm font-medium text-gray-700 mb-1">
              Fournisseur *
            </label>
            <select
              id="fournisseur_id"
              name="fournisseur_id"
              value={form.fournisseur_id}
              onChange={handleChange}
              required
              className="w-full border border-blue-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            >
              <option value="">Sélectionner un fournisseur</option>
              {fournisseurs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-full">
            <label htmlFor="imei" className="block text-sm font-medium text-gray-700 mb-1">
              IMEI(s) (6 chiffres chacun, séparés par des virgules ou des retours à la ligne) *
            </label>
            {editingId ? (
              <input
                type="text"
                id="imei"
                name="imei"
                placeholder="Entrez l'IMEI (6 chiffres)"
                value={form.imei}
                onChange={handleChange}
                maxLength={6}
                required
                className="w-full border border-blue-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              />
            ) : (
              <textarea
                id="imei"
                name="imei"
                placeholder="Ex: 123456, 789012, 345678"
                value={form.imei}
                onChange={handleChange}
                required
                rows={5}
                className="w-full border border-blue-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              ></textarea>
            )}
          </div>

          {editingId && (
            <div>
              <label htmlFor="quantite" className="block text-sm font-medium text-gray-700 mb-1">
                Quantité *
              </label>
              <input
                type="text"
                id="quantite"
                name="quantite"
                placeholder="Quantité"
                value={form.quantite}
                onChange={handleChange}
                required
                className="w-full border border-blue-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
              />
            </div>
          )}

          <div className="flex justify-center gap-4 mt-4 col-span-full">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`rounded-full px-8 py-3 font-semibold transition ${
                isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Enregistrement..." : (editingId ? "Modifier le produit" : "Ajouter les produits")}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="border border-blue-600 text-blue-600 rounded-full px-8 py-3 font-semibold hover:bg-blue-100 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : filteredProducts.length === 0 ? (
        <p className="text-gray-500">Aucun produit trouvé.</p>
      ) : (
        <div className="bg-white shadow-md rounded-xl overflow-x-auto">
          <table className="min-w-[1200px] divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-700 text-left">
              <tr>
                <th className="px-6 py-3">Marque</th>
                <th className="px-6 py-3">Modèle</th>
                <th className="px-6 py-3">Stockage</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">IMEI</th>
                <th className="px-6 py-3">Quantité</th>
                <th className="px-6 py-3">Prix Achat</th>
                <th className="px-6 py-3">Prix de vente</th>
                <th className="px-6 py-3 whitespace-nowrap">Fournisseur</th>
                <th className="px-6 py-3">Date d'arrivée</th>
                <th className="px-6 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">{p.marque}</td>
                  <td className="px-6 py-4 text-gray-700">{p.modele}</td>
                  <td className="px-6 py-4 text-gray-700">{p.stockage}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {p.type}
                    {p.type === "CARTON" && p.type_carton ? ` (${p.type_carton})` : ""}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{p.imei}</td>
                  <td className="px-6 py-4 text-gray-700">{p.quantite}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {formatNumber(p.prix_achat)}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {formatNumber(p.prix_vente)}
                  </td>
                  <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                    {fournisseurs.find(f => f.id === parseInt(p.fournisseur_id, 10))?.nom || p.nom_fournisseur || "Non défini"}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {p.date_ajout
                      ? new Date(p.date_ajout).toLocaleDateString('fr-FR', {
                          year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' // ✅ MODIFIÉ : Ajout de l'heure et des minutes
                        })
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Modifier"
                    >
                      <PencilIcon className="w-5 h-5 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Supprimer"
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

      {/* Modale de confirmation personnalisée */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{confirmModalContent.title}</h3>
            <p className="text-gray-700 mb-6">{confirmModalContent.message}</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
              >
                Annuler
              </button>
              <button
                onClick={onConfirmAction}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
