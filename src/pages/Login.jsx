// Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

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
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <div className="bg-white border border-blue-500/20 shadow-lg p-10 max-w-md w-full rounded-2xl">

        <div className="flex justify-center mb-4">
          <img
            src="/logo.png"
            alt="Logo Derkv"
            className="w-20 h-20 rounded-full object-cover shadow"
          />
        </div>

        {/* <h2 className="text-center text-2xl font-light text-blue-700 mb-6">
          Connexion I STORE VAN CHOCO
        </h2> */}

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
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}