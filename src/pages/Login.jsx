// Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Nouvel état pour le chargement du bouton
  const navigate = useNavigate();

  // --- MODIFICATION ICI : Utilisation de la variable d'environnement pour l'URL du backend ---
  // Cette variable est injectée par Vite et Render.
  // Elle sera 'https://choco-backend-api.onrender.com' en production sur Render,
  // et 'http://localhost:3001' en développement local (si vous avez configuré votre .env local).
  const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;
  // --- FIN DE LA MODIFICATION ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoggingIn(true); // Début du chargement

    try {
      // --- MODIFICATION ICI : Utilisation de API_BASE_URL pour l'appel fetch ---
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      // --- FIN DE LA MODIFICATION ---

      const data = await res.json(); // Récupérez les données de la réponse JSON

      if (res.ok) {
        localStorage.setItem('token', data.token);
        // STOCKER ICI LE NOM COMPLET ET LE NOM D'UTILISATEUR
        localStorage.setItem('fullName', data.fullName); // data.fullName vient du backend
        localStorage.setItem('username', data.username); // data.username vient du backend (fallback si fullName est vide)
        navigate('/dashboard');
      } else {
        setMessage(`❌ ${data.error || data.message || 'Erreur inconnue'}`);
      }
    } catch (err) {
      console.error('Erreur lors de la connexion frontend :', err);
      setMessage('❌ Erreur serveur');
    } finally {
      setIsLoggingIn(false); // Fin du chargement
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <div className="bg-white border border-blue-500/20 shadow-lg p-10 max-w-md w-full rounded-2xl">

        <div className="flex justify-center mb-4">
          <img
            src="/logo.png"
            alt="Logo Van Choco"
            className="w-20 h-20 rounded-full object-cover shadow"
          />
        </div>

        <h2 className="text-center text-2xl font-light text-blue-700 mb-6">
          Connexion 
        </h2>

        {message && (
          <div className="mb-4 text-sm text-blue-600 text-center">{message}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Nom d’utilisateur
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-full hover:bg-blue-700 transition"
            disabled={isLoggingIn} // Désactiver le bouton pendant le chargement
          >
            {isLoggingIn ? 'Connexion en cours...' : 'Se connecter'} {/* Texte dynamique du bouton */}
          </button>
        </form>
      </div>
    </div>
  );
}
