// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  ShoppingCartIcon,
  CubeIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  Bars3Icon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  DevicePhoneMobileIcon,
  TruckIcon,
  ArrowsRightLeftIcon,
  CurrencyDollarIcon, // Icône pour les bénéfices
  ListBulletIcon,
  ClipboardDocumentListIcon, // NOUVEL IMPORT : Icône pour les commandes spéciales
  MoonIcon, // NOUVEL IMPORT : Icône pour le mode sombre
  SunIcon // NOUVEL IMPORT : Icône pour le mode clair
} from '@heroicons/react/24/outline';

// Importez vos composants de section ici avec les chemins corrects
import Clients from './Clients.jsx';
import Products from './Products.jsx';
import NouvelleVente from './NouvelleVentes.jsx';
import Sorties from './Sorties.jsx';
import Liste from './Listes.jsx';
import Rapport from './Rapport.jsx';
import Accueil from './Accueil.jsx';
import RetoursMobiles from './RetoursMobiles.jsx';
import RemplacementsFournisseur from './RemplacementsFournisseur.jsx';
import Recherche from './Recherche.jsx';
import Fournisseurs from './Fournisseurs.jsx';
import Factures from './Factures.jsx';
import Benefices from '../pages/Benefices.jsx';
import SpecialOrders from '../pages/SpecialOrders.jsx'; // NOUVEL IMPORT : Le composant des commandes spéciales

// Import the logo image
import logo from '../assets/logo.png'; // Adjust this path if your logo is elsewhere, e.g., '/logo.png' if in 'public'

const sections = [
  { name: 'Produits', icon: CubeIcon },
  { name: 'Vente', icon: PlusCircleIcon },
  { name: 'Sorties', icon: ClockIcon },
  { name: 'Factures', icon: DocumentTextIcon },
  { name: 'Recherche', icon: MagnifyingGlassIcon },
  { name: 'Bénéfices', icon: CurrencyDollarIcon },
  { name: 'Dettes', icon: Bars3Icon },
  { name: 'Rapport', icon: ChartBarIcon },
  { name: 'Clients', icon: UserGroupIcon },
  { name: 'Retour mobile', icon: ArrowLeftIcon },
  { name: 'Liste Fournisseurs', icon: TruckIcon },
  { name: 'Rtrs Fournisseur', icon: ArrowsRightLeftIcon },
  //{ name: 'Achat', icon: ClipboardDocumentListIcon } // RENOMMÉ ET DÉPLACÉ EN DERNIER
];

