import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";
import ChatBot from "./components/ChatBot";
// Composants layout
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";
import ScrollToTop from "./components/ScrollToTop";
import LoadingSpinner from "./components/LoadingSpinner";

// Pages (Lazy loading pour les pages lourdes)
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";

// ✅ Nouvelles pages
import PaymentMethods from "./pages/PaymentMethods";
import OrderHistory from "./pages/OrderHistory";

// Dashboard (Lazy loading)
const ClientDashboard = lazy(() => import("./pages/client/ClientDashboard"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const SuperAdminDashboard = lazy(() => import("./pages/superadmin/SuperAdminDashboard"));

// Composant de fallback pour le lazy loading
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <LoadingSpinner size="text-5xl" text="Chargement de la page..." />
  </div>
);

export default function App() {
  const location = useLocation();

  // Scroll to top à chaque changement de page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  // Vérifier si la page est un dashboard
  const isDashboard = location.pathname.startsWith("/admin") || 
                      location.pathname.startsWith("/superadmin") || 
                      location.pathname.startsWith("/client");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            duration: 2000,
          },
        }}
      />

      {/* Navbar */}
      <Navbar />

      {/* Scroll to top */}
      <ScrollToTop />

      {/* Contenu principal */}
      <main className={`flex-1 ${isDashboard ? '' : 'pt-4'}`}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ════════════════════════════════════════ */}
            {/* ROUTES PUBLIQUES */}
            {/* ════════════════════════════════════════ */}
            <Route path="/" element={<Home />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* ════════════════════════════════════════ */}
            {/* ROUTES UTILISATEURS CONNECTÉS */}
            {/* ════════════════════════════════════════ */}
            <Route
              path="/cart"
              element={
                <PrivateRoute roles={["client", "admin", "super_admin"]}>
                  <Cart />
                </PrivateRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <PrivateRoute roles={["client", "admin", "super_admin"]}>
                  <Checkout />
                </PrivateRoute>
              }
            />
            <Route
              path="/client"
              element={
                <PrivateRoute roles={["client", "admin", "super_admin"]}>
                  <ClientDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/client/*"
              element={
                <PrivateRoute roles={["client", "admin", "super_admin"]}>
                  <ClientDashboard />
                </PrivateRoute>
              }
            />

            {/* ✅ ROUTES PAIEMENT ET HISTORIQUE */}
            <Route
              path="/payment-methods"
              element={
                <PrivateRoute roles={["client", "admin", "super_admin"]}>
                  <PaymentMethods />
                </PrivateRoute>
              }
            />
            <Route
              path="/order-history"
              element={
                <PrivateRoute roles={["client", "admin", "super_admin"]}>
                  <OrderHistory />
                </PrivateRoute>
              }
            />

            {/* ════════════════════════════════════════ */}
            {/* ROUTES ADMIN */}
            {/* ════════════════════════════════════════ */}
            <Route
              path="/admin"
              element={
                <PrivateRoute roles={["admin", "super_admin"]}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <PrivateRoute roles={["admin", "super_admin"]}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />

            {/* ════════════════════════════════════════ */}
            {/* ROUTES SUPER-ADMIN */}
            {/* ════════════════════════════════════════ */}
            <Route
              path="/superadmin"
              element={
                <PrivateRoute roles={["super_admin"]}>
                  <SuperAdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/superadmin/*"
              element={
                <PrivateRoute roles={["super_admin"]}>
                  <SuperAdminDashboard />
                </PrivateRoute>
              }
            />

            {/* ════════════════════════════════════════ */}
            {/* ROUTE 404 - Fallback */}
            {/* ════════════════════════════════════════ */}
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>

      {/* Footer - Présent sur toutes les pages */}
      <Footer />
      <ChatBot />
    </div>
  );
}