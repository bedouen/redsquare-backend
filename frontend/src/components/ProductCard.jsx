import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { formatFCFA } from "../utils/currency";
import { useCart } from "../context/CartContext";
import { 
  FaShoppingCart, 
  FaPlus, 
  FaMinus, 
  FaCheckCircle,
  FaSpinner,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaHeart,
  FaRegHeart,
  FaEye,
  FaTag,
  FaStore
} from "react-icons/fa";
import { getProductImage } from "../utils/productUtils";

export default function ProductCard({ product }) {
  const { addToCart, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Vérifier si le produit a le badge NEW (moins de 30 jours)
  const isNew = () => {
    if (!product.created_at) return false;
    const createdDate = new Date(product.created_at);
    const now = new Date();
    const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  // Vérifier si le produit est en stock
  const isInStock = product.quantity > 0;

  // Vérifier si le produit est en promotion (simulé - prix > 100000)
  const isOnSale = product.unit_price > 100000;

  // Calculer la note moyenne (simulée)
  const getRating = () => {
    const seed = product.id?.length || 0;
    return 3.5 + (seed % 15) / 10;
  };

  const rating = getRating();
  const reviewCount = Math.floor(10 + (product.id?.length || 0) * 3);

  // Obtenir l'image front du produit
  const imageUrl = getProductImage(product);

  // Gérer l'erreur d'image
  const handleImageError = () => {
    setImageError(true);
  };

  // Gérer l'ajout au panier
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isInStock) {
      return;
    }

    setIsAdding(true);
    try {
      // ✅ Correction : passer l'objet product complet
      await addToCart(product, quantity);
      setIsAdded(true);
      
      setTimeout(() => {
        setIsAdded(false);
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de l'ajout au panier:", error);
    } finally {
      setIsAdding(false);
    }
  };

  // Incrémenter la quantité
  const incrementQuantity = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity < product.quantity) {
      setQuantity(prev => prev + 1);
    }
  };

  // Décrémenter la quantité
  const decrementQuantity = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  // Toggle favori
  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  // Vérifier la quantité dans le panier
  const getCartQuantity = () => {
    const cartItem = items.find(item => item.product.id === product.id);
    return cartItem ? cartItem.quantity : 0;
  };

  const cartQuantity = getCartQuantity();

  // Rendu des étoiles
  const renderStars = () => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} className="text-yellow-400" size={12} />
        ))}
        {hasHalfStar && <FaStarHalfAlt className="text-yellow-400" size={12} />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaRegStar key={`empty-${i}`} className="text-yellow-400" size={12} />
        ))}
        <span className="text-xs text-gray-400 ml-1">({reviewCount})</span>
      </div>
    );
  };

  // Tronquer la description
  const truncateDescription = (text, maxLength = 60) => {
    if (!text) return "Aucune description";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div 
      className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-brand-red/30 hover:-translate-y-1 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowTooltip(false);
      }}
    >
      {/* Lien vers le produit */}
      <Link 
        to={`/products/${product.id}`} 
        className="block"
      >
        {/* Zone image avec badges */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {/* Badges */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {/* Badge NEW */}
            {isNew() && (
              <div className="bg-brand-red text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg animate-pulse">
                NEW
              </div>
            )}
            {/* Badge Promotion */}
            {isOnSale && isInStock && (
              <div className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                <FaTag size={10} />
                -10%
              </div>
            )}
          </div>

          {/* Badge Rupture de stock */}
          {!isInStock && (
            <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
              <span className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-full">
                Rupture de stock
              </span>
            </div>
          )}

          {/* Image du produit */}
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-500 ${
                isHovered && isInStock ? "scale-110" : "scale-100"
              }`}
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm bg-gray-50">
              <div className="text-center">
                <FaShoppingCart className="text-4xl mx-auto mb-2 opacity-30" />
                Pas de photo
              </div>
            </div>
          )}

          {/* Bouton Favori */}
          <button
            onClick={toggleFavorite}
            className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white p-1.5 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          >
            {isFavorite ? (
              <FaHeart className="text-red-500" size={16} />
            ) : (
              <FaRegHeart className="text-gray-600 hover:text-red-500" size={16} />
            )}
          </button>

          {/* Indicateur de vues multiples */}
          {product.image_left || product.image_top || product.image_right ? (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
              <FaEye size={10} />
              <span>{1 + (product.image_left ? 1 : 0) + (product.image_top ? 1 : 0) + (product.image_right ? 1 : 0)}</span>
            </div>
          ) : null}

          {/* Aperçu rapide au survol (tooltip) */}
          {isHovered && isInStock && (
            <div 
              className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap transition-opacity duration-200"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <FaEye className="inline mr-1" size={12} />
              Voir le produit
            </div>
          )}
        </div>

        {/* Informations produit */}
        <div className="p-3 space-y-1.5">
          {/* Catégorie */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-brand-red font-semibold uppercase tracking-wider">
              {product.category_name || "Catégorie"}
            </p>
            {/* Étoiles - visible sur desktop */}
            <div className="hidden sm:block">
              {renderStars()}
            </div>
          </div>

          {/* Nom du produit */}
          <h3 className="font-semibold text-brand-black line-clamp-2 text-sm leading-tight">
            {product.name}
          </h3>

          {/* Étoiles - visible sur mobile */}
          <div className="sm:hidden">
            {renderStars()}
          </div>

          {/* ✅ Description à la place du vendeur */}
          <p className="text-xs text-gray-500 line-clamp-2">
            {truncateDescription(product.description, 60)}
          </p>

          {/* Prix */}
          <div className="flex items-baseline justify-between mt-1">
            <div>
              {isOnSale && isInStock ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-brand-black">
                    {formatFCFA(product.unit_price * 0.9)}
                  </span>
                  <span className="text-xs text-gray-400 line-through">
                    {formatFCFA(product.unit_price)}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold text-brand-black">
                  {formatFCFA(product.unit_price)}
                </span>
              )}
            </div>
            
            {/* Indicateur de stock */}
            {isInStock && product.quantity < 10 && (
              <span className="text-[10px] text-orange-500 font-medium animate-pulse">
                ⚡ Dernières pièces
              </span>
            )}
          </div>

          {/* Informations supplémentaires */}
          <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
            <span>
              {isInStock ? `${product.quantity} en stock` : "Indisponible"}
            </span>
            {isNew() && (
              <span className="text-brand-red font-medium">
                Nouveauté
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Zone d'action - Ajout au panier (séparée du lien) */}
      {isInStock && (
        <div 
          className="p-3 pt-0 border-t border-gray-100 flex items-center gap-2"
          onClick={(e) => e.preventDefault()}
        >
          {/* Sélecteur de quantité */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden flex-shrink-0">
            <button
              onClick={decrementQuantity}
              disabled={quantity <= 1}
              className="px-2 py-1 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaMinus size={10} />
            </button>
            <span className="w-7 text-center text-sm font-medium">
              {quantity}
            </span>
            <button
              onClick={incrementQuantity}
              disabled={quantity >= product.quantity}
              className="px-2 py-1 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaPlus size={10} />
            </button>
          </div>

          {/* Bouton Ajouter au panier */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding || !isInStock}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 ${
              isAdded 
                ? "bg-green-500 text-white cursor-default"
                : isAdding
                ? "bg-gray-400 text-white cursor-wait"
                : "bg-brand-red hover:bg-red-700 text-white hover:scale-105 active:scale-95"
            }`}
          >
            {isAdded ? (
              <>
                <FaCheckCircle className="animate-bounce" size={12} />
                Ajouté
              </>
            ) : isAdding ? (
              <>
                <FaSpinner className="animate-spin" size={12} />
                Ajout...
              </>
            ) : (
              <>
                <FaShoppingCart size={12} />
                Ajouter
              </>
            )}
          </button>

          {/* Indicateur de quantité dans le panier */}
          {cartQuantity > 0 && (
            <div className="text-[10px] text-brand-red font-medium flex-shrink-0 bg-brand-red/10 px-1.5 py-0.5 rounded-full">
              {cartQuantity} dans le panier
            </div>
          )}
        </div>
      )}
    </div>
  );
}