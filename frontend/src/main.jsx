import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import "./index.css";

const App = lazy(() => import("./App.jsx"));

const isDevelopment = import.meta.env.MODE === "development";

const AppLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <LoadingSpinner size="text-5xl" text="Chargement de l'application..." />
  </div>
);

const AppError = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-4xl">⚠️</span>
      </div>
      <h2 className="text-xl font-bold text-brand-black mb-2">
        Une erreur est survenue
      </h2>
      <p className="text-gray-600 text-sm mb-4">
        L'application n'a pas pu se charger correctement.
      </p>
      {isDevelopment && (
        <div className="bg-gray-100 rounded-lg p-3 mb-4 text-left">
          <p className="text-xs text-red-600 font-mono break-all">
            {error?.message || "Erreur inconnue"}
          </p>
        </div>
      )}
      <button
        onClick={() => window.location.reload()}
        className="bg-brand-red hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition"
      >
        Rafraîchir la page
      </button>
    </div>
  </div>
);

function Root() {
  return (
    <ErrorBoundary fallback={<AppError />}>
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <AuthProvider>
          <CartProvider>
            <ThemeProvider>
              <Suspense fallback={<AppLoader />}>
                <App />
              </Suspense>
            </ThemeProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  isDevelopment ? (
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  ) : (
    <Root />
  )
);