export default function Dashboard() {
  // Initialisation de l'état 'active' en lisant depuis localStorage
  const [active, setActive] = useState(() => {
    const savedSection = localStorage.getItem('activeSection');
    return savedSection || 'Accueil'; // Si rien n'est sauvegardé, par défaut 'Accueil'
  });
  const [displayedName, setDisplayedName] = useState('');
  // État pour le mode sombre, initialisé depuis localStorage ou les préférences système
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  const navigate = useNavigate();

  useEffect(() => {
    // Logique pour le nom d'utilisateur
    const storedFullName = localStorage.getItem('fullName');
    const storedUsername = localStorage.getItem('username');

    if (storedFullName) {
      setDisplayedName(storedFullName);
    } else if (storedUsername) {
      setDisplayedName(storedUsername);
    } else {
      navigate('/');
    }

    // Applique ou retire la classe 'dark' sur l'élément <html>
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [navigate, isDarkMode]); // Dépendance à isDarkMode pour réagir aux changements de thème

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('fullName');
    localStorage.removeItem('username');
    localStorage.removeItem('activeSection'); // Nettoyer aussi la section active
    localStorage.removeItem('theme'); // Nettoyer aussi le thème
    navigate('/');
  };

  // Fonction pour basculer le mode sombre
  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode); // Inverse l'état
    localStorage.setItem('theme', isDarkMode ? 'light' : 'dark'); // Sauvegarde la préférence
  };

  const renderSection = () => {
    switch (active) {
      case 'Clients':
        return <Clients />;
      case 'Produits':
        return <Products />;
      case 'Vente':
        return <NouvelleVente />;
      case 'Sorties':
        return <Sorties />;
      case 'Recherche':
        return <Recherche />;
      case 'Factures':
       return <Factures />;
      case 'Bénéfices':
        return <Benefices />;
      case 'Achat': // MIS À JOUR : Le cas doit correspondre au nouveau nom
        return <SpecialOrders />;
      case 'Retour mobile':
        return <RetoursMobiles />;
      case 'Liste Fournisseurs':
        return <Fournisseurs />;
      case 'Rtrs Fournisseur':
        return <RemplacementsFournisseur />;
      case 'Dettes':
        return <Liste />;
      case 'Rapport':
        return <Rapport />;
      case 'Accueil':
        return <Accueil />;
      default:
        return <Accueil />;
    }
  };

  return (
    // Application des classes dark: pour le mode sombre sur le conteneur principal
    <div className="flex flex-col min-h-screen bg-blue-50 text-blue-900 font-sans dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
      <header className="flex justify-between items-center bg-white shadow-md p-4 sticky top-0 z-10 dark:bg-gray-800 dark:text-gray-100 transition-colors duration-300">
        <div className="flex items-center">
          <img src={logo} alt="NIANGADOU ELECTRO Logo" className="h-10 w-10 mr-2" />
          <h1 className="text-2xl font-semibold text-blue-700 mr-4 dark:text-white transition-colors duration-300">ETS YATTASSAYE ELECTRONIQUE</h1>
        </div>

        {displayedName && (
          <div className="flex items-center space-x-4">
            <p className="text-lg text-blue-800 dark:text-gray-200">
              Bienvenue, <span className="font-bold">{displayedName}</span>!
            </p>
            
            {/* Bouton pour basculer le mode sombre */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-blue-700 hover:bg-blue-100 dark:text-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={isDarkMode ? "Passer en mode clair" : "Passer en mode sombre"}
            >
              {isDarkMode ? (
                <SunIcon className="h-6 w-6" /> // Icône soleil en mode sombre
              ) : (
                <MoonIcon className="h-6 w-6" /> // Icône lune en mode clair
              )}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors dark:bg-red-900 dark:text-white dark:hover:bg-red-800"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              Se déconnecter
            </button>
          </div>
        )}
      </header>

      <div className="flex flex-grow">
        <nav className="w-64 bg-white shadow-lg flex flex-col p-6 dark:bg-gray-800 dark:text-gray-100 transition-colors duration-300">
          <ul className="flex flex-col space-y-4">
            <li>
              <button
                onClick={() => {
                  setActive('Accueil');
                  localStorage.setItem('activeSection', 'Accueil'); // Sauvegarde la section
                }}
                className={`flex items-center w-full p-3 rounded-lg transition-colors
                  ${active === 'Accueil'
                    ? 'bg-blue-200 text-blue-900 font-semibold shadow dark:bg-blue-800 dark:text-white'
                    : 'text-blue-700 hover:bg-blue-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
              >
                <HomeIcon className="h-6 w-6 mr-3" />
                Accueil
              </button>
            </li>
            {sections.map(({ name, icon: Icon }) => (
              <li key={name}>
                <button
                  onClick={() => {
                    setActive(name);
                    localStorage.setItem('activeSection', name); // Sauvegarde la section
                  }}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors
                    ${active === name
                      ? 'bg-blue-200 text-blue-900 font-semibold shadow dark:bg-blue-800 dark:text-white'
                      : 'text-blue-700 hover:bg-blue-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                >
                  <Icon className="h-6 w-6 mr-3" />
                  {name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-grow p-10">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">
            {active}
          </h2>
          <div className="bg-white rounded-xl shadow p-6 min-h-[400px] dark:bg-gray-700 dark:text-gray-100">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
