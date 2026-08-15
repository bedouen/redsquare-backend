import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import {
  FaMobileAlt,
  FaCreditCard,
  FaPlus,
  FaTrash,
  FaCheck,
  FaSpinner,
  FaPhone,
  FaUser,
  FaCalendarAlt,
  FaLock,
  FaArrowLeft
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";

export default function PaymentMethods() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("orange_money");
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await api.get("/payments/methods/");
      setPaymentMethods(response.data.results || response.data || []);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des méthodes de paiement");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMethod = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        payment_type: formType,
        ...formData
      };
      await api.post("/payments/methods/", payload);
      toast.success("Méthode de paiement ajoutée avec succès");
      setShowForm(false);
      setFormData({});
      loadPaymentMethods();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'ajout");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.post(`/payments/methods/${id}/set_default/`);
      toast.success("Méthode définie par défaut");
      loadPaymentMethods();
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette méthode de paiement ?")) return;
    try {
      await api.post(`/payments/methods/${id}/delete_method/`);
      toast.success("Méthode supprimée");
      loadPaymentMethods();
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const renderForm = () => {
    const fields = {
      orange_money: [
        { name: "phone_number", label: "Numéro Orange Money", type: "tel", icon: FaPhone, placeholder: "6XXXXXXXX" },
        { name: "operator", label: "Opérateur", type: "text", icon: FaMobileAlt, placeholder: "orange", value: "orange", hidden: true }
      ],
      mtn_money: [
        { name: "phone_number", label: "Numéro MTN Money", type: "tel", icon: FaPhone, placeholder: "6XXXXXXXX" },
        { name: "operator", label: "Opérateur", type: "text", icon: FaMobileAlt, placeholder: "mtn", value: "mtn", hidden: true }
      ],
      visa: [
        { name: "card_number", label: "Numéro de carte", type: "text", icon: FaCreditCard, placeholder: "4111 1111 1111 1111" },
        { name: "card_holder_name", label: "Nom du titulaire", type: "text", icon: FaUser, placeholder: "Jean Dupont" },
        { name: "card_expiry", label: "Date d'expiration (MM/YYYY)", type: "text", icon: FaCalendarAlt, placeholder: "12/2025" },
        { name: "card_cvv", label: "CVV", type: "password", icon: FaLock, placeholder: "123" }
      ]
    };

    const currentFields = fields[formType] || [];

    return (
      <form onSubmit={handleAddMethod} className="space-y-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {["orange_money", "mtn_money", "visa"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormType(type)}
              className={`p-3 rounded-xl border-2 transition ${
                formType === type
                  ? "border-brand-red bg-brand-red/5 text-brand-red"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                {type === "visa" ? (
                  <FaCreditCard className="text-lg" />
                ) : (
                  <FaMobileAlt className="text-lg" />
                )}
                <span className="text-xs font-medium">
                  {type === "orange_money" ? "Orange Money" :
                   type === "mtn_money" ? "MTN Money" : "Visa"}
                </span>
              </div>
            </button>
          ))}
        </div>

        {currentFields.map((field) => {
          const Icon = field.icon;
          return (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {!field.hidden && <span className="text-brand-red"> *</span>}
              </label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={field.type}
                  required={!field.hidden}
                  placeholder={field.placeholder}
                  value={formData[field.name] || field.value || ""}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none transition"
                />
              </div>
            </div>
          );
        })}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-brand-red text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {submitting ? <FaSpinner className="animate-spin" /> : <FaPlus />}
            Ajouter
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Annuler
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* En-tête */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-brand-red transition p-2 rounded-lg hover:bg-gray-100"
          >
            <FaArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-extrabold text-brand-black">Méthodes de paiement</h1>
        </div>

        {/* Bouton Ajouter */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
          >
            <FaPlus /> {showForm ? "Fermer" : "Ajouter une méthode"}
          </button>
        </div>

        {/* Formulaire */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
            <h2 className="font-semibold text-lg mb-4">Nouvelle méthode de paiement</h2>
            {renderForm()}
          </div>
        )}

        {/* Liste des méthodes */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin text-brand-red text-3xl" />
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <FaCreditCard className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune méthode de paiement</p>
            <p className="text-sm text-gray-400">Ajoutez votre première méthode de paiement</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between ${
                  method.is_default ? "border-brand-red" : "border-gray-100"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    {method.payment_type === "visa" ? (
                      <FaCreditCard className="text-brand-red text-xl" />
                    ) : (
                      <FaMobileAlt className="text-brand-red text-xl" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {method.payment_type === "orange_money" ? "Orange Money" :
                       method.payment_type === "mtn_money" ? "MTN Money" : "Visa"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {method.phone_number || method.card_number || "N/A"}
                    </p>
                    {method.is_default && (
                      <span className="text-xs text-brand-red font-medium">Par défaut</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!method.is_default && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="text-green-600 hover:text-green-700 p-2 rounded-lg hover:bg-green-50 transition"
                      title="Définir par défaut"
                    >
                      <FaCheck size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition"
                    title="Supprimer"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lien retour */}
        <div className="mt-6 text-center">
          <Link to="/checkout" className="text-brand-red hover:underline text-sm">
            ← Retour au paiement
          </Link>
        </div>
      </div>
    </div>
  );
}