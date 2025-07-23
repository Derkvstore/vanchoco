// // frontend/src/components/VentesList.jsx
// import React, { useEffect, useState } from 'react'; // Corrected syntax: '=>' changed to 'from'
// import axios from 'axios'; // This is the line causing the error if axios is not installed
// import { XMarkIcon, TruckIcon } from '@heroicons/react/24/outline'; // For message icons

// export default function VentesList() {
//   const [ventes, setVentes] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [successMessage, setSuccessMessage] = useState("");

//   useEffect(() => {
//     const fetchVentes = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const response = await axios.get('http://localhost:3001/api/ventes'); // Make sure this URL is correct
//         setVentes(response.data);
//       } catch (err) {
//         console.error("Erreur lors de la récupération des ventes:", err);
//         setError("Impossible de charger les ventes. Veuillez réessayer plus tard. " + (err.response?.data?.error || err.message));
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchVentes();
//   }, []);

//   // Function to format amounts without decimals
//   const formatAmount = (amount) => {
//     if (amount === undefined || amount === null) return 'N/A';
//     return parseFloat(amount).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
//   };

//   // Function to format date
//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleDateString('fr-FR', {
//       year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
//     });
//   };

//   if (loading) {
//     return <p className="text-gray-500">Chargement des ventes...</p>;
//   }

//   if (error) {
//     return (
//       <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center justify-between" role="alert">
//         <span className="block sm:inline">{error}</span>
//         <button onClick={() => setError(null)} className="ml-4 text-red-700 hover:text-red-900">
//           <XMarkIcon className="h-5 w-5" />
//         </button>
//       </div>
//     );
//   }

//   if (ventes.length === 0) {
//     return <p className="text-gray-500">Aucune vente enregistrée pour le moment.</p>;
//   }

//   return (
//     <div className="p-4 bg-white rounded-xl shadow">
//       {successMessage && (
//         <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center justify-between" role="alert">
//           <span className="block sm:inline">{successMessage}</span>
//           <button onClick={() => setSuccessMessage("")} className="ml-4 text-green-700 hover:text-green-900">
//             <XMarkIcon className="h-5 w-5" />
//           </button>
//         </div>
//       )}

//       <h3 className="text-2xl font-semibold text-blue-700 mb-4">Historique des Ventes</h3>
      
//       <div className="overflow-x-auto"> {/* Allows horizontal scrolling if the table is too wide */}
//         <table className="min-w-full divide-y divide-gray-200 text-sm">
//           <thead className="bg-gray-50 text-gray-700 text-left">
//             <tr>
//               <th className="px-4 py-2 whitespace-nowrap">ID Vente</th>
//               <th className="px-4 py-2 whitespace-nowrap">Date Vente</th>
//               <th className="px-4 py-2 whitespace-nowrap">Client</th>
//               <th className="px-4 py-2 whitespace-nowrap">Téléphone Client</th>
//               <th className="px-4 py-2 whitespace-nowrap">Montant Total</th>
//               <th className="px-4 py-2 whitespace-nowrap">Montant Payé</th>
//               <th className="px-4 py-2 whitespace-nowrap">Statut Paiement</th>
//               <th className="px-4 py-2 whitespace-nowrap">Détails Articles</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-100">
//             {ventes.map((vente) => (
//               <React.Fragment key={vente.vente_id}>
//                 <tr className="bg-blue-50 hover:bg-blue-100 transition-colors">
//                   <td className="px-4 py-2 font-medium text-blue-900">{vente.vente_id}</td>
//                   <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{formatDate(vente.date_vente)}</td>
//                   <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{vente.client_nom}</td>
//                   <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{vente.client_telephone || 'N/A'}</td>
//                   <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{formatAmount(vente.montant_total)}</td>
//                   <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{formatAmount(vente.montant_paye)}</td>
//                   <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
//                     <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
//                       vente.statut_paiement === 'payee_integralement' ? 'bg-green-100 text-green-800' :
//                       vente.statut_paiement === 'paiement_partiel' ? 'bg-yellow-100 text-yellow-800' :
//                       'bg-red-100 text-red-800'
//                     }`}>
//                       {vente.statut_paiement.replace(/_/g, ' ')}
//                     </span>
//                   </td>
//                   <td className="px-4 py-2 text-gray-700">
//                     {/* This cell is empty because article details will be in the next row */}
//                   </td>
//                 </tr>
//                 {/* Row for sold item details */}
//                 <tr>
//                   <td colSpan="8" className="p-0 border-b border-gray-200">
//                     <div className="bg-gray-50 p-3">
//                       <h5 className="font-semibold text-gray-800 mb-2">Détails des articles de la vente {vente.vente_id}:</h5>
//                       <ul className="list-disc list-inside text-gray-700 text-xs space-y-1">
//                         {vente.articles && vente.articles.length > 0 ? (
//                           vente.articles.map((item) => (
//                             <li key={item.item_id}>
//                               <span className="font-medium">{item.marque} {item.modele} ({item.stockage})</span> - IMEI: {item.imei}
//                               <br />
//                               Prix Vente: {formatAmount(item.prix_unitaire_vente)} |
//                               Prix Achat: {formatAmount(item.prix_unitaire_achat)} |
//                               <span className="font-bold text-green-700"> Bénéfice: {formatAmount(item.benefice_item)}</span>
//                               <br />
//                               Quantité: {item.quantite_vendue} | Statut Article: {item.statut_vente}
//                             </li>
//                           ))
//                         ) : (
//                           <li>Aucun article pour cette vente.</li>
//                         )}
//                       </ul>
//                     </div>
//                   </td>
//                 </tr>
//               </React.Fragment>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
