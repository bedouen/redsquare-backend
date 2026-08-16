import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { formatFCFA } from "../../utils/currency";
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaDownload, 
  FaChartBar,
  FaBox,
  FaUsers,
  FaShoppingCart,
  FaFilePdf,
  FaCalendarAlt,
  FaSearch,
  FaFilter,
  FaSort,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaImage,
  FaSpinner,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCreditCard,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaTruck,
  FaStore
} from "react-icons/fa";
import { useCart } from "../../context/CartContext";
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
import { toast } from "react-hot-toast";

// Enregistrer Chart.js
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

const emptyForm = { 
  name: "", 
  description: "", 
  quantity: 0, 
  unit_price: 0, 
  category: "" 
};

const emptyImages = {
  image_front: null,
  image_left: null,
  image_top: null,
  image_right: null
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  // États des onglets
  const [tab, setTab] = useState("products");
  const [chartType, setChartType] = useState('bar');
  const chartRef = useRef(null);
  
  // États des données
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [buyersData, setBuyersData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // États des filtres
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  
  // États du formulaire
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState(emptyImages);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // États des modales
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // ════════════════════════════════════════════════════
  // CHARGEMENT DES DONNÉES
  // ════════════════════════════════════════════════════

  // Charger les produits
  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get("/catalog/products/", { 
        params: { mine: 1 } 
      });
      setProducts(response.data.results || response.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  };

  // Charger les catégories
  const loadCategories = async () => {
    try {
      const response = await api.get("/catalog/categories/");
      setCategories(response.data.results || response.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des catégories:", error);
    }
  };

  // ✅ CHARGER LES STATISTIQUES AVEC ACHETEURS
  const loadStats = async () => {
    setLoading(true);
    try {
      // 1. Charger les statistiques globales
      const response = await api.get("/reports/sales-dashboard/", { 
        params: { date_from: dateFrom, date_to: dateTo } 
      });
      setStats(response.data);
      setSalesData(response.data.per_product || []);
      
      // 2. Vérifier si per_buyer est déjà inclus
      if (response.data.per_buyer && response.data.per_buyer.length > 0) {
        setBuyersData(response.data.per_buyer);
        console.log(`✅ ${response.data.per_buyer.length} acheteurs chargés depuis sales-dashboard`);
      } else {
        // 3. Sinon, charger depuis sales-detail
        await loadBuyersDetail();
      }
      
      // ✅ CORRIGÉ : gère aussi le cas où la réponse est paginée ({results: [...]})
      setOrdersData(response.data.orders?.results || response.data.orders || []);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      toast.error("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  // ✅ CHARGER LES ACHETEURS DEPUIS SALES-DETAIL
  const loadBuyersDetail = async () => {
    try {
      const response = await api.get("/reports/sales-detail/", {
        params: { date_from: dateFrom, date_to: dateTo }
      });
      
      // ✅ CORRIGÉ : extrait bien le tableau même si l'API renvoie une réponse paginée
      const data = response.data.results || response.data || [];
      
      if (data.length === 0) {
        console.log("Aucune donnée de vente trouvée pour cette période");
        setBuyersData([]);
        return;
      }
      
      // Transformer les données pour le tableau
      const formattedData = data.map(item => ({
        id: item.id || Math.random().toString(),
        order_id: item.order_id || '',
        buyer_name: item.buyer_name || 'Client',
        buyer_phone: item.buyer_phone || 'N/A',
        buyer_email: item.buyer_email || '',
        product_name: item.product_name || 'Produit',
        quantity: item.quantity || 0,
        total: item.total || (item.quantity * item.unit_price) || 0,
        unit_price: item.unit_price || 0,
        purchase_date: item.date || item.created_at || new Date().toISOString(),
        purchase_time: item.time || '',
        delivery_city: item.delivery_city || 'Retrait en magasin',
        delivery_neighborhood: item.delivery_neighborhood || '',
        payment_method: item.payment_method || 'N/A',
        transaction_id: item.transaction_id || '',
        status: item.status || 'pending'
      }));
      
      setBuyersData(formattedData);
      console.log(`✅ ${formattedData.length} acheteurs chargés depuis sales-detail`);
      
    } catch (error) {
      console.error("Erreur lors du chargement des acheteurs:", error);
      setBuyersData([]);
    }
  };

  // Charger les commandes détaillées
  const loadOrdersDetail = async () => {
    try {
      const response = await api.get("/reports/sales-detail/", {
        params: { date_from: dateFrom, date_to: dateTo }
      });
      // ✅ CORRIGÉ : extrait bien le tableau même si l'API renvoie une réponse paginée
      setOrdersData(response.data.results || response.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des commandes:", error);
    }
  };

  // ════════════════════════════════════════════════════
  // EFFETS
  // ════════════════════════════════════════════════════

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    if (tab === "stats" || tab === "analytics") {
      loadStats();
      loadOrdersDetail();
    }
  }, [tab, dateFrom, dateTo]);

  // ════════════════════════════════════════════════════
  // FILTRES ET TRI
  // ════════════════════════════════════════════════════

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterCategory) {
      filtered = filtered.filter(p => p.category === filterCategory);
    }
    
    filtered.sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";
      
      if (sortField === "unit_price" || sortField === "quantity") {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else if (sortField === "name" || sortField === "category_name") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [products, searchTerm, filterCategory, sortField, sortDirection]);

  // Pagination
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // ════════════════════════════════════════════════════
  // FORMULAIRES
  // ════════════════════════════════════════════════════

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const resetForm = () => {
    setForm(emptyForm);
    setImages(emptyImages);
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const handleImageChange = (field) => (e) => {
    const file = e.target.files[0];
    if (file) {
      setImages({ ...images, [field]: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!editingId && !images.image_front) {
      setError("La photo de face du produit est obligatoire.");
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    Object.entries(images).forEach(([k, v]) => {
      if (v) fd.append(k, v);
    });

    try {
      setLoading(true);
      if (editingId) {
        await api.patch(`/catalog/products/${editingId}/`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess("Produit modifié avec succès !");
        toast.success("Produit modifié avec succès");
      } else {
        await api.post("/catalog/products/", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess("Produit créé avec succès !");
        toast.success("Produit créé avec succès");
      }
      resetForm();
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'enregistrement.");
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || "",
      quantity: product.quantity,
      unit_price: product.unit_price,
      category: product.category,
    });
    setImages(emptyImages);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;
    try {
      await api.delete(`/catalog/products/${id}/`);
      loadProducts();
      setSuccess("Produit supprimé avec succès.");
      toast.success("Produit supprimé avec succès");
    } catch (error) {
      setError("Erreur lors de la suppression.");
      toast.error("Erreur lors de la suppression");
    }
  };

  // ════════════════════════════════════════════════════
  // EXPORTS PDF
  // ════════════════════════════════════════════════════

  const downloadReport = async () => {
    setExporting(true);
    try {
      const response = await api.get("/reports/sales-pdf/", {
        params: { date_from: dateFrom, date_to: dateTo },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `rapport_ventes_${dateFrom || 'all'}_${dateTo || 'all'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Rapport téléchargé avec succès !");
    } catch (error) {
      toast.error("Erreur lors du téléchargement du rapport");
    } finally {
      setExporting(false);
    }
  };

  const exportChartsPDF = async () => {
    setExporting(true);
    try {
      const canvas = document.getElementById('sales-chart');
      if (canvas) {
        const chartImage = canvas.toDataURL('image/png');
        const response = await api.post("/reports/export-charts-pdf/", {
          charts: {
            sales: stats,
            period: dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : 'Toutes les périodes'
          },
          chartImage: chartImage
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
        toast.success("Graphiques exportés avec succès !");
      }
    } catch (error) {
      toast.error("Erreur lors de l'export des graphiques");
    } finally {
      setExporting(false);
    }
  };

  const quickAddToCart = async (product) => {
    try {
      await addToCart(product.id, 1);
      setSuccess(`${product.name} ajouté au panier !`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Erreur lors de l'ajout au panier.");
    }
  };

  // ════════════════════════════════════════════════════
  // TABLEAUX ET AFFICHAGE
  // ════════════════════════════════════════════════════

  // View order details
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // Préparer les données pour les graphiques
  const prepareChartData = () => {
    if (!stats) return null;
    
    const labels = salesData.map(item => item.product__name || 'Produit');
    const values = salesData.map(item => parseFloat(item.total_revenue || 0));
    const quantities = salesData.map(item => parseInt(item.total_quantity || 0));

    return {
      revenue: {
        labels: labels.length > 0 ? labels : ['Aucune donnée'],
        datasets: [
          {
            label: 'Chiffre d\'affaires (FCFA)',
            data: values.length > 0 ? values : [0],
            backgroundColor: 'rgba(230, 57, 70, 0.6)',
            borderColor: 'rgba(230, 57, 70, 1)',
            borderWidth: 2,
            tension: 0.4,
          }
        ]
      },
      quantity: {
        labels: labels.length > 0 ? labels : ['Aucune donnée'],
        datasets: [
          {
            label: 'Quantités vendues',
            data: quantities.length > 0 ? quantities : [0],
            backgroundColor: 'rgba(52, 152, 219, 0.6)',
            borderColor: 'rgba(52, 152, 219, 1)',
            borderWidth: 2,
            tension: 0.4,
          }
        ]
      }
    };
  };

  const chartData = prepareChartData();

  // Rendu du tableau des produits
  const renderProductsTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left bg-gray-50 border-b border-gray-200">
            <th className="py-3 px-3 font-semibold text-xs uppercase tracking-wider">Produit</th>
            <th className="py-3 px-3 font-semibold text-xs uppercase tracking-wider">Catégorie</th>
            <th className="py-3 px-3 font-semibold text-xs uppercase tracking-wider text-right">Prix</th>
            <th className="py-3 px-3 font-semibold text-xs uppercase tracking-wider text-center">Stock</th>
            <th className="py-3 px-3 font-semibold text-xs uppercase tracking-wider text-center">Images</th>
            <th className="py-3 px-3 font-semibold text-xs uppercase tracking-wider text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedProducts.length === 0 ? (
            <tr>
              <td colSpan="6" className="py-8 text-center text-gray-500">
                Aucun produit trouvé
              </td>
            </tr>
          ) : (
            paginatedProducts.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={p.image_front || p.image} 
                      alt={p.name} 
                      className="w-12 h-12 object-cover rounded-lg bg-gray-100"
                    />
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[150px]">
                        {p.description || "Pas de description"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {p.category_name || "N/A"}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-semibold">
                  {formatFCFA(p.unit_price)}
                </td>
                <td className="py-3 px-3 text-center">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    p.quantity > 10 ? "bg-green-100 text-green-700" :
                    p.quantity > 0 ? "bg-orange-100 text-orange-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {p.quantity}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                    <FaImage className="text-brand-red" />
                    {[p.image_left, p.image_top, p.image_right].filter(Boolean).length + 1}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-blue-600 hover:text-blue-800 transition"
                      title="Modifier"
                    >
                      <FaEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:text-red-800 transition"
                      title="Supprimer"
                    >
                      <FaTrash size={16} />
                    </button>
                    <button
                      onClick={() => navigate(`/products/${p.id}`)}
                      className="text-gray-600 hover:text-gray-800 transition"
                      title="Voir"
                    >
                      <FaEye size={16} />
                    </button>
                    {p.quantity > 0 && (
                      <button
                        onClick={() => quickAddToCart(p)}
                        className="text-brand-red hover:text-red-700 transition"
                        title="Ajouter au panier"
                      >
                        <FaShoppingCart size={14} />
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
  );

  // Pagination controls
  const renderPagination = () => (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-500">
        Affichage de {Math.min(filteredProducts.length, (currentPage - 1) * itemsPerPage + 1)} 
        à {Math.min(filteredProducts.length, currentPage * itemsPerPage)} 
        sur {filteredProducts.length} produits
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
        >
          <FaChevronLeft size={14} />
        </button>
        <span className="text-sm font-medium">
          Page {currentPage} / {totalPages || 1}
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
        >
          <FaChevronRight size={14} />
        </button>
      </div>
    </div>
  );

  // Rendu du formulaire d'ajout de produit
  const renderProductForm = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-20">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        {editingId ? <FaEdit className="text-brand-red" /> : <FaPlus className="text-brand-red" />}
        {editingId ? "Modifier le produit" : "Ajouter un nouveau produit"}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Nom du produit <span className="text-brand-red">*</span>
          </label>
          <input
            required
            placeholder="Ex: Smartphone Galaxy A15"
            value={form.name}
            onChange={update("name")}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Description
          </label>
          <textarea
            placeholder="Description détaillée du produit..."
            value={form.description}
            onChange={update("description")}
            rows="3"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Quantité <span className="text-brand-red">*</span>
            </label>
            <input
              required
              type="number"
              min="0"
              placeholder="Quantité"
              value={form.quantity}
              onChange={update("quantity")}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Prix (FCFA) <span className="text-brand-red">*</span>
            </label>
            <input
              required
              type="number"
              min="0"
              step="100"
              placeholder="Ex: 145000"
              value={form.unit_price}
              onChange={update("unit_price")}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Catégorie <span className="text-brand-red">*</span>
          </label>
          <select
            required
            value={form.category}
            onChange={update("category")}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition"
          >
            <option value="">Sélectionner une catégorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.product_count || 0} produits)
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Photos du produit
          </label>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Vue de face <span className="text-brand-red">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange("image_front")}
                className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-red/10 file:text-brand-red hover:file:bg-brand-red/20 transition"
                required={!editingId}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Vue de gauche
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange("image_left")}
                className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Vue de dessus
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange("image_top")}
                className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Vue de droite
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange("image_right")}
                className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200 transition"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <FaTimes className="text-red-500" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm flex items-center gap-2">
            <span className="text-green-500 text-lg">✓</span>
            {success}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-brand-red hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-semibold transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                En cours...
              </>
            ) : editingId ? (
              "Enregistrer les modifications"
            ) : (
              "Créer le produit"
            )}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
            >
              Annuler
            </button>
          )}
        </div>
      </form>
    </div>
  );

  // ════════════════════════════════════════════════════
  // RENDU DES ACHETEURS DÉTAILLÉS
  // ════════════════════════════════════════════════════

  const renderBuyersDetail = () => {
    if (!buyersData || buyersData.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-xl">
          <FaUsers className="text-4xl text-gray-300 mx-auto mb-3" />
          <p>Aucun acheteur sur cette période</p>
          <p className="text-sm text-gray-400 mt-1">
            {dateFrom && dateTo ? `Période: ${dateFrom} au ${dateTo}` : 'Toutes les périodes'}
          </p>
          <button
            onClick={loadStats}
            className="mt-3 text-brand-red hover:underline text-sm"
          >
            Rafraîchir les données
          </button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Client</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Contact</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Produit</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-center">Quantité</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-right">Montant</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Date</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Livraison</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Paiement</th>
              <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {buyersData.slice(0, 50).map((row, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <FaUser className="text-gray-400" />
                    <span className="font-medium">{row.buyer_name || "N/A"}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-xs">
                      <FaPhone size={10} /> {row.buyer_phone || "N/A"}
                    </span>
                    {row.buyer_email && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <FaEnvelope size={10} /> {row.buyer_email}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 font-medium">{row.product_name || "N/A"}</td>
                <td className="py-3 px-4 text-center font-semibold">{row.quantity || 0}</td>
                <td className="py-3 px-4 text-right font-semibold text-brand-red">
                  {formatFCFA(row.total || 0)}
                </td>
                <td className="py-3 px-4 text-sm">
                  {row.purchase_date ? new Date(row.purchase_date).toLocaleDateString('fr-FR') : "N/A"}
                  {row.purchase_time && (
                    <span className="text-xs text-gray-400 block">
                      {row.purchase_time}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm">
                  {row.delivery_city && row.delivery_city !== "Retrait en magasin" ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1">
                        <FaMapMarkerAlt size={10} className="text-brand-red" />
                        {row.delivery_city}
                      </span>
                      {row.delivery_neighborhood && (
                        <span className="text-xs text-gray-400">{row.delivery_neighborhood}</span>
                      )}
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400">
                      <FaStore size={10} /> Retrait magasin
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span className="flex items-center gap-1">
                      {row.payment_method === 'orange_money' ? <FaMoneyBillWave className="text-orange-500" /> :
                       row.payment_method === 'mtn_money' ? <FaMoneyBillWave className="text-yellow-500" /> :
                       row.payment_method === 'visa' ? <FaCreditCard className="text-blue-500" /> :
                       <FaStore className="text-gray-400" />}
                      {row.payment_method === 'orange_money' ? 'Orange Money' :
                       row.payment_method === 'mtn_money' ? 'MTN Money' :
                       row.payment_method === 'visa' ? 'Visa' :
                       row.payment_method === 'reservation' ? 'Réservation' :
                       row.payment_method || 'N/A'}
                    </span>
                    {row.transaction_id && (
                      <span className="text-[10px] text-gray-400">Réf: {row.transaction_id}</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => {
                      const order = ordersData.find(o => o.id === row.order_id);
                      if (order) viewOrderDetails(order);
                    }}
                    className="text-brand-red hover:text-red-700 transition"
                    title="Voir détails"
                  >
                    <FaEye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {buyersData.length > 50 && (
          <p className="text-sm text-gray-500 text-center py-4">
            ... et {buyersData.length - 50} autres acheteurs
          </p>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════
  // RENDU DES GRAPHIQUES
  // ════════════════════════════════════════════════════

  const renderChartsSection = () => {
    if (!stats || !chartData) {
      return (
        <div className="text-center py-12">
          <FaChartBar className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune donnée disponible pour les graphiques</p>
          <button
            onClick={loadStats}
            className="mt-4 bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Charger les données
          </button>
        </div>
      );
    }

    const renderChart = () => {
      const data = chartData.revenue;
      switch(chartType) {
        case 'bar':
          return <Bar data={data} options={{
            responsive: true,
            plugins: { 
              legend: { position: 'top' },
              title: { display: true, text: 'Ventes par produit (FCFA)' }
            },
            scales: { y: { beginAtZero: true } }
          }} />;
        case 'line':
          return <Line data={data} options={{
            responsive: true,
            plugins: { 
              legend: { position: 'top' },
              title: { display: true, text: 'Évolution des ventes par produit (FCFA)' }
            },
            scales: { y: { beginAtZero: true } }
          }} />;
        case 'pie':
          const pieData = {
            labels: data.labels,
            datasets: [{
              data: data.datasets[0].data,
              backgroundColor: ['#E63946', '#F4A261', '#2A9D8F', '#264653', '#E9C46A', '#8ECAE6', '#FFB6C1', '#98D8C8'],
              borderWidth: 2,
              borderColor: '#fff',
            }]
          };
          return <Pie data={pieData} options={{
            responsive: true,
            plugins: { 
              legend: { position: 'right' },
              title: { display: true, text: 'Répartition des ventes par produit' }
            }
          }} />;
        default:
          return <Bar data={data} />;
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Type de graphique :</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none text-sm"
          >
            <option value="bar">Histogramme</option>
            <option value="line">Courbe</option>
            <option value="pie">Camembert</option>
          </select>
          <button
            onClick={exportChartsPDF}
            disabled={exporting}
            className="bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm flex items-center gap-2 ml-auto disabled:opacity-50"
          >
            {exporting ? <FaSpinner className="animate-spin" /> : <FaFilePdf />}
            Exporter les graphiques
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="h-96" id="chart-container">
            <canvas id="sales-chart">
              {renderChart()}
            </canvas>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Chiffre d'affaires</p>
            <p className="font-bold text-brand-black">{formatFCFA(stats.totals?.total_revenue || 0)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Articles vendus</p>
            <p className="font-bold text-brand-black">{stats.totals?.total_items_sold || 0}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Commandes</p>
            <p className="font-bold text-brand-black">{stats.total_orders || 0}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Acheteurs uniques</p>
            <p className="font-bold text-brand-black">{stats.totals?.distinct_buyers || 0}</p>
          </div>
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════
  // MODAL DES DÉTAILS DE COMMANDE
  // ════════════════════════════════════════════════════

  const renderOrderModal = () => {
    if (!showOrderModal || !selectedOrder) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowOrderModal(false)}>
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">
              Détails de la commande #{selectedOrder.id?.slice(0, 8).toUpperCase() || 'N/A'}
            </h3>
            <button
              onClick={() => setShowOrderModal(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Client</p>
                <p className="font-medium">{selectedOrder.buyer_name || 'N/A'}</p>
                <p className="text-xs text-gray-400">{selectedOrder.buyer_phone || ''}</p>
              </div>
              <div>
                <p className="text-gray-500">Total</p>
                <p className="font-bold text-brand-red">{formatFCFA(selectedOrder.total_amount)}</p>
              </div>
              <div>
                <p className="text-gray-500">Statut</p>
                <p className="font-medium">
                  {selectedOrder.status === 'paid' ? '✅ Payée' :
                   selectedOrder.status === 'pending' ? '⏳ En attente' :
                   selectedOrder.status === 'reserved' ? '📋 Réservée' :
                   selectedOrder.status === 'shipped' ? '🚚 Expédiée' :
                   selectedOrder.status === 'delivered' ? '📦 Livrée' :
                   selectedOrder.status || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('fr-FR') : 'N/A'}</p>
              </div>
              {selectedOrder.payment_method && (
                <div className="col-span-2">
                  <p className="text-gray-500">Méthode de paiement</p>
                  <p className="font-medium">
                    {selectedOrder.payment_method === 'orange_money' ? 'Orange Money' :
                     selectedOrder.payment_method === 'mtn_money' ? 'MTN Money' :
                     selectedOrder.payment_method === 'visa' ? 'Visa' :
                     selectedOrder.payment_method === 'reservation' ? 'Réservation' :
                     selectedOrder.payment_method || 'N/A'}
                  </p>
                </div>
              )}
              {selectedOrder.delivery_city && (
                <div className="col-span-2">
                  <p className="text-gray-500">Livraison</p>
                  <p className="font-medium">
                    {selectedOrder.delivery_city} {selectedOrder.delivery_neighborhood ? `- ${selectedOrder.delivery_neighborhood}` : ''}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold mb-2">Articles</h4>
              <div className="space-y-2">
                {(selectedOrder.items || []).map((item) => (
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

            <div className="border-t border-gray-200 pt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════
  // RENDU PRINCIPAL
  // ════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-black">
              Dashboard Administrateur
            </h1>
            <p className="text-sm text-gray-500">
              Gérez vos produits et suivez vos ventes
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-sm text-brand-red hover:text-red-700 transition flex items-center gap-1"
          >
            <FaShoppingCart /> Retour à la boutique
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setTab("products")}
            className={`px-4 py-2.5 font-semibold text-sm transition relative ${
              tab === "products" 
                ? "text-brand-red border-b-2 border-brand-red" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaBox className="inline mr-2" />
            Mes produits
            <span className="ml-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
              {products.length}
            </span>
          </button>
          <button
            onClick={() => setTab("stats")}
            className={`px-4 py-2.5 font-semibold text-sm transition relative ${
              tab === "stats" 
                ? "text-brand-red border-b-2 border-brand-red" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaChartBar className="inline mr-2" />
            Statistiques & Rapports
          </button>
          <button
            onClick={() => setTab("analytics")}
            className={`px-4 py-2.5 font-semibold text-sm transition relative ${
              tab === "analytics" 
                ? "text-brand-red border-b-2 border-brand-red" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaChartBar className="inline mr-2" />
            Graphiques
          </button>
        </div>

        {/* Onglet Produits */}
        {tab === "products" && (
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              {renderProductForm()}
            </div>
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <FaBox className="text-brand-red" />
                    Tous mes produits ({products.length})
                  </h2>
                </div>

                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="flex-1 min-w-[200px] relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un produit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition"
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.product_count || 0})
                      </option>
                    ))}
                  </select>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition"
                  >
                    <option value="name">Nom</option>
                    <option value="unit_price">Prix</option>
                    <option value="quantity">Stock</option>
                    <option value="created_at">Date</option>
                  </select>
                  <button
                    onClick={() => setSortDirection(dir => dir === "asc" ? "desc" : "asc")}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-1"
                  >
                    <FaSort />
                    {sortDirection === "asc" ? "A→Z" : "Z→A"}
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <FaSpinner className="animate-spin text-brand-red text-3xl" />
                  </div>
                ) : (
                  <>
                    {renderProductsTable()}
                    {filteredProducts.length > itemsPerPage && renderPagination()}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Onglet Statistiques */}
        {tab === "stats" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FaChartBar className="text-brand-red" />
                Statistiques & Rapports
              </h2>
            </div>

            <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  <FaCalendarAlt className="inline mr-1" /> Du
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  <FaCalendarAlt className="inline mr-1" /> Au
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red outline-none transition"
                />
              </div>
              <button
                onClick={loadStats}
                className="bg-brand-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
              >
                <FaFilter /> Filtrer
              </button>
              <button
                onClick={loadBuyersDetail}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
              >
                <FaUsers /> Charger acheteurs
              </button>
              <button
                onClick={downloadReport}
                disabled={exporting}
                className="bg-brand-red text-white px-6 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {exporting ? <FaSpinner className="animate-spin" /> : <FaFilePdf />}
                Télécharger PDF
              </button>
            </div>

            {stats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">
                      Chiffre d'affaires
                    </p>
                    <p className="text-2xl font-bold text-brand-black">
                      {formatFCFA(stats.totals?.total_revenue || 0)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">
                      Articles vendus
                    </p>
                    <p className="text-2xl font-bold text-brand-black">
                      {stats.totals?.total_items_sold || 0}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">
                      Commandes
                    </p>
                    <p className="text-2xl font-bold text-brand-black">
                      {stats.total_orders || 0}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">
                      Acheteurs distincts
                    </p>
                    <p className="text-2xl font-bold text-brand-black">
                      {stats.totals?.distinct_buyers || 0}
                    </p>
                  </div>
                </div>

                {/* Acheteurs détaillés */}
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <FaUsers className="text-brand-red" />
                  Détail des acheteurs
                  <span className="text-xs text-gray-400 font-normal">
                    ({buyersData.length} acheteurs)
                  </span>
                </h3>
                {renderBuyersDetail()}
              </>
            )}
          </div>
        )}

        {/* Onglet Graphiques */}
        {tab === "analytics" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
              <FaChartBar className="text-brand-red" />
              Graphiques de ventes
            </h2>
            {renderChartsSection()}
          </div>
        )}

        {/* Modal des détails de commande */}
        {renderOrderModal()}
      </div>
    </div>
  );
}