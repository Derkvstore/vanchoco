// frontend/src/components/Fournisseurs.jsx
import React, { useEffect, useState } from "react";
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Fournisseurs() {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nom: "",
    telephone: "",
    adresse: "",
  });
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États pour la modale de confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalContent, setConfirmModalContent] = useState({ title: "", message: "" });
  const [onConfirmAction, setOnConfirmAction] = useState(null);

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

  const fetchFournisseurs = () => {
    setLoading(true);
    setFormError("");
    setSuccessMessage("");
    fetch("http://localhost:3001/api/fournisseurs")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Erreur réseau lors de la récupération des fournisseurs.");
        }
        return res.json();
      })
      .then((data) => {
        setFournisseurs(data);
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des fournisseurs :", error);
        setFormError("Impossible de charger les fournisseurs. Veuillez réessayer plus tard.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFournisseurs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
    setFormError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    if (!form.nom) {
      setFormError("Le nom du fournisseur est obligatoire.");
      setIsSubmitting(false);
      return;
    }

    let url = "http://localhost:3001/api/fournisseurs";
    let method = "POST";

    if (editingId) {
      url = `${url}/${editingId}`;
      method = "PUT";
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const responseData = await res.json();

      if (res.ok) {
        setSuccessMessage(editingId ? "Fournisseur modifié avec succès !" : "Fournisseur ajouté avec succès !");
        fetchFournisseurs();
        resetForm();
        setShowForm(false);
      } else {
        setFormError(`Erreur lors de l'enregistrement : ${responseData.error || 'Erreur inconnue.'}`);
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
      "Êtes-vous sûr de vouloir supprimer ce fournisseur ? Cette action est irréversible et ne peut être effectuée que si aucun produit n'est lié à lui.",
      async () => {
        try {
          const res = await fetch(`http://localhost:3001/api/fournisseurs/${id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            setSuccessMessage("Fournisseur supprimé avec succès.");
            fetchFournisseurs();
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

  const handleEdit = (f) => {
    setForm({
      nom: f.nom,
      telephone: f.telephone || "",
      adresse: f.adresse || "",
    });
    setEditingId(f.id);
    setShowForm(true);
    setFormError("");
    setSuccessMessage("");
  };

  const resetForm = () => {
    setForm({
      nom: "",
      telephone: "",
      adresse: "",
    });
    setEditingId(null);
    setFormError("");
    setSuccessMessage("");
  };

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans">
      <h1 className="text-3xl font-semibold text-blue-700 mb-6 flex items-center">
        <BuildingOfficeIcon className="h-8 w-8 text-blue-600 mr-2" />
        Gestion des fournisseurs
      </h1>

      <button
        onClick={() => {
          setShowForm(true);
          resetForm();
        }}
        className="mb-6 flex items-center px-5 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Ajouter un fournisseur
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
          className="bg-white p-6 rounded-2xl shadow-lg max-w-2xl mx-auto grid grid-cols-1 gap-6 border border-blue-200 mb-8"
          autoComplete="off"
        >
          <h2 className="text-2xl font-semibold text-blue-700 mb-4 text-center col-span-full">
            {editingId ? "Modifier le fournisseur" : "Nouveau fournisseur"}
          </h2>

          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
              Nom du fournisseur *
            </label>
            <input
              type="text"
              id="nom"
              name="nom"
              placeholder="Nom du fournisseur"
              value={form.nom}
              onChange={handleChange}
              required
              className="w-full border border-blue-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="text"
              id="telephone"
              name="telephone"
              placeholder="Numéro de téléphone"
              value={form.telephone}
              onChange={handleChange}
              className="w-full border border-blue-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="adresse" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <textarea
              id="adresse"
              name="adresse"
              placeholder="Adresse du fournisseur"
              value={form.adresse}
              onChange={handleChange}
              rows={3}
              className="w-full border border-blue-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            ></textarea>
          </div>

          <div className="flex justify-center gap-4 mt-4 col-span-full">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`rounded-full px-8 py-3 font-semibold transition ${
                isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Enregistrement..." : (editingId ? "Modifier le fournisseur" : "Ajouter le fournisseur")}
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
        <p className="text-gray-500">Chargement des fournisseurs...</p>
      ) : fournisseurs.length === 0 ? (
        <p className="text-gray-500">Aucun fournisseur trouvé.</p>
      ) : (
        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-700 text-left">
              <tr>
                <th className="px-6 py-3">Nom</th>
                <th className="px-6 py-3">Téléphone</th>
                <th className="px-6 py-3">Adresse</th>
                <th className="px-6 py-3">Date d'ajout</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fournisseurs.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{f.nom}</td>
                  <td className="px-6 py-4 text-gray-700">{f.telephone || "N/A"}</td>
                  <td className="px-6 py-4 text-gray-700">{f.adresse || "N/A"}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {f.date_ajout
                      ? new Date(f.date_ajout).toLocaleDateString('fr-FR', {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(f)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Modifier"
                    >
                      <PencilIcon className="w-5 h-5 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(f.id)}
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