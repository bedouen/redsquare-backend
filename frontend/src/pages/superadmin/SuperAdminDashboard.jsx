// ============================================================
// PARTIE 1 - IMPORTS ET DÉCLARATION DU COMPOSANT
// ============================================================

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { formatFCFA } from "../../utils/currency";
import { toast } from "react-hot-toast";
import { 
  FaUsers, 
  FaBox, 
  FaShoppingCart, 
  FaMoneyBillWave,
  FaUserPlus,
  FaUserMinus,
  FaEdit,
  FaTrash,
  FaEye,
  FaFilter,
  FaSearch,
  FaSort,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaCheck,
  FaSpinner,
  FaChartBar,
  FaFilePdf,
  FaDownload,
  FaPlus,
  FaUserCog,
  FaUserTag,
  FaStore,
  FaTachometerAlt,
  FaChartLine,
  FaCalendarAlt,
  FaUserCheck,
  FaUserClock
} from "react-icons/fa";
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const roleLabels = {
  client: { label: "Client", color: "bg-blue-100 text-blue-700" },
  admin: { label: "Administrateur", color: "bg-purple-100 text-purple-700" },
  super_admin: { label: "Super-Admin", color: "bg-red-100 text-red-700" },
};

const statusLabels = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Payée", color: "bg-blue-100 text-blue-700" },
  shipped: { label: "Expédiée", color: "bg-purple-100 text-purple-700" },
  delivered: { label: "Livrée", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-700" },
};

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // États des onglets
  const [tab, setTab] = useState("overview");
  const [subTab, setSubTab] = useState("all");
  
  // États des données
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // États des filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  
  // États des modales
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // États des formulaires
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [categorySuccess, setCategorySuccess] = useState("");
  
  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // --- États pour les modales améliorées ---
  const [modalHeaders, setModalHeaders] = useState([]);
  const [modalSearch, setModalSearch] = useState("");
  const [modalFilteredData, setModalFilteredData] = useState([]);

  // --- États pour l'édition des utilisateurs ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});

  // --- États pour les détails des commandes ---
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);

  // --- États pour les statistiques et graphiques ---
  const [statsData, setStatsData] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('month');
  const [selectedChartType, setSelectedChartType] = useState('bar');
  const [showStats, setShowStats] = useState(false);

  // --- États pour l'export des sections ---
  const [exporting, setExporting] = useState(false);
  const [selectedSection, setSelectedSection] = useState('users');

  // ============================================================
  // FONCTIONS DE CHARGEMENT DES DONNÉES
  // ============================================================

  const loadOverview = async () => {
    setLoading(true);
    try {
      const response = await api.get("/reports/global-overview/");
      setOverview(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement de la vue globale:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/auth/users/");
      setUsers(response.data.results || response.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get("/catalog/categories/");
      setCategories(response.data.results || response.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des catégories:", error);
    } finally {
      setLoading(false);
    }
  };

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
      setOrders(response.data.results || response.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des commandes:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get("/catalog/products/");
      setProducts(response.data.results || response.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
    } finally {
      setLoading(false);
    }
  };



































  // ============================================================
// PARTIE 2 - HOOKS USEEFFECT ET FONCTIONS DE FILTRAGE
// ============================================================

  // Charger les données selon l'onglet
  useEffect(() => {
    if (tab === "overview") loadOverview();
    if (tab === "users") loadUsers();
    if (tab === "categories") loadCategories();
    if (tab === "orders") loadOrders();
    if (tab === "products") loadProducts();
  }, [tab]);

  // Recharger les commandes quand les filtres changent
  useEffect(() => {
    if (tab === "orders") loadOrders();
  }, [statusFilter, dateFrom, dateTo]);

  // Filtrer les utilisateurs
  const filteredUsers = useMemo(() => {
    let filtered = [...users];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.first_name?.toLowerCase().includes(term) ||
        u.last_name?.toLowerCase().includes(term) ||
        u.phone_number?.includes(term) ||
        u.email?.toLowerCase().includes(term)
      );
    }
    
    if (roleFilter) {
      filtered = filtered.filter(u => u.role === roleFilter);
    }
    
    return filtered;
  }, [users, searchTerm, roleFilter]);

  // Filtrer les catégories
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    const term = searchTerm.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(term));
  }, [categories, searchTerm]);

  // Filtrer les commandes
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o => 
        o.id.toLowerCase().includes(term) ||
        o.buyer_name?.toLowerCase().includes(term) ||
        o.items?.some(item => item.product_name?.toLowerCase().includes(term))
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(o => o.status === statusFilter);
    }
    
    return filtered;
  }, [orders, searchTerm, statusFilter]);

  // Pagination
  const getPaginatedData = (data) => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  };

  const totalPages = (data) => Math.ceil(data.length / itemsPerPage);

  // ============================================================
  // GESTION DES UTILISATEURS
  // ============================================================

  const changeRole = async (userId, role) => {
    try {
      await api.patch(`/auth/users/${userId}/`, { role });
      setUsers(users.map((u) => (u.id === userId ? { ...u, role } : u)));
    } catch (error) {
      console.error("Erreur lors du changement de rôle:", error);
      toast.error("Erreur lors du changement de rôle.");
    }
  };

 // Dans SuperAdminDashboard.jsx, corriger la fonction deleteUser

