import React, { useState, useEffect } from 'react';
import {
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  PrinterIcon, // Pour le bouton d'impression
  CheckCircleIcon, // Pour les messages de succès
  XCircleIcon, // Pour les messages d'erreur
  XMarkIcon // Pour fermer les messages
} from '@heroicons/react/24/outline';

export default function Liste() {
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' }); // { type: 'success' | 'error', text: '' }
  const [searchTerm, setSearchTerm] = useState('');

  // Obtenir la date du jour formatée
  const getFormattedDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Mois est basé sur 0
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Fonction pour formater les montants en FCFA
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

  // Fonction pour récupérer les données des ventes depuis le backend
  const fetchVentes = async () => {
    setLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const ventesRes = await fetch('http://localhost:3001/api/ventes');
      if (!ventesRes.ok) {
        const errorData = await ventesRes.json();
        throw new Error(errorData.error || 'Échec de la récupération des ventes.');
      }
      const ventesData = await ventesRes.json();
      setVentes(ventesData);
    } catch (error) {
      console.error('Erreur lors du chargement des ventes:', error);
      setStatusMessage({ type: 'error', text: `Erreur lors du chargement de la liste des ventes: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Charger les ventes au montage du composant
  useEffect(() => {
    fetchVentes();
  }, []);

  // Préparer les données pour l'affichage (regroupement par vente)
  const processedVentes = ventes
    .map(vente => {
      // Déterminer si la vente est entièrement payée
      const isFullyPaid = parseFloat(vente.montant_total) <= parseFloat(vente.montant_paye);

      // Déterminer si tous les articles de la vente sont annulés
      const allItemsCancelled = vente.articles.every(item => item.statut_vente === 'annule');

      return {
        vente_id: vente.vente_id,
        date_vente: vente.date_vente, // Conserver la date de vente
        client_nom: vente.client_nom,
        client_telephone: vente.client_telephone || 'N/A',
        montant_total_vente: vente.montant_total,
        montant_paye_vente: vente.montant_paye,
        reste_a_payer_vente: Math.max(0, parseFloat(vente.montant_total) - parseFloat(vente.montant_paye)),
        articles: vente.articles,
        observation: vente.observation || '', // Garder observation si elle est utilisée ailleurs, sinon elle peut être retirée
        isFullyPaid: isFullyPaid,
        allItemsCancelled: allItemsCancelled,
        statut_paiement_vente: vente.statut_paiement,
        is_facture_speciale: vente.is_facture_speciale, // Assurez-vous que cette propriété est disponible
      };
    })
    // N'affiche que les ventes dont le statut de paiement est 'en_attente_paiement' ou 'paiement_partiel'
    // ET qui ne sont PAS des factures spéciales
    .filter(vente =>
      (vente.statut_paiement_vente === 'en_attente_paiement' ||
       vente.statut_paiement_vente === 'paiement_partiel') &&
      !vente.is_facture_speciale // Exclure les factures spéciales
    );

  // Filtrer et trier les ventes traitées
  const filteredAndSortedVentes = processedVentes
    .filter(vente => {
      const searchLower = searchTerm.toLowerCase();
      const clientMatch = vente.client_nom.toLowerCase().includes(searchLower);
      const telMatch = vente.client_telephone.toLowerCase().includes(searchLower);
      const articlesMatch = vente.articles.some(item =>
        item.marque.toLowerCase().includes(searchLower) ||
        item.modele.toLowerCase().includes(searchLower) ||
        (item.imei && item.imei.toLowerCase().includes(searchLower))
      );
      return clientMatch || telMatch || articlesMatch;
    })
    .sort((a, b) => a.client_nom.localeCompare(b.client_nom));

  // Fonction pour gérer l'impression de la liste
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="printableContent" className="p-4 max-w-full mx-auto font-sans bg-gray-50 rounded-xl shadow border border-gray-200">
      {/* Styles pour l'impression */}
      <style>
        {`
        @media print {
          body * { /* Masquer tout le contenu du corps par défaut */
            visibility: hidden;
          }
          #printableContent, #printableContent * { /* Rendre visible le conteneur imprimable et ses enfants */
            visibility: visible;
          }
          #printableContent { /* Réinitialiser le style du conteneur imprimable */
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: none;
            box-shadow: none;
            border: none;
          }
          /* Masquer les éléments spécifiques à l'intérieur du conteneur imprimable */
          .no-print, .print-hidden {
            display: none !important;
          }
          /* Masquer l'overlay de développement de Vite ou d'autres outils */
          #vite-error-overlay, #react-devtools-content {
            display: none !important;
          }
          /* Assurer que le tableau est entièrement visible et s'adapte */
          .overflow-x-auto {
            overflow-x: visible !important;
          }
          .min-w-\\[1200px\\] {
            min-width: unset !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            font-size: 9pt;
          }
          /* Ajuster la taille de la police du corps et des titres pour l'impression */
          body {
            font-size: 10pt;
          }
          .print-header { /* Pour le titre de la liste des ventes */
            display: block !important;
            text-align: center;
            margin-bottom: 20px;
            font-size: 18pt;
            font-weight: bold;
            color: #333;
          }
        }
        `}
      </style>

      {/* Ajout de la classe print-header pour le titre et print-container pour le conteneur principal */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center flex items-center justify-center print-header">
        <ShoppingCartIcon className="h-6 w-6 text-gray-600 mr-2 print-hidden" />
        LISTE DES DETTES {getFormattedDate()}
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

      {/* Champ de recherche */}
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

      {/* Bouton Imprimer */}
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
        <p className="text-gray-500 text-center text-sm">Chargement de la liste des ventes...</p>
      ) : filteredAndSortedVentes.length === 0 ? (
        <p className="text-gray-500 text-center text-sm">Aucune vente trouvée correspondant à votre recherche ou aux critères de filtre.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            <table className="table-auto w-full text-xs divide-y divide-gray-200">
              <thead className="bg-gray-100 text-gray-700 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">NOM</th>
                  <th className="px-3 py-2 font-medium">ARTICLE</th>
                  <th className="px-3 py-2 font-medium text-right">PRIX UNIT.</th>
                  <th className="px-3 py-2 font-medium text-right">MTE PAYER</th>
                  <th className="px-3 py-2 font-medium text-right">RESTE</th>
                  <th className="px-3 py-2 font-medium">DATE DE SORTIE</th> {/* MODIFIÉ : Nouvelle en-tête de colonne */}
                  <th className="px-3 py-2 font-medium">TEL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSortedVentes.map((vente) => (
                  <tr key={vente.vente_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900 font-medium">{vente.client_nom}</td>
                    <td className="px-3 py-2 text-gray-700">
                      {/* Affichage des articles sur une seule ligne */}
                      {vente.articles.map((item, itemIndex) => (
                        <span key={item.item_id}>
                          {item.marque} {item.modele} ({item.stockage || 'N/A'})
                          {item.type && ` ${item.type}`}
                          {item.type_carton && ` ${item.type_carton}`}
                          {item.statut_vente === 'annule' && <span className="text-orange-500 ml-1">(Annulé)</span>}
                          {itemIndex < vente.articles.length - 1 && <br />}
                        </span>
                      ))}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">
                      {/* Affichage du prix unitaire */}
                      {vente.articles.map((item, itemIndex) => (
                        <span key={item.item_id}>
                          {formatCFA(item.prix_unitaire_vente)}
                          {itemIndex < vente.articles.length - 1 && <br />}
                        </span>
                      ))}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatCFA(vente.montant_paye_vente)}</td>
                    <td className="px-3 py-2 text-right text-red-600 font-semibold">{formatCFA(vente.reste_a_payer_vente)}</td>
                    <td className="px-3 py-2 text-gray-700">
                      {/* MODIFIÉ : Affichage de la date de vente formatée */}
                      {(() => {
                        const date = new Date(vente.date_vente);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0'); // Mois est basé sur 0
                        const year = date.getFullYear();
                        return `${day}-${month}-${year}`;
                      })()}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{vente.client_telephone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
