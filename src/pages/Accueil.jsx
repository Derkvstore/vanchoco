import React, { useState, useEffect } from 'react';
import {
  DevicePhoneMobileIcon,
  TruckIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ClockIcon,
  ArrowLeftIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function Accueil() {
  const [dashboardStats, setDashboardStats] = useState({
    totalCartons: 0,
    totalArrivage: 0,
    totalVentes: 0,
    totalReturned: 0,
    totalSentToSupplier: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('fr-FR', options);
  };

  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const response = await fetch('http://localhost:3001/api/reports/dashboard-stats');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de la récupération des statistiques du tableau de bord.');
      }
      const data = await response.json();
      setDashboardStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques du tableau de bord:', error);
      setStatsError(`Erreur: ${error.message}`);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();

    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased text-gray-800 py-12 px-6 lg:px-8">
      <style>
        {`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .apple-card {
          box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05);
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .apple-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08);
        }
        `}
      </style>

      <div className="animate-fadeInUp max-w-7xl mx-auto">
        {/* Main Title - Gestion Stock Van Choco */}
        {/* <h1 className="text-4xl font-extrabold text-center mb-12 text-gray-900 tracking-tight">
          Gestion Stock Van Choco
        </h1> */}

        {/* Date and Time Section */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-12">
          <div className="apple-card bg-white rounded-xl p-5 flex items-center space-x-4 border border-gray-100">
            <CalendarDaysIcon className="h-7 w-7 text-indigo-500" />
            <div>
              <p className="text-sm text-gray-500">Nous sommes le</p>
              <p className="text-lg font-semibold text-gray-800">{getFormattedDate()}</p>
            </div>
          </div>
          <div className="apple-card bg-white rounded-xl p-5 flex items-center space-x-4 border border-gray-100">
            <ClockIcon className="h-7 w-7 text-indigo-500" />
            <div>
              <p className="text-sm text-gray-500">Heure Actuelle</p>
              <p className="text-lg font-semibold text-gray-800">{formatTime(currentTime)}</p>
            </div>
          </div>
        </div>

        {/* <h2 className="text-2xl font-semibold text-gray-800 text-center mb-10">
          Statistiques de l'Inventaire des Mobiles
        </h2> */}

        {statsLoading ? (
          <p className="text-gray-600 text-center text-lg">Chargement des statistiques...</p>
        ) : statsError ? (
          <p className="text-red-600 text-center text-lg">{statsError}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-full mx-auto">
            {/* Card for Mobiles en Carton */}
            <div className="apple-card bg-white rounded-xl p-6 flex flex-col items-center justify-center text-center border border-gray-100">
              <DevicePhoneMobileIcon className="h-10 w-10 text-blue-500 mb-3" />
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalCartons}</p>
              <p className="text-md text-gray-600 mt-1">CARTONS</p>
            </div>

            {/* Card for Mobiles en Arrivage */}
            <div className="apple-card bg-white rounded-xl p-6 flex flex-col items-center justify-center text-center border border-gray-100">
             <DevicePhoneMobileIcon className="h-10 w-10 text-blue-500 mb-3" />
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalArrivage}</p>
              <p className="text-md text-gray-600 mt-1"> ARRIVAGES</p>
            </div>


            {/* Card for Mobiles Retournés */}
            <div className="apple-card bg-white rounded-xl p-6 flex flex-col items-center justify-center text-center border border-gray-100">
              <ArrowLeftIcon className="h-10 w-10 text-red-500 mb-3" />
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalReturned}</p>
              <p className="text-md text-gray-600 mt-1">Retour Remplacés</p>
            </div>

                 {/* Card for Mobiles Vendus */}
            <div className="apple-card bg-white rounded-xl p-6 flex flex-col items-center justify-center text-center border border-gray-100">
              <CurrencyDollarIcon className="h-10 w-10 text-purple-500 mb-3" />
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalVentes}</p>
              <p className="text-md text-gray-600 mt-1">Mobiles Vendus</p>
            </div>


            {/* Card for Mobiles Envoyés au Fournisseur */}
            <div className="apple-card bg-white rounded-xl p-6 flex flex-col items-center justify-center text-center border border-gray-100">
              <ArrowPathIcon className="h-10 w-10 text-orange-500 mb-3" />
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalSentToSupplier}</p>
              <p className="text-md text-gray-600 mt-1">Envoyés Fournisseur</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}