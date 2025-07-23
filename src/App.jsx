import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Products from "./pages/Products";
// L'ancien Ventes.jsx n'est plus utilisé directement comme page routée.
// Il est maintenant divisé en NouvelleVente.jsx et Sorties.jsx, gérés par Dashboard.

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/products" element={<Products />} />
        {/* La route /ventes n'est plus nécessaire car la gestion des ventes est intégrée au Dashboard */}
      </Routes>
    </Router>
  );
}