const deleteUser = async (userId) => {
  if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;
  try {
    await api.delete(`/auth/users/${userId}/`);
    setUsers(users.filter((u) => u.id !== userId));
    toast.success("Utilisateur supprimé avec succès");
    loadUsers(); // Recharger la liste
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    const errorMsg = error.response?.data?.detail || "Erreur lors de la suppression de l'utilisateur.";
    toast.error(errorMsg);
  }
};
// Dans SuperAdminDashboard.jsx, ajouter ces états
const [showAddUserModal, setShowAddUserModal] = useState(false);
const [newUserForm, setNewUserForm] = useState({
  phone_number: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  role: "client",
  city: "",
  neighborhood: ""
});

// Fonction d'ajout d'utilisateur
const addNewUser = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const payload = {
      phone_number: newUserForm.phone_number,
      first_name: newUserForm.first_name,
      last_name: newUserForm.last_name,
      email: newUserForm.email || undefined,
      password: newUserForm.password,
      role: newUserForm.role,
      city: newUserForm.city || undefined,
      neighborhood: newUserForm.neighborhood || undefined
    };
    await api.post("/auth/users/", payload);
    toast.success("Utilisateur créé avec succès");
    setShowAddUserModal(false);
    setNewUserForm({
      phone_number: "",
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      role: "client",
      city: "",
      neighborhood: ""
    });
    loadUsers();
  } catch (error) {
    const errorMsg = error.response?.data?.detail || "Erreur lors de la création";
    toast.error(errorMsg);
  } finally {
    setLoading(false);
  }
};

