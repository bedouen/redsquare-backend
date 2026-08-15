import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { formatFCFA } from "../../utils/currency";
import { 
  FaUser, 
  FaShoppingBag, 
  FaMoneyBillWave, 
  FaFilePdf, 
  FaSearch,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaDownload,
  FaEye,
  FaCalendarAlt,
  FaBox,
  FaSpinner,
  FaCheckCircle,
  FaClock,
  FaTruck,
  FaHome,
  FaTimesCircle,
  FaStore
} from "react-icons/fa";

const statusLabels = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700", icon: FaClock },
  paid: { label: "Payée", color: "bg-blue-100 text-blue-700", icon: FaCheckCircle },
  shipped: { label: "Expédiée", color: "bg-purple-100 text-purple-700", icon: FaTruck },
  delivered: { label: "Livrée", color: "bg-green-100 text-green-700", icon: FaHome },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-700", icon: FaTimesCircle },
};

const statusOptions = [
  { value: "", label: "Tous les statuts" },
  { value: "pending", label: "En attente" },
  { value: "paid", label: "Payée" },
  { value: "shipped", label: "Expédiée" },
  { value: "delivered", label: "Livrée" },
  { value: "cancelled", label: "Annulée" },
];

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const { items, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    totalItems: 0,
    lastOrder: null
  });

  // Charger les commandes
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get("/orders/", {
        params: {
          status: statusFilter || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined
        }
      });
      const ordersData = response.data.results || response.data || [];
      setOrders(ordersData);
      calculateStats(ordersData);
    } catch (error) {
      console.error("Erreur lors du chargement des commandes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculer les statistiques
  const calculateStats = (ordersData) => {
    const totalOrders = ordersData.length;
    const totalSpent = ordersData.reduce((sum, order) => sum + order.total_amount, 0);
    const totalItems = ordersData.reduce((sum, order) => {
      return sum + order.items.reduce((s, item) => s + item.quantity, 0);
    }, 0);
    const lastOrder = ordersData.length > 0 ? ordersData[0] : null;

    setStats({
      totalOrders,
      totalSpent,
      totalItems,
      lastOrder
    });
  };

  // Filtrer les commandes par recherche
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    
    const term = searchTerm.toLowerCase();
    return orders.filter(order => {
      // Recherche par ID de commande
      if (order.id.toLowerCase().includes(term)) return true;
      // Recherche par produit
      if (order.items.some(item => 
        item.product_name?.toLowerCase().includes(term)
      )) return true;
      // Recherche par statut
      const statusLabel = statusLabels[order.status]?.label || '';
      if (statusLabel.toLowerCase().includes(term)) return true;
      return false;
    });
  }, [orders, searchTerm]);

  // Télécharger le reçu PDF
  const downloadReceipt = async (orderId) => {
    setDownloading(true);
    try {
      const response = await api.get(`/orders/${orderId}/receipt/`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `recu_commande_${orderId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Erreur lors du téléchargement du reçu:", error);
      alert("Erreur lors du téléchargement du reçu. Veuillez réessayer.");
    } finally {
      setDownloading(false);
    }
  };

  // Naviguer vers la boutique
  const goToShop = () => {
    navigate("/");
  };

  // Obtenir l'initiale de l'utilisateur
  const getInitials = () => {
    if (!user) return "?";
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.first_name?.[0]?.toUpperCase() || "?";
  };

  // Format de date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Toggle expansion d'une commande
  const toggleOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Rendu du badge de statut
  const StatusBadge = ({ status }) => {
    const statusInfo = statusLabels[status] || { label: status, color: "bg-gray-100 text-gray-700", icon: FaClock };
    const Icon = statusInfo.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
        <Icon size={12} />
        {statusInfo.label}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <FaUser className="text-6xl text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Veuillez vous connecter</h2>
        <p className="text-gray-500 mb-4">Pour accéder à votre tableau de bord</p>
        <button
          onClick={() => navigate("/login")}
          className="bg-brand-red text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
        >
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* En-tête avec profil */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              {user.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt={user.first_name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-brand-red/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-brand-red/20 flex items-center justify-center border-4 border-brand-red/30">
                  <span className="text-2xl font-bold text-brand-red">
                    {getInitials()}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white"></div>
            </div>

            {/* Infos utilisateur */}
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold text-brand-black">
                Bonjour, {user.first_name} {user.last_name || ''}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <FaUser size={12} />
                  {user.phone_number}
                </span>
                {user.email && (
                  <span className="flex items-center gap-1">
                    • {user.email}
                  </span>
                )}
                {user.city && (
                  <span className="flex items-center gap-1">
                    • {user.city} {user.neighborhood ? `(${user.neighborhood})` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <button
                onClick={goToShop}
                className="flex items-center justify-center gap-2 bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
              >
                <FaStore /> Continuer mes achats
              </button>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="flex items-center justify-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                Déconnexion
              </button>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-black">{stats.totalOrders}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Commandes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-black">{formatFCFA(stats.totalSpent)}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total dépensé</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-black">{stats.totalItems}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Articles achetés</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-brand-black">
                {stats.lastOrder ? formatDate(stats.lastOrder.created_at) : '-'}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Dernière commande</p>
            </div>
          </div>
        </div>

        {/* Section commandes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FaShoppingBag className="text-brand-red" />
                Historique des commandes
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({filteredOrders.length})
                </span>
              </h2>

              {/* Panier actuel */}
              {items.length > 0 && (
                <button
                  onClick={() => navigate("/cart")}
                  className="flex items-center gap-2 bg-brand-red/10 text-brand-red px-4 py-2 rounded-lg hover:bg-brand-red/20 transition text-sm"
                >
                  <FaShoppingBag />
                  Panier ({items.length} articles)
                </button>
              )}
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une commande, un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition text-sm"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition text-sm"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition text-sm"
                />
                <span className="text-gray-400">à</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition text-sm"
                />
              </div>

              <button
                onClick={loadOrders}
                className="bg-brand-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition text-sm flex items-center gap-2"
              >
                <FaFilter /> Filtrer
              </button>
            </div>
          </div>

          {/* Liste des commandes */}
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FaSpinner className="animate-spin text-brand-red text-3xl" />
                <span className="ml-3 text-gray-500">Chargement des commandes...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <FaShoppingBag className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune commande trouvée</h3>
                <p className="text-gray-400 text-sm mb-4">
                  {orders.length === 0 
                    ? "Vous n'avez pas encore passé de commande."
                    : "Aucune commande ne correspond à vos filtres."
                  }
                </p>
                <button
                  onClick={goToShop}
                  className="bg-brand-red text-white px-6 py-2 rounded-lg hover:bg-red-700 transition inline-flex items-center gap-2"
                >
                  <FaStore /> Découvrir nos produits
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrder === order.id;
                  const statusInfo = statusLabels[order.status] || { label: order.status, color: "bg-gray-100 text-gray-700" };
                  
                  return (
                    <div 
                      key={order.id} 
                      className={`border border-gray-200 rounded-xl overflow-hidden transition-all ${
                        isExpanded ? 'shadow-md' : 'hover:shadow-sm'
                      }`}
                    >
                      {/* En-tête de la commande (toujours visible) */}
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-50 transition flex flex-wrap items-center gap-3"
                        onClick={() => toggleOrder(order.id)}
                      >
                        <div className="flex-1 min-w-[150px]">
                          <p className="font-semibold text-sm flex items-center gap-2">
                            <FaShoppingBag className="text-gray-400" size={14} />
                            Commande #{order.id.slice(0, 8)}
                            <span className="text-xs text-gray-400 font-normal">
                              • {formatDate(order.created_at)}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.items.length} article{order.items.length > 1 ? 's' : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 ml-auto">
                          <span className="text-sm font-bold text-brand-black">
                            {formatFCFA(order.total_amount)}
                          </span>
                          <StatusBadge status={order.status} />
                          <button className="text-gray-400 hover:text-gray-600 transition">
                            {isExpanded ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Détails de la commande (expandable) */}
                      {isExpanded && (
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                          {/* Informations de livraison */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-white rounded-lg border border-gray-100">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Livraison</p>
                              <p className="text-sm font-medium">{order.delivery_city || 'N/A'}</p>
                              <p className="text-xs text-gray-500">{order.delivery_neighborhood || ''}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Contact</p>
                              <p className="text-sm font-medium">{order.delivery_phone || user.phone_number}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Méthode de paiement</p>
                              <p className="text-sm font-medium capitalize">{order.payment_method || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Articles */}
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Articles</p>
                            <div className="space-y-2">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100">
                                  {item.product_image ? (
                                    <img 
                                      src={item.product_image} 
                                      alt={item.product_name}
                                      className="w-12 h-12 object-cover rounded-lg bg-gray-100"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                      <FaBox className="text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{item.product_name}</p>
                                    <p className="text-xs text-gray-500">
                                      {item.quantity} x {formatFCFA(item.unit_price)}
                                    </p>
                                  </div>
                                  <p className="font-semibold text-sm">
                                    {formatFCFA(item.unit_price * item.quantity)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Récapitulatif des prix */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded-lg border border-gray-100">
                            <div className="flex flex-wrap gap-4 text-sm">
                              <span>Sous-total: <strong>{formatFCFA(order.subtotal)}</strong></span>
                              <span>Livraison: <strong>{formatFCFA(order.delivery_fee)}</strong></span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-brand-black">
                                Total: {formatFCFA(order.total_amount)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadReceipt(order.id);
                                }}
                                disabled={downloading}
                                className="flex items-center gap-1 bg-brand-red/10 text-brand-red px-3 py-1.5 rounded-lg hover:bg-brand-red/20 transition text-sm disabled:opacity-50"
                              >
                                {downloading ? (
                                  <FaSpinner className="animate-spin" size={14} />
                                ) : (
                                  <FaFilePdf size={14} />
                                )}
                                Reçu PDF
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}