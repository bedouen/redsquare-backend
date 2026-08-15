import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatFCFA } from "../utils/currency";
import { 
  FaShoppingCart, 
  FaTrash, 
  FaPlus, 
  FaMinus, 
  FaArrowLeft, 
  FaCreditCard,
  FaTruck,
  FaStore,
  FaExclamationCircle,
  FaCheckCircle,
  FaSpinner
} from "react-icons/fa";
import { useState } from "react";

export default function Cart() {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);

  const DELIVERY_FEE = 2000;
  const grandTotal = total + DELIVERY_FEE;

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setIsUpdating(true);
    try {
      await updateQuantity(productId, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (productId) => {
    if (window.confirm("Êtes-vous sûr de vouloir retirer cet article du panier ?")) {
      await removeFromCart(productId);
    }
  };

  const handleClearCart = async () => {
    if (items.length === 0) return;
    if (window.confirm("Vider tout le panier ?")) {
      await clearCart();
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-24 h-24 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaShoppingCart className="text-brand-red text-5xl" />
          </div>
          <h2 className="text-2xl font-extrabold text-brand-black mb-2">Votre panier est vide</h2>
          <p className="text-gray-500 mb-6">
            Découvrez nos produits et ajoutez vos articles préférés.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition hover:scale-105"
          >
            <FaArrowLeft /> Découvrir les produits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="text-gray-500 hover:text-brand-red transition p-2 rounded-lg hover:bg-gray-100"
            >
              <FaArrowLeft size={18} />
            </button>
            <h1 className="text-2xl font-extrabold text-brand-black">Mon panier</h1>
            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
              {items.length} article{items.length > 1 ? 's' : ''}
            </span>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-sm text-red-500 hover:text-red-700 transition flex items-center gap-1"
            >
              <FaTrash size={14} /> Vider
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Liste des articles - 2 colonnes */}
          <div className="md:col-span-2 space-y-3">
            {items.map(({ product, quantity }) => {
              const itemTotal = product.unit_price * quantity;
              const isLowStock = product.quantity < 5 && product.quantity > 0;
              const isOutOfStock = product.quantity === 0;

              return (
                <div 
                  key={product.id} 
                  className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start gap-4">
                    {/* Image */}
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {product.image_front || product.image ? (
                        <img 
                          src={product.image_front || product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FaShoppingCart className="text-2xl opacity-30" />
                        </div>
                      )}
                    </div>

                    {/* Infos produit */}
                    <div className="flex-1">
                      <Link 
                        to={`/products/${product.id}`}
                        className="font-semibold text-brand-black hover:text-brand-red transition"
                      >
                        {product.name}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {product.category_name || "Catégorie"}
                      </p>
                      <p className="text-sm font-medium text-brand-black">
                        {formatFCFA(product.unit_price)} / unité
                      </p>
                      
                      {/* Indicateur de stock */}
                      {isOutOfStock && (
                        <p className="text-xs text-red-500 font-medium mt-1">
                          ⚠️ Rupture de stock
                        </p>
                      )}
                      {isLowStock && !isOutOfStock && (
                        <p className="text-xs text-orange-500 font-medium mt-1">
                          ⚠️ Plus que {product.quantity} en stock
                        </p>
                      )}
                    </div>

                    {/* Quantité et prix */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateQuantity(product.id, quantity - 1)}
                          disabled={quantity <= 1 || isUpdating}
                          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaMinus size={12} />
                        </button>
                        <span className="w-10 text-center font-medium">{quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(product.id, quantity + 1)}
                          disabled={quantity >= product.quantity || isUpdating}
                          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaPlus size={12} />
                        </button>
                      </div>
                      <p className="font-bold text-brand-black">
                        {formatFCFA(itemTotal)}
                      </p>
                      <button
                        onClick={() => handleRemoveItem(product.id)}
                        className="text-gray-400 hover:text-red-500 transition text-sm flex items-center gap-1"
                      >
                        <FaTrash size={14} /> Retirer
                      </button>
                    </div>
                  </div>

                  {/* Message de vérification */}
                  {product.quantity > 0 && quantity > product.quantity && (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-700 flex items-center gap-2">
                      <FaExclamationCircle />
                      La quantité demandée dépasse le stock disponible.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Récapitulatif - 1 colonne */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm sticky top-24">
              <h2 className="font-bold text-lg text-brand-black mb-4">Récapitulatif</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-medium">{formatFCFA(total)}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-100 pb-3">
                  <span className="text-gray-600">Frais de livraison</span>
                  <span className="font-medium">{formatFCFA(DELIVERY_FEE)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-brand-red">{formatFCFA(grandTotal)}</span>
                </div>
              </div>

              {/* Options de livraison */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FaTruck />
                  <span>Livraison incluse (2 000 FCFA)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <FaStore />
                  <span>Retrait en magasin disponible</span>
                </div>
              </div>

              {/* Bouton de paiement */}
              <button
                onClick={() => {
                  if (!user) {
                    navigate("/login", { state: { from: "/checkout" } });
                  } else {
                    navigate("/checkout");
                  }
                }}
                disabled={isUpdating}
                className="w-full mt-4 bg-brand-red hover:bg-red-700 text-white py-3.5 rounded-xl font-bold transition hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <FaCreditCard />
                    Passer au paiement
                  </>
                )}
              </button>

              {/* Message d'authentification si non connecté */}
              {!user && (
                <p className="text-xs text-gray-400 text-center mt-2">
                  <FaExclamationCircle className="inline mr-1" />
                  Vous devez être connecté pour passer commande
                </p>
              )}

              {/* Nombre d'articles */}
              <p className="text-xs text-gray-400 text-center mt-3">
                {items.length} article{items.length > 1 ? 's' : ''} dans votre panier
              </p>

              {/* Bouton Continuer les achats */}
              <Link 
                to="/" 
                className="block text-center text-sm text-gray-500 hover:text-brand-red transition mt-3"
              >
                Continuer mes achats
              </Link>
            </div>
          </div>
        </div>

        {/* Note de bas de page */}
        <div className="mt-6 text-center text-xs text-gray-400">
          <p>💰 Paiement sécurisé - Orange Money, MTN Mobile Money, Visa</p>
          <p className="mt-1">🚚 Livraison disponible à Douala, Yaoundé, Bafoussam et Kribi</p>
        </div>
      </div>
    </div>
  );
}