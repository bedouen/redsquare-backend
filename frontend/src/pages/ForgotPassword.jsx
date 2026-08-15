import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { FaArrowLeft, FaEnvelope, FaPhone, FaSpinner, FaCheckCircle } from "react-icons/fa";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!identifier.trim()) {
      setError("Veuillez entrer votre téléphone ou email");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/password/otp/request/", { identifier, channel: "sms" });
      setMessage("Un code a été envoyé à votre téléphone");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur, veuillez réessayer");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (code.length !== 6) {
      setError("Le code doit contenir 6 chiffres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/password/otp/verify/", {
        identifier,
        code,
        new_password: newPassword
      });
      setMessage("Mot de passe réinitialisé avec succès !");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Code invalide");
    } finally {
      setLoading(false);
    }
  };

  if (message && step === 2 && message.includes("réinitialisé")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
          <h2 className="text-xl font-bold text-brand-black">Réinitialisé !</h2>
          <p className="text-gray-500 text-sm mt-2">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <button onClick={() => step === 1 ? navigate("/login") : setStep(1)} className="flex items-center gap-2 text-gray-500 hover:text-brand-red text-sm mb-4">
          <FaArrowLeft size={14} /> Retour
        </button>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-brand-black">Mot de passe oublié</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 ? "Entrez votre téléphone ou email" : "Entrez le code reçu"}
          </p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-600 text-sm text-center">{error}</div>}
        {message && step === 1 && <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-green-600 text-sm text-center">{message}</div>}

        {step === 1 && (
          <form onSubmit={requestOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone ou Email</label>
              <div className="relative">
                <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  placeholder="+237 690 000 000"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none transition"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-brand-red hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-70 flex items-center justify-center gap-2">
              {loading ? <FaSpinner className="animate-spin" /> : "Envoyer le code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code reçu (6 chiffres)</label>
              <input
                required
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none transition text-center text-xl font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                required
                placeholder="Min 8 caractères"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer</label>
              <input
                type="password"
                required
                placeholder="Confirmez"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none transition"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-brand-red hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-70 flex items-center justify-center gap-2">
              {loading ? <FaSpinner className="animate-spin" /> : "Réinitialiser"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}