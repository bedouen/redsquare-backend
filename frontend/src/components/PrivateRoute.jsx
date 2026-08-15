import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaSpinner, FaLock, FaExclamationTriangle } from "react-icons/fa";

/**
 * Protège une route : nécessite d'être connecté, et optionnellement
 * d'avoir l'un des rôles listés dans `roles`.
 */
export default function PrivateRoute({ 
  children, 
  roles, 
  redirectTo = "/login",
  showErrorPage = false 
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Normaliser les rôles en tableau
  const allowedRoles = Array.isArray(roles) ? roles : (roles ? [roles] : []);

  // Fonction pour obtenir le message d'erreur de rôle
  const getRoleErrorMessage = () => {
    const roleLabels = {
      super_admin: "Super-Administrateur",
      admin: "Administrateur",
      client: "Client"
    };
    
    if (allowedRoles.length === 1) {
      return `Cette page est réservée aux ${roleLabels[allowedRoles[0]] || allowedRoles[0]}.`;
    }
    
    const labels = allowedRoles.map(r => roleLabels[r] || r);
    return `Cette page est réservée à : ${labels.join(", ")}.`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 px-4">
        <FaSpinner className="animate-spin text-brand-red text-4xl mb-4" />
        <p className="text-gray-500 text-sm">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Si showErrorPage est true, afficher une page d'erreur
    if (showErrorPage) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaLock className="text-red-500 text-3xl" />
            </div>
            <h2 className="text-2xl font-extrabold text-brand-black mb-2">
              Accès non autorisé
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              {getRoleErrorMessage()}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.history.back()}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
              >
                Retour
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="px-6 py-2.5 bg-brand-red hover:bg-red-700 text-white rounded-lg transition font-medium text-sm"
              >
                Aller à la boutique
              </button>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-400">
                Connecté en tant que : <strong>{user.first_name}</strong>
                <span className="ml-1 text-brand-red font-medium">({user.role})</span>
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    // Sinon, rediriger vers la page d'accueil
    return <Navigate to="/" state={{ error: "Accès non autorisé" }} replace />;
  }

  return children;
}