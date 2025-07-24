import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Assurez-vous que axios est bien installé et importé si vous l'utilisez ailleurs

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // --- MODIFICATION ICI : Utilisation de la variable d'environnement pour l'URL du backend ---
  // Cette variable est injectée par Vite et Render.
  // Elle sera 'https://choco-backend-api.onrender.com' en production sur Render,
  // et 'http://localhost:3001' en développement local (si vous avez configuré votre .env local).
  const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;
  // --- FIN DE LA MODIFICATION ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Réinitialiser les erreurs précédentes

    try {
      // --- MODIFICATION ICI : Utilisation de API_BASE_URL pour l'appel fetch ---
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      // --- FIN DE LA MODIFICATION ---

      const data = await response.json();

      if (!response.ok) {
        // Gérer les erreurs de réponse du serveur (par exemple, 401 Unauthorized)
        throw new Error(data.error || 'Échec de la connexion');
      }

      // Si la connexion réussit, stocker le token et rediriger
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('fullName', data.fullName);
      navigate('/dashboard'); // Rediriger vers le tableau de bord ou une autre page après connexion

    } catch (err) {
      console.error('Erreur lors de la connexion frontend :', err);
      setError(err.message || 'Erreur lors de la connexion. Veuillez réessayer.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              id="username"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Se connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
