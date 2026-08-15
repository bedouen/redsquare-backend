import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { formatFCFA } from "../utils/currency";
import {
  FaFilePdf,
  FaEye,
  FaSpinner,
  FaShoppingBag,
  FaCheckCircle,
  FaClock,
  FaCalendarAlt,
  FaArrowLeft,
  FaDownload,
  FaStore,
  FaTruck
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

export default function OrderHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get("/orders/");
      setOrders(response.data.results || response.data || []);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async (orderId) => {
    setDownloading(true);
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
      toast.success("Reçu téléchargé avec succès !");
    } catch (error) {
      toast.error("Erreur lors du téléchargement du reçu");
    } finally {
      setDownloading(false);
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'paid': return <FaCheckCircle className="text-green-500" size={20} />;
      case 'pending': return <FaClock className="text-yellow-500" size={20} />;
      case 'reserved': return <FaCalendarAlt className="text-blue-500" size={20} />;
      case 'shipped': return <FaTruck className="text-purple-500" size={20} />;
      case 'delivered': return <FaStore className="text-green-600" size={20} />;
      case 'cancelled': return <FaClock className="text-red-500" size={20} />;
      default: return <FaClock className="text-gray-500" size={20} />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      paid: "Payée",
      pending: "En attente",
      reserved: "Réservée",
      shipped: "Expédiée",
      delivered: "Livrée",
      cancelled: "Annulée"
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'reserved': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FaSpinner className="animate-spin text-brand-red text-4xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* En-tête */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-brand-red transition p-2 rounded-lg hover:bg-gray-100"
          >
            <FaArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-extrabold text-brand-black">
            Historique des commandes
          </h1>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <FaShoppingBag className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune commande passée</p>
            <p className="text-sm text-gray-400 mt-2">Vos commandes apparaîtront ici</p>
            <Link to="/" className="text-brand-red hover:underline text-sm mt-4 inline-block">
              Découvrir nos produits
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 mt-1 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <p className="font-semibold">
                        Commande #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {order.order_type === 'reservation' && order.pickup_date && (
                        <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                          <FaCalendarAlt size={12} />
                          Retrait prévu : {new Date(order.pickup_date).toLocaleDateString('fr-FR')}
                          {order.pickup_time && ` à ${order.pickup_time.slice(0, 5)}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <span className="font-bold text-brand-black text-lg">
                      {formatFCFA(order.total_amount)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
                  <button
                    onClick={() => viewOrderDetails(order)}
                    className="text-brand-red hover:text-red-700 text-sm font-medium flex items-center gap-1"
                  >
                    <FaEye size={14} /> Voir détails
                  </button>
                  <button
                    onClick={() => downloadReceipt(order.id)}
                    disabled={downloading}
                    className="text-gray-600 hover:text-brand-red text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    {downloading ? (
                      <FaSpinner className="animate-spin" size={14} />
                    ) : (
                      <FaFilePdf size={14} />
                    )}
                    Télécharger le reçu
                  </button>
                  <span className="text-xs text-gray-400 ml-auto">
                    {order.items?.length || 0} article{order.items?.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Détails de la commande */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold">
                Commande #{selectedOrder.id.slice(0, 8).toUpperCase()}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl p-2"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Informations générales */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium">
                    {new Date(selectedOrder.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Statut</p>
                  <p className={`font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium">
                    {selectedOrder.order_type === 'reservation' ? 'Réservation' : 'Paiement direct'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Méthode de paiement</p>
                  <p className="font-medium">
                    {selectedOrder.payment_method === 'orange_money' ? 'Orange Money' :
                     selectedOrder.payment_method === 'mtn_money' ? 'MTN Money' : 'Visa'}
                  </p>
                </div>
                {selectedOrder.order_type === 'reservation' && selectedOrder.pickup_date && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Retrait prévu</p>
                    <p className="font-medium text-blue-600">
                      {new Date(selectedOrder.pickup_date).toLocaleDateString('fr-FR')}
                      {selectedOrder.pickup_time && ` à ${selectedOrder.pickup_time.slice(0, 5)}`}
                    </p>
                  </div>
                )}
                {selectedOrder.delivery_city && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Livraison</p>
                    <p className="font-medium">
                      {selectedOrder.delivery_city} - {selectedOrder.delivery_neighborhood || ''}
                    </p>
                    {selectedOrder.delivery_phone && (
                      <p className="text-sm text-gray-500">Tél: {selectedOrder.delivery_phone}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Articles */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold mb-3">Articles</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-100">
                      {item.product_image && (
                        <img 
                          src={item.product_image} 
                          alt={item.product_name}
                          className="w-12 h-12 object-cover rounded-lg bg-gray-100"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product_name || item.product?.name}</p>
                        <p className="text-xs text-gray-500">Quantité: {item.quantity}</p>
                      </div>
                      <span className="font-medium">{formatFCFA(item.unit_price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totaux */}
              <div className="border-t border-gray-200 pt-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sous-total</span>
                  <span>{formatFCFA(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Frais de livraison</span>
                  <span>{formatFCFA(selectedOrder.delivery_fee)}</span>
                </div>
                {selectedOrder.order_type === 'reservation' && (
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>Paiement</span>
                    <span>À effectuer lors du retrait</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-brand-red">{formatFCFA(selectedOrder.total_amount)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 pt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => downloadReceipt(selectedOrder.id)}
                  disabled={downloading}
                  className="flex-1 bg-brand-red text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {downloading ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaFilePdf />
                  )}
                  Télécharger le reçu
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}