// Modal d'ajout d'utilisateur
const renderAddUserModal = () => {
  if (!showAddUserModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Ajouter un utilisateur</h3>
          <button
            onClick={() => setShowAddUserModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <form onSubmit={addNewUser} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
            <input
              type="tel"
              required
              placeholder="+237690000000"
              value={newUserForm.phone_number}
              onChange={(e) => setNewUserForm({...newUserForm, phone_number: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
            <input
              type="text"
              required
              placeholder="Jean"
              value={newUserForm.first_name}
              onChange={(e) => setNewUserForm({...newUserForm, first_name: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              type="text"
              placeholder="Dupont"
              value={newUserForm.last_name}
              onChange={(e) => setNewUserForm({...newUserForm, last_name: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="jean@email.com"
              value={newUserForm.email}
              onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
            <input
              type="password"
              required
              placeholder="Min 8 caractères"
              value={newUserForm.password}
              onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
            <select
              value={newUserForm.role}
              onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none"
            >
              <option value="client">Client</option>
              <option value="admin">Administrateur</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <input
              type="text"
              placeholder="Douala"
              value={newUserForm.city}
              onChange={(e) => setNewUserForm({...newUserForm, city: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quartier</label>
            <input
              type="text"
              placeholder="Bonamoussadi"
              value={newUserForm.neighborhood}
              onChange={(e) => setNewUserForm({...newUserForm, neighborhood: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none"
            />
          </div>
          
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-red text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? <FaSpinner className="animate-spin mx-auto" /> : "Créer l'utilisateur"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddUserModal(false)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
  // ============================================================
  // GESTION DES CATÉGORIES
  // ============================================================

  const addCategory = async (e) => {
    e.preventDefault();
    setCategoryError("");
    setCategorySuccess("");
    
    if (!newCategory.trim()) {
      setCategoryError("Le nom de la catégorie est requis.");
      return;
    }
    
    try {
      const { data } = await api.post("/catalog/categories/", { name: newCategory.trim() });
      setCategories([...categories, data]);
      setCategorySuccess(`Catégorie "${newCategory}" créée avec succès.`);
      setNewCategory("");
      setTimeout(() => setCategorySuccess(""), 3000);
    } catch (error) {
      setCategoryError(error.response?.data?.detail || "Erreur lors de la création.");
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) return;
    try {
      await api.delete(`/catalog/categories/${id}/`);
      setCategories(categories.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de la catégorie.");
    }
  };

  // ============================================================
  // GESTION DES COMMANDES
  // ============================================================

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/update_status/`, { status });
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      toast.error("Erreur lors de la mise à jour du statut.");
    }
  };

  // ============================================================
  // GESTION DES KPI MODALES (AMÉLIORÉ)
  // ============================================================

  const handleKpiClick = async (kpiKey) => {
    setSelectedKpi(kpiKey);
    setShowModal(true);
    setLoading(true);
    setModalSearch("");
    
    try {
      let data = null;
      let formatData = [];
      let headers = [];
      
      switch(kpiKey) {
        case 'total_users':
          data = await api.get("/auth/users/");
          formatData = (data.data.results || data.data || []).map(user => ({
            'Nom': `${user.first_name} ${user.last_name || ''}`,
            'Téléphone': user.phone_number,
            'Email': user.email || 'N/A',
            'Rôle': roleLabels[user.role]?.label || user.role,
            'Dernière connexion': user.last_login ? new Date(user.last_login).toLocaleString('fr-FR') : 'Jamais',
            'Ville': user.city || 'N/A',
            'Statut': user.is_active ? 'Actif' : 'Inactif'
          }));
          headers = ['Nom', 'Téléphone', 'Email', 'Rôle', 'Dernière connexion', 'Ville', 'Statut'];
          break;
          
        case 'total_products':
          data = await api.get("/catalog/products/");
          formatData = (data.data.results || data.data || []).map(product => ({
            'Nom': product.name,
            'Prix': `${product.unit_price} FCFA`,
            'Stock': product.quantity,
            'Catégorie': product.category_name || 'N/A',
            'Vendeur': product.created_by_name || 'N/A',
            'Date création': new Date(product.created_at).toLocaleDateString('fr-FR')
          }));
          headers = ['Nom', 'Prix', 'Stock', 'Catégorie', 'Vendeur', 'Date création'];
          break;
          
        case 'total_orders':
          data = await api.get("/orders/");
          formatData = (data.data.results || data.data || []).map(order => ({
            'Commande': order.id.slice(0, 8),
            'Client': order.buyer_name || 'N/A',
            'Total': `${order.total_amount} FCFA`,
            'Statut': statusLabels[order.status]?.label || order.status,
            'Paiement': order.payment_method || 'N/A',
            'Date': new Date(order.created_at).toLocaleString('fr-FR'),
            'Articles': order.items?.length || 0
          }));
          headers = ['Commande', 'Client', 'Total', 'Statut', 'Paiement', 'Date', 'Articles'];
          break;
          
        case 'total_revenue':
          data = await api.get("/reports/sales-dashboard/");
          const stats = data.data || {};
          formatData = [
            { 'Indicateur': 'Chiffre d\'affaires total', 'Valeur': `${stats.total_revenue || 0} FCFA` },
            { 'Indicateur': 'Nombre total de commandes', 'Valeur': stats.total_orders || 0 },
            { 'Indicateur': 'Nombre total de produits', 'Valeur': stats.total_products || 0 },
            { 'Indicateur': 'Nombre total d\'utilisateurs', 'Valeur': stats.total_users || 0 },
          ];
          headers = ['Indicateur', 'Valeur'];
          break;
          
        default:
          data = null;
      }
      
      setModalData(formatData);
      setModalHeaders(headers);
      setModalFilteredData(formatData);
      
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
      toast.error("Erreur lors du chargement des données");
      setModalData([]);
      setModalHeaders([]);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedKpi(null);
    setModalData(null);
    setModalHeaders([]);
    setModalSearch("");
    setModalFilteredData([]);
  };

  // ============================================================
  // FONCTIONS D'ÉDITION DES UTILISATEURS
  // ============================================================

  const openEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      first_name: user.first_name,
      last_name: user.last_name || '',
      email: user.email || '',
      phone_number: user.phone_number,
      city: user.city || '',
      neighborhood: user.neighborhood || '',
      role: user.role
    });
    setShowEditModal(true);
  };

  const saveUserEdit = async () => {
    try {
      await api.patch(`/auth/users/${editingUser.id}/`, editForm);
      toast.success("Utilisateur modifié avec succès");
      setShowEditModal(false);
      loadUsers();
    } catch (error) {
      toast.error("Erreur lors de la modification");
    }
  };

  // ============================================================
  // FONCTIONS DE TÉLÉCHARGEMENT DES REÇUS
  // ============================================================

  const downloadReceipt = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/receipt/`, {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `recu_commande_${orderId.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Reçu téléchargé");
    } catch (error) {
      toast.error("Erreur lors du téléchargement");
    }
  };

  // ============================================================
  // FONCTIONS POUR LES STATISTIQUES ET GRAPHIQUES
  // ============================================================

  const loadStatsData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/reports/sales-dashboard/", {
        params: {
          period: chartPeriod,
          date_from: dateFrom,
          date_to: dateTo
        }
      });
      setStatsData(response.data);
      setSalesData(response.data.sales_by_period || []);
      setShowStats(true);
    } catch (error) {
      toast.error("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  const exportChartPDF = async () => {
    try {
      const response = await api.post("/reports/export-charts-pdf/", {
        charts: {
          sales: statsData,
          period: chartPeriod
        }
      }, {
        responseType: "blob"
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `graphiques_ventes_${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export des graphiques réussi !");
    } catch (error) {
      toast.error("Erreur lors de l'export des graphiques");
    }
  };





















  // ============================================================
// PARTIE 3 - FONCTIONS D'EXPORT ET RENDU DES MODALES
// ============================================================

  // ============================================================
  // FONCTIONS D'EXPORT DES SECTIONS
  // ============================================================

  const exportSectionPDF = async (section, data) => {
    setExporting(true);
    try {
      const response = await api.post("/reports/export-section-pdf/", {
        section: section,
        data: data,
        date_from: dateFrom,
        date_to: dateTo
      }, {
        responseType: "blob"
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `export_${section}_${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Export PDF de la section "${section}" réussi !`);
    } catch (error) {
      toast.error("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  };

  const exportReport = async () => {
    try {
      const response = await api.get("/reports/global-pdf/", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `rapport_global_${new Date().toISOString().slice(0,10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export PDF réussi !");
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      toast.error("Erreur lors de l'export du rapport.");
    }
  };

  const exportModalData = async () => {
    try {
      const response = await api.post("/reports/export-table-pdf/", {
        title: getModalTitle(),
        headers: modalHeaders,
        data: modalData
      }, {
        responseType: "blob"
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `export_${selectedKpi}_${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export PDF réussi !");
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
  };

  // ============================================================
  // RENDU DES BADGES
  // ============================================================

  const RoleBadge = ({ role }) => {
    const roleInfo = roleLabels[role] || { label: role, color: "bg-gray-100 text-gray-700" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
        {roleInfo.label}
      </span>
    );
  };

  const StatusBadge = ({ status }) => {
    const statusInfo = statusLabels[status] || { label: status, color: "bg-gray-100 text-gray-700" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  // ============================================================
  // RENDU DU MODAL AMÉLIORÉ
  // ============================================================

  const getModalTitle = () => {
    const titles = {
      total_users: '👥 Tous les utilisateurs',
      total_products: '📦 Tous les produits',
      total_orders: '📋 Toutes les commandes',
      total_revenue: '💰 Détail des revenus',
    };
    return titles[selectedKpi] || 'Détails';
  };

  const handleModalSearch = (e) => {
    const search = e.target.value.toLowerCase();
    setModalSearch(search);
    
    if (!search) {
      setModalFilteredData(modalData);
      return;
    }
    
    const filtered = modalData.filter(item => {
      return Object.values(item).some(val => 
        String(val).toLowerCase().includes(search)
      );
    });
    setModalFilteredData(filtered);
  };

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-wrap gap-2">
            <h3 className="text-lg font-bold">{getModalTitle()}</h3>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={modalSearch}
                  onChange={handleModalSearch}
                  className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none transition w-48"
                />
              </div>
              <button
                onClick={exportModalData}
                className="bg-brand-red text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition text-sm flex items-center gap-2"
              >
                <FaFilePdf /> Exporter
              </button>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 transition p-2 rounded-lg hover:bg-gray-100"
              >
                <FaTimes size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FaSpinner className="animate-spin text-brand-red text-3xl" />
              </div>
            ) : modalFilteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {modalHeaders.map((header, index) => (
                        <th key={index} className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modalFilteredData.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        {Object.values(item).map((value, idx) => (
                          <td key={idx} className="py-3 px-4 max-w-xs truncate">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-12">Aucune donnée disponible</p>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={closeModal}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // MODAL D'ÉDITION DES UTILISATEURS
  // ============================================================

  const renderEditUserModal = () => {
    if (!showEditModal || !editingUser) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Modifier l'utilisateur</h3>
            <button
              onClick={() => setShowEditModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes size={20} />
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                type="text"
                value={editForm.first_name}
                onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                value={editForm.last_name}
                onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={editForm.phone_number}
                onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input
                type="text"
                value={editForm.city}
                onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quartier</label>
              <input
                type="text"
                value={editForm.neighborhood}
                onChange={(e) => setEditForm({...editForm, neighborhood: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red outline-none"
              >
                <option value="client">Client</option>
                <option value="admin">Administrateur</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={saveUserEdit}
              className="flex-1 bg-brand-red text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Enregistrer
            </button>
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  };






  // ============================================================
// PARTIE 4 - TABLEAUX ET SECTIONS PRINCIPALES
// ============================================================

  // ============================================================
  // TABLEAU DES UTILISATEURS
  // ============================================================

  const renderUsersTable = () => {
    const data = getPaginatedData(filteredUsers);
    return (
      
      <div>
     <button
  onClick={() => setShowAddUserModal(true)}
  className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition text-sm flex items-center gap-2"
>
  <FaUserPlus /> Ajouter
</button>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Utilisateurs</h3>
            <span className="text-sm text-gray-500">({filteredUsers.length} total)</span>
          </div>
          <button
            onClick={() => exportSectionPDF('utilisateurs', filteredUsers)}
            disabled={exporting}
            className="flex items-center gap-2 bg-brand-red text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50"
          >
            {exporting ? <FaSpinner className="animate-spin" /> : <FaFilePdf />}
            Exporter PDF
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Utilisateur</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Téléphone</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Email</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Rôle</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                data.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {u.profile_picture_url ? (
                          <img 
                            src={u.profile_picture_url} 
                            alt={u.first_name}
                            className="w-10 h-10 rounded-full object-cover bg-gray-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-brand-red/20 flex items-center justify-center">
                            <span className="font-bold text-brand-red">
                              {u.first_name?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{u.first_name} {u.last_name || ''}</p>
                          <p className="text-xs text-gray-500">{u.city || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{u.phone_number}</td>
                    <td className="py-3 px-4">{u.email || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition"
                      >
                        {Object.entries(roleLabels).map(([val, info]) => (
                          <option key={val} value={val}>{info.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Supprimer"
                        >
                          <FaTrash size={15} />
                        </button>
                        {u.role !== 'super_admin' && (
                          <button
                            onClick={() => openEditUser(u)}
                            className="text-blue-600 hover:text-blue-800 transition"
                            title="Modifier"
                          >
                            <FaEdit size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ============================================================
  // TABLEAU DES COMMANDES
  // ============================================================

  const renderOrdersTable = () => {
    const data = getPaginatedData(filteredOrders);
    return (
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Commandes</h3>
            <span className="text-sm text-gray-500">({filteredOrders.length} total)</span>
          </div>
          <button
            onClick={() => exportSectionPDF('commandes', filteredOrders)}
            disabled={exporting}
            className="flex items-center gap-2 bg-brand-red text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50"
          >
            {exporting ? <FaSpinner className="animate-spin" /> : <FaFilePdf />}
            Exporter PDF
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Commande</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Client</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-right">Total</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Statut</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                data.map((o) => (
                  <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-mono text-xs">
                      #{o.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4">{o.buyer_name || 'N/A'}</td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {formatFCFA(o.total_amount)}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition"
                      >
                        {Object.entries(statusLabels).map(([val, info]) => (
                          <option key={val} value={val}>{info.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(o.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => viewOrderDetails(o.id)}
                          className="text-gray-600 hover:text-gray-800 transition"
                          title="Voir détails"
                        >
                          <FaEye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ============================================================
  // MODAL DES DÉTAILS DE COMMANDE
  // ============================================================

  const viewOrderDetails = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/`);
      setSelectedOrderDetails(response.data);
      setShowOrderDetailModal(true);
    } catch (error) {
      toast.error("Erreur lors du chargement des détails");
    }
  };

  const renderOrderDetailModal = () => {
    if (!showOrderDetailModal || !selectedOrderDetails) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">
              Commande #{selectedOrderDetails.id?.slice(0, 8) || 'N/A'}
            </h3>
            <button
              onClick={() => setShowOrderDetailModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Client</p>
                <p className="font-medium">{selectedOrderDetails.buyer_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Total</p>
                <p className="font-medium">{formatFCFA(selectedOrderDetails.total_amount)}</p>
              </div>
              <div>
                <p className="text-gray-500">Statut</p>
                <p className="font-medium">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    statusLabels[selectedOrderDetails.status]?.color || 'bg-gray-100 text-gray-700'
                  }`}>
                    {statusLabels[selectedOrderDetails.status]?.label || selectedOrderDetails.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{new Date(selectedOrderDetails.created_at).toLocaleString('fr-FR')}</p>
              </div>
              {selectedOrderDetails.delivery_city && (
                <div className="col-span-2">
                  <p className="text-gray-500">Livraison</p>
                  <p className="font-medium">
                    {selectedOrderDetails.delivery_city} - {selectedOrderDetails.delivery_neighborhood || ''}
                  </p>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold mb-2">Articles</h4>
              <div className="space-y-2">
                {(selectedOrderDetails.items || []).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm border-b border-gray-100 py-2">
                    <div>
                      <span className="font-medium">{item.quantity} ×</span>
                      <span className="ml-1">{item.product_name}</span>
                    </div>
                    <span className="font-medium">{formatFCFA(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 flex justify-end">
              <button
                onClick={() => downloadReceipt(selectedOrderDetails.id)}
                className="flex items-center gap-2 bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                <FaFilePdf /> Télécharger le reçu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };














  // ============================================================
// PARTIE 5 - SECTIONS STATISTIQUES, GRAPHIQUES ET RENDU FINAL
// ============================================================

  // ============================================================
  // SECTION STATISTIQUES ET RAPPORTS
  // ============================================================

  const renderStatsSection = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-end p-4 bg-gray-50 rounded-xl">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Du</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Au</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Période</label>
            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none text-sm"
            >
              <option value="day">Jour</option>
              <option value="week">Semaine</option>
              <option value="month">Mois</option>
              <option value="year">Année</option>
            </select>
          </div>
          <button
            onClick={loadStatsData}
            className="bg-brand-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition text-sm flex items-center gap-2"
          >
            <FaFilter /> Appliquer
          </button>
          <button
            onClick={exportChartPDF}
            disabled={!statsData}
            className="bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <FaFilePdf /> Exporter graphiques
          </button>
        </div>

        {statsData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <p className="text-xs text-gray-600 font-medium">Chiffre d'affaires</p>
              <p className="text-xl font-bold">{formatFCFA(statsData.total_revenue || 0)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <p className="text-xs text-gray-600 font-medium">Commandes</p>
              <p className="text-xl font-bold">{statsData.total_orders || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <p className="text-xs text-gray-600 font-medium">Produits vendus</p>
              <p className="text-xl font-bold">{statsData.total_items_sold || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
              <p className="text-xs text-gray-600 font-medium">Clients uniques</p>
              <p className="text-xl font-bold">{statsData.distinct_buyers || 0}</p>
            </div>
          </div>
        )}

        {statsData?.per_product && statsData.per_product.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h4 className="font-semibold mb-3">Ventes par produit</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-2 px-4 text-left font-semibold text-xs uppercase">Produit</th>
                    <th className="py-2 px-4 text-right font-semibold text-xs uppercase">Quantité</th>
                    <th className="py-2 px-4 text-right font-semibold text-xs uppercase">CA</th>
                  </tr>
                </thead>
                <tbody>
                  {statsData.per_product.slice(0, 10).map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-4">{item.product__name || 'N/A'}</td>
                      <td className="py-2 px-4 text-right">{item.total_quantity || 0}</td>
                      <td className="py-2 px-4 text-right font-medium">{formatFCFA(item.total_revenue || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // SECTION GRAPHIQUES
  // ============================================================

  const renderChartsSection = () => {
    if (!statsData) {
      return (
        <div className="text-center py-12">
          <FaChartBar className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune donnée disponible</p>
          <button
            onClick={loadStatsData}
            className="mt-4 bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Charger les données
          </button>
        </div>
      );
    }

    const salesLabels = salesData.map(item => item.label || item.date || '');
    const salesValues = salesData.map(item => item.value || item.total || 0);

    const chartData = {
      labels: salesLabels.length > 0 ? salesLabels : ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
      datasets: [
        {
          label: 'Ventes (FCFA)',
          data: salesValues.length > 0 ? salesValues : [12000, 19000, 15000, 25000, 22000, 30000],
          backgroundColor: 'rgba(230, 57, 70, 0.6)',
          borderColor: 'rgba(230, 57, 70, 1)',
          borderWidth: 2,
          tension: 0.4,
        }
      ]
    };

    const pieData = {
      labels: statsData.top_products?.map(p => p.name) || ['Produit 1', 'Produit 2', 'Produit 3'],
      datasets: [
        {
          data: statsData.top_products?.map(p => p.total) || [30, 25, 20, 15, 10],
          backgroundColor: ['#E63946', '#F4A261', '#2A9D8F', '#264653', '#E9C46A'],
          borderWidth: 2,
          borderColor: '#fff',
        }
      ]
    };

    const renderChart = () => {
      switch(selectedChartType) {
        case 'bar':
          return <Bar data={chartData} options={{
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
          }} />;
        case 'line':
          return <Line data={chartData} options={{
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
          }} />;
        case 'pie':
          return <Pie data={pieData} options={{
            responsive: true,
            plugins: { legend: { position: 'right' } }
          }} />;
        default:
          return <Bar data={chartData} />;
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-sm font-medium text-gray-700">Type de graphique :</label>
          <select
            value={selectedChartType}
            onChange={(e) => setSelectedChartType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none text-sm"
          >
            <option value="bar">Histogramme</option>
            <option value="line">Courbe</option>
            <option value="pie">Camembert</option>
          </select>
          <button
            onClick={exportChartPDF}
            className="bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm flex items-center gap-2 ml-auto"
          >
            <FaFilePdf /> Exporter
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="h-80">
            {renderChart()}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Total ventes</p>
            <p className="font-bold text-brand-black">{formatFCFA(statsData.total_revenue || 0)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Commandes</p>
            <p className="font-bold text-brand-black">{statsData.total_orders || 0}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Articles</p>
            <p className="font-bold text-brand-black">{statsData.total_items_sold || 0}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Acheteurs</p>
            <p className="font-bold text-brand-black">{statsData.distinct_buyers || 0}</p>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================

  const renderContent = () => {
    switch(tab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return (
          <div>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex-1 min-w-[200px] relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition text-sm"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition text-sm"
              >
                <option value="">Tous les rôles</option>
                {Object.entries(roleLabels).map(([val, info]) => (
                  <option key={val} value={val}>{info.label}</option>
                ))}
              </select>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FaSpinner className="animate-spin text-brand-red text-3xl" />
              </div>
            ) : (
              <>
                {renderUsersTable()}
                {filteredUsers.length > itemsPerPage && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50 transition"
                      >
                        <FaChevronLeft size={14} />
                      </button>
                      <span className="text-sm">
                        Page {currentPage} / {totalPages(filteredUsers) || 1}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages(filteredUsers), p + 1))}
                        disabled={currentPage === totalPages(filteredUsers)}
                        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50 transition"
                      >
                        <FaChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      case 'categories':
        return (
          <div>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex-1 min-w-[200px] relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une catégorie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition text-sm"
                />
              </div>
            </div>
            {renderCategories()}
          </div>
        );
      case 'orders':
        return (
          <div>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex-1 min-w-[200px] relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une commande..."
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
                <option value="">Tous les statuts</option>
                {Object.entries(statusLabels).map(([val, info]) => (
                  <option key={val} value={val}>{info.label}</option>
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
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FaSpinner className="animate-spin text-brand-red text-3xl" />
              </div>
            ) : (
              <>
                {renderOrdersTable()}
                {filteredOrders.length > itemsPerPage && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50 transition"
                      >
                        <FaChevronLeft size={14} />
                      </button>
                      <span className="text-sm">
                        Page {currentPage} / {totalPages(filteredOrders) || 1}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages(filteredOrders), p + 1))}
                        disabled={currentPage === totalPages(filteredOrders)}
                        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50 transition"
                      >
                        <FaChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      case 'stats':
        return renderStatsSection();
      case 'charts':
        return renderChartsSection();
      default:
        return null;
    }
  };

  // ============================================================
  // RENDU DE LA VUE GLOBALE
  // ============================================================

  const renderOverview = () => {
    if (!overview) {
      return (
        <div className="flex items-center justify-center py-12">
          <FaSpinner className="animate-spin text-brand-red text-3xl" />
          <span className="ml-3 text-gray-500">Chargement des données...</span>
        </div>
      );
    }

    const kpis = [
      { key: 'total_users', label: 'Total Utilisateurs', value: overview.total_users, icon: FaUsers, color: 'blue' },
      { key: 'total_clients', label: 'Clients', value: overview.total_clients, icon: FaUsers, color: 'green' },
      { key: 'total_admins', label: 'Administrateurs', value: overview.total_admins, icon: FaUserCog, color: 'purple' },
      { key: 'total_products', label: 'Produits', value: overview.total_products, icon: FaBox, color: 'orange' },
      { key: 'total_orders', label: 'Commandes', value: overview.total_orders, icon: FaShoppingCart, color: 'yellow' },
      { key: 'total_revenue', label: 'Revenu total', value: formatFCFA(overview.total_revenue), icon: FaMoneyBillWave, color: 'red' },
    ];

    const colorClasses = {
      blue: 'from-blue-50 to-blue-100 border-blue-200',
      green: 'from-green-50 to-green-100 border-green-200',
      purple: 'from-purple-50 to-purple-100 border-purple-200',
      orange: 'from-orange-50 to-orange-100 border-orange-200',
      yellow: 'from-yellow-50 to-yellow-100 border-yellow-200',
      red: 'from-red-50 to-red-100 border-red-200',
    };

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.key}
                onClick={() => handleKpiClick(kpi.key)}
                className={`bg-gradient-to-br ${colorClasses[kpi.color]} rounded-xl p-6 border cursor-pointer hover:scale-105 transition-transform duration-200`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">
                      {kpi.label}
                    </p>
                    <p className="text-2xl font-bold text-brand-black mt-1">
                      {kpi.value}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center">
                    <Icon className="text-brand-red text-2xl" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Cliquez pour voir les détails</p>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            onClick={exportReport}
            className="flex items-center gap-2 bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
          >
            <FaFilePdf /> Exporter le rapport global PDF
          </button>
        </div>
      </>
    );
  };

  // ============================================================
  // RENDU DES CATÉGORIES
  // ============================================================

  const renderCategories = () => {
    const data = getPaginatedData(filteredCategories);
    return (
      <div>
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <form onSubmit={addCategory} className="flex flex-wrap gap-3">
            <input
              placeholder="Nom de la nouvelle catégorie"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition"
            />
            <button
              type="submit"
              className="bg-brand-red text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
            >
              <FaPlus /> Ajouter
            </button>
          </form>
          {categoryError && (
            <p className="text-red-600 text-sm mt-2">{categoryError}</p>
          )}
          {categorySuccess && (
            <p className="text-green-600 text-sm mt-2">{categorySuccess}</p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin text-brand-red text-3xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((c) => (
              <div key={c.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-gray-500">
                      {c.product_count || 0} produit{c.product_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteCategory(c.id)}
                    className="text-red-600 hover:text-red-800 transition p-2 rounded-lg hover:bg-red-50"
                    title="Supprimer"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDU FINAL
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-black">
              Dashboard Super-Administrateur
            </h1>
            <p className="text-sm text-gray-500">
              Gestion globale de la plateforme RedSquare
            </p>
          </div>
          <div className="flex items-center gap-3 mt-3 md:mt-0">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-brand-red hover:text-red-700 transition flex items-center gap-1"
            >
              <FaStore /> Retour à la boutique
            </button>
          </div>
        </div>

        {/* Navigation des onglets */}
        <div className="flex flex-wrap gap-1 mb-6 border-b border-gray-200 bg-white rounded-t-xl px-2">
          {[
            { key: "overview", label: "Vue globale", icon: FaTachometerAlt },
            { key: "users", label: "Utilisateurs", icon: FaUsers },
            { key: "categories", label: "Catégories", icon: FaBox },
            { key: "orders", label: "Commandes", icon: FaShoppingCart },
            { key: "stats", label: "Statistiques & Rapports", icon: FaChartBar },
            { key: "charts", label: "Graphiques", icon: FaChartLine },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setTab(item.key);
                  setCurrentPage(1);
                  setSearchTerm("");
                }}
                className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition relative ${
                  isActive 
                    ? "text-brand-red border-b-2 border-brand-red" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={16} />
                {item.label}
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-red rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Contenu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {renderContent()}
        </div>

        {/* Modales */}
        {renderModal()}
        {renderEditUserModal()}
        {renderOrderDetailModal()}
      </div>
    </div>
  );
  // Ajouter le modal dans le rendu final
{renderAddUserModal()}
}