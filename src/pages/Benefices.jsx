import React, { useState, useEffect } from 'react';
import { CurrencyDollarIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Benefices() {
  const [soldItems, setSoldItems] = useState([]);
  const [totalBeneficeGlobal, setTotalBeneficeGlobal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(''); // État pour la date sélectionnée

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

  const fetchBenefices = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE_URL}/api/benefices`;
      if (selectedDate) {
        url += `?date=${selectedDate}`; // Ajoute le paramètre de date si une date est sélectionnée
      }

      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Échec de la récupération des bénéfices.');
      }
      const data = await res.json();
      setSoldItems(data.sold_items);
      setTotalBeneficeGlobal(data.total_benefice_global);
    } catch (err) {
      console.error('Erreur lors du chargement des bénéfices:', err);
      setError(`Impossible de charger les bénéfices: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenefices();
  }, [selectedDate]); // Re-déclenche la récupération des données lorsque la date sélectionnée change

  const getStatusColor = (status) => {
    switch (status) {
      case 'actif': return 'bg-green-100 text-green-800';
      case 'annule': return 'bg-red-100 text-red-800';
      case 'retourne': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8 font-sans bg-gray-50 rounded-3xl shadow-xl border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center">
        <CurrencyDollarIcon className="h-7 w-7 text-green-600 mr-2" />
        Détail et Total des Bénéfices
      </h2>

      {/* Champ de sélection de date stylisé */}
      <div className="mb-6 flex justify-center items-center space-x-3">
        <label htmlFor="saleDate" className="text-gray-700 font-semibold">Filtrer par date de vente :</label>
        <input
          type="date"
          id="saleDate"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          // Styles Tailwind CSS pour un look plus moderne et "Apple-like"
          className="border border-blue-200 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition duration-200 shadow-sm
                     appearance-none bg-white hover:border-blue-300"
        />
        {selectedDate && (
          <button
            onClick={() => setSelectedDate('')} // Bouton pour effacer le filtre de date
            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition"
            title="Effacer le filtre de date"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {loading && <p className="text-center text-gray-600">Calcul des bénéfices en cours...</p>}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-center" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Affichage du bénéfice total global */}
      {totalBeneficeGlobal !== null && !loading && !error && (
        <div className="text-center mt-4 mb-8 p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 text-blue-800 rounded-xl shadow-lg">
          <p className="text-xl font-semibold">Bénéfice Total Global {selectedDate ? `pour le ${formatDate(selectedDate).split(' ')[0]}` : ''} :</p>
          <p className="text-5xl font-extrabold mt-2 text-green-700">
            {formatCFA(totalBeneficeGlobal)}
          </p>
        </div>
      )}

      {/* Affichage de la table des produits vendus */}
      {!loading && !error && soldItems.length > 0 && (
        <div className="overflow-x-auto mt-8 bg-white rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-700 p-4 border-b border-gray-200">Détail des produits vendus :</h3>
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-blue-50 text-blue-700">
              <tr>
                <th className="py-3 px-4 text-left font-semibold uppercase">Modèle</th>
                <th className="py-3 px-4 text-left font-semibold uppercase">Stockage</th>
                <th className="py-3 px-4 text-left font-semibold uppercase">Type</th>
                <th className="py-3 px-4 text-left font-semibold uppercase">Type Carton</th>
                <th className="py-3 px-4 text-left font-semibold uppercase">IMEI</th>
                <th className="py-3 px-4 text-right font-semibold uppercase">Prix Achat</th>
                <th className="py-3 px-4 text-right font-semibold uppercase">Prix Vente Négocié</th>
                <th className="py-3 px-4 text-right font-semibold uppercase">Qté</th>
                <th className="py-3 px-4 text-left font-semibold uppercase">Date Vente</th>
                <th className="py-3 px-4 text-center font-semibold uppercase">Statut Article</th> {/* Nouvelle colonne */}
                <th className="py-3 px-4 text-right font-semibold uppercase">Montant Remboursé</th> {/* Nouvelle colonne */}
                <th className="py-3 px-4 text-right font-semibold uppercase">Bénéfice Unitaire</th>
                <th className="py-3 px-4 text-right font-semibold uppercase">Bénéfice Total Ligne</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {soldItems.map((item) => (
                <tr key={item.vente_item_id} className="hover:bg-blue-50 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">{item.modele}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{item.stockage || 'N/A'}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{item.type}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{item.type_carton || 'N/A'}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{item.imei}</td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">{formatCFA(item.prix_unitaire_achat)}</td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {formatCFA(item.quantite_vendue > 0 ? item.proportional_revenue / item.quantite_vendue : 0)}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">{item.quantite_vendue}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{formatDate(item.date_vente)}</td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${getStatusColor(item.statut_vente)}`}>
                      {item.statut_vente.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">{formatCFA(item.montant_rembourse_item)}</td>
                  <td className="py-3 px-4 text-right whitespace-nowrap font-medium text-green-700">
                    {formatCFA(item.benefice_unitaire_produit)}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-green-800">
                    {formatCFA(item.benefice_total_par_ligne)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && soldItems.length === 0 && (
        <p className="text-center text-gray-600 mt-8">
          {selectedDate
            ? `Aucun produit vendu avec un statut actif et une facture payée intégralement pour le ${formatDate(selectedDate).split(' ')[0]}.`
            : "Aucun produit vendu avec un statut actif et une facture payée intégralement pour le moment."
          }
        </p>
      )}
    </div>
  );
}
