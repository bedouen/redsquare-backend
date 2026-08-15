import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatFCFA } from "../utils/currency";
import {
  FaTruck,
  FaStore,
  FaPhone,
  FaCity,
  FaMapMarkerAlt,
  FaCreditCard,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaArrowLeft,
  FaFilePdf,
  FaWhatsapp,
  FaMoneyBillWave,
  FaMobileAlt,
  FaCalendarAlt,
  FaClock,
  FaPlus
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const DELIVERY_FEE = 2000;

export default function Checkout() {
  const { items, total, clearCart, addToHistory } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [wantsDelivery, setWantsDelivery] = useState(true);
  const [orderType, setOrderType] = useState("payment");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [form, setForm] = useState({
    delivery_phone: user?.phone_number || "",
    delivery_city: user?.city || "",
    delivery_neighborhood: user?.neighborhood || "",
    delivery_address_details: "",
    payment_method: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [newPaymentData, setNewPaymentData] = useState({});
  const [isReservationConfirmed, setIsReservationConfirmed] = useState(false);

  // Charger les méthodes de paiement de l'utilisateur
  useEffect(() => {
    if (user) {
      loadPaymentMethods();
    }
  }, [user]);

  const loadPaymentMethods = async () => {
    try {
      const response = await api.get("/payments/methods/");
      const methods = response.data.results || response.data || [];
      setPaymentMethods(methods);
      
      const defaultMethod = methods.find(m => m.is_default);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod);
        setForm(prev => ({ ...prev, payment_method: defaultMethod.payment_type }));
      }
    } catch (error) {
      console.error("Erreur chargement méthodes:", error);
    }
  };

  // Rediriger si le panier est vide
  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart");
    }
  }, [items, navigate]);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setTouched({ ...touched, [field]: true });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {};

    // Validation pour la réservation
    if (orderType === "reservation") {
      if (!pickupDate) {
        newErrors.pickupDate = "La date de retrait est requise";
      }
      if (!pickupTime) {
        newErrors.pickupTime = "L'heure de retrait est requise";
      }
    }

    // Validation pour le paiement
    if (orderType === "payment") {
      if (!selectedPaymentMethod && !showNewPaymentForm) {
        newErrors.payment_method = "Veuillez sélectionner une méthode de paiement";
      }
      if (showNewPaymentForm) {
        if (!newPaymentData.phone_number && !newPaymentData.card_number) {
          newErrors.new_payment = "Veuillez remplir les informations de paiement";
        }
      }
    }

    if (wantsDelivery) {
      if (!form.delivery_phone.trim()) {
        newErrors.delivery_phone = "Le numéro de téléphone est requis";
      }
      if (!form.delivery_city.trim()) {
        newErrors.delivery_city = "La ville est requise";
      }
      if (!form.delivery_neighborhood.trim()) {
        newErrors.delivery_neighborhood = "Le quartier est requis";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Télécharger le reçu PDF
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
      toast.success("Reçu téléchargé !");
    } catch (error) {
      console.error("Erreur téléchargement reçu:", error);
      toast.error("Erreur lors du téléchargement du reçu");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const allTouched = {};
    Object.keys(form).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    setLoading(true);
    try {
      // Pour une réservation
      if (orderType === "reservation") {
        const payload = {
          items: items.map((i) => ({
            product_id: i.product.id || i.product_id,
            quantity: i.quantity
          })),
          order_type: "reservation",
          payment_method: "reservation",
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          ...(wantsDelivery ? {
            delivery_phone: form.delivery_phone,
            delivery_city: form.delivery_city,
            delivery_neighborhood: form.delivery_neighborhood,
            delivery_address_details: form.delivery_address_details || "",
          } : {}),
        };

        console.log("Payload réservation:", payload);

        const { data: order } = await api.post("/orders/", payload);
        setOrderId(order.id);
        
        // Ajouter à l'historique local
        addToHistory({
          ...order,
          userId: user?.id,
          orderType: "reservation",
          date: new Date().toISOString(),
          items: items,
          total: total + (wantsDelivery ? DELIVERY_FEE : 0)
        });

        clearCart();
        setIsReservationConfirmed(true);
        toast.success("✅ Réservation confirmée ! Un rappel vous sera envoyé par notre service client.");
        
        // Télécharger le reçu de confirmation
        try {
          await downloadReceipt(order.id);
        } catch (receiptError) {
          console.error("Erreur téléchargement reçu:", receiptError);
        }
        
        // Rediriger vers l'historique après 2 secondes
        setTimeout(() => {
          navigate("/order-history");
        }, 3000);
        
      } else {
        // Pour un paiement, vérifier la méthode de paiement
        let paymentData = {};
        
        if (showNewPaymentForm) {
          // Créer une nouvelle méthode de paiement
          const methodPayload = {
            payment_type: form.payment_method || "orange_money",
            ...newPaymentData
          };
          const methodResponse = await api.post("/payments/methods/", methodPayload);
          const newMethod = methodResponse.data;
          setSelectedPaymentMethod(newMethod);
          paymentData = { payment_method_id: newMethod.id };
        } else if (selectedPaymentMethod) {
          paymentData = { payment_method_id: selectedPaymentMethod.id };
        } else {
          toast.error("Veuillez sélectionner une méthode de paiement");
          setLoading(false);
          return;
        }

        const payload = {
          items: items.map((i) => ({
            product_id: i.product.id || i.product_id,
            quantity: i.quantity
          })),
          order_type: "payment",
          payment_method: form.payment_method || selectedPaymentMethod?.payment_type || "orange_money",
          ...(wantsDelivery ? {
            delivery_phone: form.delivery_phone,
            delivery_city: form.delivery_city,
            delivery_neighborhood: form.delivery_neighborhood,
            delivery_address_details: form.delivery_address_details || "",
          } : {}),
        };

        console.log("Payload paiement:", payload);

        const { data: order } = await api.post("/orders/", payload);
        setOrderId(order.id);

        // Initier le paiement
        const paymentPayload = {
          order_id: order.id,
          payment_type: form.payment_method || selectedPaymentMethod?.payment_type || "orange_money",
          payment_data: newPaymentData
        };

        const { data: payment } = await api.post("/payments/initiate/", paymentPayload);
        
        addToHistory({
          ...order,
          userId: user?.id,
          orderType: "payment",
          date: new Date().toISOString(),
          items: items,
          total: total + (wantsDelivery ? DELIVERY_FEE : 0)
        });

        clearCart();
        setReceiptUrl(payment.receipt_pdf_url);
        toast.success("✅ Paiement effectué avec succès !");
        
        // Télécharger le reçu
        if (payment.receipt_pdf_url) {
          setTimeout(() => {
            downloadReceipt(order.id);
          }, 1000);
        }
      }
      
    } catch (err) {
      console.error("Erreur complète:", err);
      const data = err.response?.data;
      console.error("Données d'erreur:", data);
      
      let errorMsg = "Erreur lors de la commande.";
      if (typeof data === 'object') {
        if (data.detail) {
          errorMsg = data.detail;
        } else if (data.error) {
          errorMsg = data.error;
        } else {
          errorMsg = Object.values(data).flat().join(" ");
        }
      }
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Rendu du formulaire de paiement
  const renderPaymentForm = () => {
    if (orderType === "reservation") {
      return null;
    }

    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="font-semibold text-brand-black mb-4">Méthode de paiement</h2>
        
        {/* Méthodes existantes */}
        {paymentMethods.length > 0 && (
          <div className="space-y-3 mb-4">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => {
                  setSelectedPaymentMethod(method);
                  setForm(prev => ({ ...prev, payment_method: method.payment_type }));
                  setShowNewPaymentForm(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition ${
                  selectedPaymentMethod?.id === method.id && !showNewPaymentForm
                    ? "border-brand-red bg-brand-red/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  {method.payment_type === "visa" ? (
                    <FaCreditCard className="text-brand-red text-xl" />
                  ) : (
                    <FaMobileAlt className="text-brand-red text-xl" />
                  )}
                  <div className="text-left">
                    <p className="font-medium">
                      {method.payment_type === "orange_money" ? "Orange Money" :
                       method.payment_type === "mtn_money" ? "MTN Money" : "Visa"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {method.phone_number || method.mask_card_number?.() || "N/A"}
                    </p>
                  </div>
                </div>
                {selectedPaymentMethod?.id === method.id && !showNewPaymentForm && (
                  <FaCheckCircle className="text-brand-red" />
                )}
              </button>
            ))}
            
            <button
              type="button"
              onClick={() => {
                setShowNewPaymentForm(!showNewPaymentForm);
                setSelectedPaymentMethod(null);
                if (!showNewPaymentForm) {
                  setForm(prev => ({ ...prev, payment_method: "" }));
                }
              }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-red transition"
            >
              <FaPlus className="text-brand-red" />
              <span className="text-sm font-medium">Ajouter une nouvelle méthode</span>
            </button>
          </div>
        )}

        {/* Nouvelle méthode de paiement */}
        {showNewPaymentForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-medium text-sm mb-3">Nouvelle méthode de paiement</h3>
            
            <div className="grid grid-cols-3 gap-2 mb-3">
              {["orange_money", "mtn_money", "visa"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, payment_method: type }))}
                  className={`p-2 rounded-lg border-2 text-center transition ${
                    form.payment_method === type
                      ? "border-brand-red bg-brand-red/5 text-brand-red"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-xs font-medium">
                    {type === "orange_money" ? "Orange Money" :
                     type === "mtn_money" ? "MTN Money" : "Visa"}
                  </div>
                </button>
              ))}
            </div>

            {form.payment_method === "orange_money" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro Orange Money <span className="text-brand-red">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="6XXXXXXXX"
                  value={newPaymentData.phone_number || ""}
                  onChange={(e) => setNewPaymentData({ ...newPaymentData, phone_number: e.target.value, operator: "orange" })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none transition"
                />
              </div>
            )}

            {form.payment_method === "mtn_money" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro MTN Money <span className="text-brand-red">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="6XXXXXXXX"
                  value={newPaymentData.phone_number || ""}
                  onChange={(e) => setNewPaymentData({ ...newPaymentData, phone_number: e.target.value, operator: "mtn" })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none transition"
                />
              </div>
            )}

            {form.payment_method === "visa" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de carte <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="4111 1111 1111 1111"
                    value={newPaymentData.card_number || ""}
                    onChange={(e) => setNewPaymentData({ ...newPaymentData, card_number: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du titulaire <span className="text-brand-red">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Jean Dupont"
                    value={newPaymentData.card_holder_name || ""}
                    onChange={(e) => setNewPaymentData({ ...newPaymentData, card_holder_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none transition"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiration <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YYYY"
                      value={newPaymentData.card_expiry || ""}
                      onChange={(e) => setNewPaymentData({ ...newPaymentData, card_expiry: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV <span className="text-brand-red">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="123"
                      maxLength="4"
                      value={newPaymentData.card_cvv || ""}
                      onChange={(e) => setNewPaymentData({ ...newPaymentData, card_cvv: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {touched.payment_method && errors.payment_method && (
              <p className="text-red-500 text-xs mt-2">{errors.payment_method}</p>
            )}
          </div>
        )}

        {paymentMethods.length === 0 && !showNewPaymentForm && (
          <button
            type="button"
            onClick={() => setShowNewPaymentForm(true)}
            className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-red transition text-center"
          >
            <FaPlus className="mx-auto text-brand-red text-2xl mb-2" />
            <p className="text-sm font-medium">Ajouter une méthode de paiement</p>
          </button>
        )}
      </div>
    );
  };

  // Écran de succès
  if (receiptUrl || isReservationConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <FaCheckCircle className="text-green-500 text-4xl" />
          </div>
          <h1 className="text-2xl font-extrabold text-brand-black mb-2">
            {orderType === "reservation" ? "Réservation confirmée ! 📋" : "Paiement réussi ! 🎉"}
          </h1>
          <p className="text-gray-500 mb-2">
            {orderType === "reservation" 
              ? "Votre réservation a été enregistrée. Un rappel vous sera envoyé par notre service client."
              : "Votre commande a été confirmée."}
          </p>
          {orderType === "reservation" && pickupDate && (
            <p className="text-sm text-gray-600 mb-2">
              Retrait prévu le <strong>{new Date(pickupDate).toLocaleDateString('fr-FR')}</strong> à <strong>{pickupTime}</strong>
            </p>
          )}
          {orderId && (
            <p className="text-xs text-gray-400 mb-4">
              Commande #{orderId.slice(0, 8).toUpperCase()}
            </p>
          )}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => downloadReceipt(orderId)}
              className="flex items-center justify-center gap-2 bg-brand-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition hover:scale-105 active:scale-95"
            >
              <FaFilePdf /> Télécharger le reçu PDF
            </button>
            <button
              onClick={() => navigate("/order-history")}
              className="text-brand-red hover:underline text-sm font-medium"
            >
              Voir mon historique
            </button>
            <button
              onClick={() => navigate("/")}
              className="text-gray-500 hover:text-gray-700 text-sm transition"
            >
              Continuer mes achats
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/cart")}
            className="flex items-center gap-2 text-gray-500 hover:text-brand-red transition text-sm"
          >
            <FaArrowLeft size={14} /> Retour au panier
          </button>
          <h1 className="text-2xl font-extrabold text-brand-black">Paiement</h1>
          <div className="w-20"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Formulaire - 2 colonnes */}
          <div className="md:col-span-2 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type de commande */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-semibold text-brand-black mb-4">Type de commande</h2>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType("payment");
                      setShowPaymentForm(true);
                    }}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition ${
                      orderType === "payment"
                        ? "border-brand-red bg-brand-red/5 text-brand-red"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <FaMoneyBillWave className="text-lg" />
                    <div className="text-left">
                      <p className="font-medium text-sm">Paiement</p>
                      <p className="text-xs text-gray-500">Payer maintenant</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType("reservation");
                      setShowPaymentForm(false);
                      setForm(prev => ({ ...prev, payment_method: "" }));
                    }}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition ${
                      orderType === "reservation"
                        ? "border-yellow-500 bg-yellow-500/5 text-yellow-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <FaCalendarAlt className="text-lg" />
                    <div className="text-left">
                      <p className="font-medium text-sm">Réservation</p>
                      <p className="text-xs text-gray-500">Payer à l'arrivée</p>
                    </div>
                  </button>
                </div>

                {/* Champs pour la réservation */}
                {orderType === "reservation" && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-sm font-medium text-yellow-700 mb-3">
                      📋 Informations de réservation
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date de retrait <span className="text-brand-red">*</span>
                        </label>
                        <div className="relative">
                          <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="date"
                            min={minDateStr}
                            value={pickupDate}
                            onChange={(e) => {
                              setPickupDate(e.target.value);
                              setTouched({ ...touched, pickupDate: true });
                            }}
                            className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                              touched.pickupDate && errors.pickupDate
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-300 focus:ring-brand-red focus:border-brand-red"
                            }`}
                          />
                        </div>
                        {touched.pickupDate && errors.pickupDate && (
                          <p className="text-red-500 text-xs mt-1">{errors.pickupDate}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Heure de retrait <span className="text-brand-red">*</span>
                        </label>
                        <div className="relative">
                          <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="time"
                            min="08:00"
                            max="18:00"
                            value={pickupTime}
                            onChange={(e) => {
                              setPickupTime(e.target.value);
                              setTouched({ ...touched, pickupTime: true });
                            }}
                            className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                              touched.pickupTime && errors.pickupTime
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-300 focus:ring-brand-red focus:border-brand-red"
                            }`}
                          />
                        </div>
                        {touched.pickupTime && errors.pickupTime && (
                          <p className="text-red-500 text-xs mt-1">{errors.pickupTime}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">Horaires: 8h00 - 18h00</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Option de livraison */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-semibold text-brand-black mb-4">Options de livraison</h2>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWantsDelivery(true)}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition ${
                      wantsDelivery
                        ? "border-brand-red bg-brand-red/5 text-brand-red"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <FaTruck className="text-lg" />
                    <div className="text-left">
                      <p className="font-medium text-sm">Livraison</p>
                      <p className="text-xs text-gray-500">+ {formatFCFA(DELIVERY_FEE)}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWantsDelivery(false)}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition ${
                      !wantsDelivery
                        ? "border-brand-red bg-brand-red/5 text-brand-red"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <FaStore className="text-lg" />
                    <div className="text-left">
                      <p className="font-medium text-sm">Retrait en magasin</p>
                      <p className="text-xs text-gray-500">Gratuit</p>
                    </div>
                  </button>
                </div>

                {wantsDelivery && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone de livraison <span className="text-brand-red">*</span>
                      </label>
                      <div className="relative">
                        <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          required={wantsDelivery}
                          placeholder="+237 690 000 000"
                          value={form.delivery_phone}
                          onChange={update("delivery_phone")}
                          onBlur={() => setTouched({ ...touched, delivery_phone: true })}
                          className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                            touched.delivery_phone && errors.delivery_phone
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300 focus:ring-brand-red focus:border-brand-red"
                          }`}
                        />
                      </div>
                      {touched.delivery_phone && errors.delivery_phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.delivery_phone}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ville <span className="text-brand-red">*</span>
                        </label>
                        <div className="relative">
                          <FaCity className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            required={wantsDelivery}
                            placeholder="Douala, Yaoundé..."
                            value={form.delivery_city}
                            onChange={update("delivery_city")}
                            onBlur={() => setTouched({ ...touched, delivery_city: true })}
                            className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                              touched.delivery_city && errors.delivery_city
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-300 focus:ring-brand-red focus:border-brand-red"
                            }`}
                          />
                        </div>
                        {touched.delivery_city && errors.delivery_city && (
                          <p className="text-red-500 text-xs mt-1">{errors.delivery_city}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quartier <span className="text-brand-red">*</span>
                        </label>
                        <div className="relative">
                          <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            required={wantsDelivery}
                            placeholder="Bonamoussadi, Bastos..."
                            value={form.delivery_neighborhood}
                            onChange={update("delivery_neighborhood")}
                            onBlur={() => setTouched({ ...touched, delivery_neighborhood: true })}
                            className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                              touched.delivery_neighborhood && errors.delivery_neighborhood
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-300 focus:ring-brand-red focus:border-brand-red"
                            }`}
                          />
                        </div>
                        {touched.delivery_neighborhood && errors.delivery_neighborhood && (
                          <p className="text-red-500 text-xs mt-1">{errors.delivery_neighborhood}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Détails d'adresse <span className="text-gray-400">(optionnel)</span>
                      </label>
                      <textarea
                        placeholder="Bâtiment, étage, point de repère..."
                        value={form.delivery_address_details}
                        onChange={update("delivery_address_details")}
                        rows="2"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red transition resize-none"
                      />
                    </div>
                  </div>
                )}

                {!wantsDelivery && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm text-gray-600 flex items-center gap-3">
                    <FaStore className="text-brand-red text-lg" />
                    <p>Retrait en magasin virtuel — aucun frais de livraison.</p>
                  </div>
                )}
              </div>

              {/* Formulaire de paiement (uniquement pour paiement direct) */}
              {orderType === "payment" && renderPaymentForm()}

              {/* Erreur générale */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <FaExclamationCircle className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Bouton de confirmation */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-red hover:bg-red-700 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    {orderType === "reservation" ? <FaCalendarAlt /> : <FaMoneyBillWave />}
                    {orderType === "reservation" 
                      ? "Confirmer la réservation"
                      : `Payer ${formatFCFA(total + (wantsDelivery ? DELIVERY_FEE : 0))}`}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Récapitulatif - 1 colonne (plus large) */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm sticky top-24">
              <h2 className="font-semibold text-brand-black mb-4">Récapitulatif</h2>
              
              {/* Articles */}
              <div className="max-h-60 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 py-2 border-b border-gray-100">
                    <img
                      src={item.product.image_front || item.product.image}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded-lg bg-gray-100"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-xs text-gray-500">Quantité: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm">{formatFCFA(item.product.unit_price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Prix */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-medium">{formatFCFA(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {wantsDelivery ? "Frais de livraison" : "Retrait en magasin"}
                  </span>
                  <span className="font-medium">
                    {wantsDelivery ? formatFCFA(DELIVERY_FEE) : "Gratuit"}
                  </span>
                </div>
                {orderType === "reservation" && (
                  <div className="flex justify-between text-sm text-yellow-600">
                    <span>Paiement</span>
                    <span>À effectuer lors du retrait</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold">
                  <span>{orderType === "reservation" ? "Total à payer" : "Total"}</span>
                  <span className="text-brand-red">
                    {formatFCFA(orderType === "reservation" ? 0 : total + (wantsDelivery ? DELIVERY_FEE : 0))}
                  </span>
                </div>
                {orderType === "reservation" && (
                  <p className="text-xs text-yellow-600 text-center mt-2">
                    Paiement à effectuer lors du retrait en magasin
                  </p>
                )}
              </div>

              {/* Contact WhatsApp */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400">Besoin d'aide ?</p>
                <a
                  href="https://wa.me/237690787473"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition"
                >
                  <FaWhatsapp /> Contactez-nous
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-bounce {
            animation: bounce 0.5s ease-in-out 2;
          }
        `}
      </style>
    </div>
  );
}