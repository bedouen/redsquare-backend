import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatFCFA } from "../utils/currency";
import { 
  FaShoppingCart, 
  FaCheckCircle, 
  FaSpinner,
  FaMinus,
  FaPlus,
  FaImage,
  FaSearchPlus,
  FaSearchMinus,
  FaArrowLeft,
  FaArrowRight,
  FaShare,
  FaHeart,
  FaHeartBroken,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaTruck,
  FaShieldAlt,
  FaUndo,
  FaStore,
  FaTimes,
  FaExpand
} from "react-icons/fa";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart, items } = useCart();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  
  const imageContainerRef = useRef(null);
  const zoomRef = useRef(null);

  // Charger le produit
  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/catalog/products/${id}/`);
        setProduct(response.data);
        if (response.data.image_front) {
          setActiveImage(response.data.image_front);
        } else if (response.data.image) {
          setActiveImage(response.data.image);
        }
        if (response.data.category) {
          const relatedResponse = await api.get(`/catalog/products/`, {
            params: { category: response.data.category, page_size: 4 }
          });
          const related = (relatedResponse.data.results || relatedResponse.data || [])
            .filter(p => p.id !== response.data.id)
            .slice(0, 4);
          setRelatedProducts(related);
        }
      } catch (err) {
        console.error("Erreur lors du chargement du produit:", err);
        setError("Produit non trouvé ou erreur de chargement.");
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  // Réinitialiser le zoom quand l'image change
  useEffect(() => {
    setZoomLevel(1);
    setImageLoadError(false);
  }, [activeImage]);

  // Récupérer toutes les images du produit
  const getProductImages = () => {
    if (!product) return [];
    const images = [];
    if (product.image_front) images.push({ url: product.image_front, label: 'Face' });
    if (product.image_left) images.push({ url: product.image_left, label: 'Gauche' });
    if (product.image_top) images.push({ url: product.image_top, label: 'Dessus' });
    if (product.image_right) images.push({ url: product.image_right, label: 'Droite' });
    if (images.length === 0 && product.image) {
      images.push({ url: product.image, label: 'Principal' });
    }
    return images;
  };

  const images = getProductImages();
  const hasMultipleImages = images.length > 1;

  // Gérer l'ajout au panier
  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }
    
    if (product.quantity <= 0) {
      alert("Ce produit est en rupture de stock.");
      return;
    }

    setAdding(true);
    try {
      await addToCart(product, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } catch (err) {
      console.error("Erreur lors de l'ajout au panier:", err);
      alert("Erreur lors de l'ajout au panier. Veuillez réessayer.");
    } finally {
      setAdding(false);
    }
  };

  // Gérer la quantité
  const incrementQuantity = () => {
    if (quantity < product.quantity) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  // Gérer le zoom
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  // Changer d'image active
  const handleImageSelect = (imageUrl) => {
    setActiveImage(imageUrl);
    setImageLoadError(false);
    setCurrentImageIndex(images.findIndex(img => img.url === imageUrl));
  };

  // Naviguer entre les images
  const nextImage = () => {
    if (images.length === 0) return;
    const nextIndex = (currentImageIndex + 1) % images.length;
    setCurrentImageIndex(nextIndex);
    setActiveImage(images[nextIndex].url);
    setImageLoadError(false);
  };

  const prevImage = () => {
    if (images.length === 0) return;
    const prevIndex = (currentImageIndex - 1 + images.length) % images.length;
    setCurrentImageIndex(prevIndex);
    setActiveImage(images[prevIndex].url);
    setImageLoadError(false);
  };

  const handleImageError = () => {
    setImageLoadError(true);
  };

  // ✅ Ouvrir le modal avec l'image sélectionnée
  const openModal = (imageUrl) => {
    setModalImage(imageUrl);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalImage(null);
  };

  // Affichage des étoiles de notation
  const renderStars = (rating = 4.5, count = 127) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} className="text-yellow-400" size={16} />
        ))}
        {hasHalfStar && <FaStarHalfAlt className="text-yellow-400" size={16} />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaRegStar key={`empty-${i}`} className="text-yellow-400" size={16} />
        ))}
        <span className="text-sm text-gray-500 ml-2">({count} avis)</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-brand-red text-5xl mx-auto mb-4" />
          <p className="text-gray-500">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{error || "Produit non trouvé"}</h2>
          <p className="text-gray-500 mb-4">Le produit que vous recherchez n'existe pas ou a été supprimé.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-brand-red text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Retour à la boutique
          </button>
        </div>
      </div>
    );
  }

  const cartItem = items.find(item => item.product.id === product.id);
  const cartQuantity = cartItem ? cartItem.quantity : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Fil d'Ariane */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-brand-red transition">Accueil</Link>
          <span className="mx-2">/</span>
          <Link to={`/?category=${product.category}`} className="hover:text-brand-red transition">
            {product.category_name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-brand-black font-medium">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ✅ Colonne image - taille réduite */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <div 
              ref={imageContainerRef}
              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden max-h-[400px]"
            >
              {activeImage && !imageLoadError ? (
                <div 
                  ref={zoomRef}
                  className="w-full h-full flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => openModal(activeImage)}
                >
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="object-contain transition-transform duration-300"
                    style={{ 
                      transform: `scale(${zoomLevel})`,
                      width: '100%',
                      height: '100%',
                      maxWidth: '100%',
                      maxHeight: '100%'
                    }}
                    onError={handleImageError}
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 flex-col gap-2">
                  <FaImage size={48} className="opacity-30" />
                  <span className="text-sm">Image non disponible</span>
                </div>
              )}

              {/* Badge NEW */}
              {product.created_at && new Date() - new Date(product.created_at) < 30 * 24 * 60 * 60 * 1000 && (
                <div className="absolute top-4 left-4 bg-brand-red text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                  NEW
                </div>
              )}

              {product.quantity === 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-red-600 text-white text-sm font-bold px-6 py-3 rounded-full">
                    Rupture de stock
                  </span>
                </div>
              )}

              {/* ✅ Bouton zoom/agrandir */}
              {activeImage && !imageLoadError && (
                <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                  <button
                    onClick={() => openModal(activeImage)}
                    className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg shadow-md transition"
                    title="Agrandir"
                  >
                    <FaExpand size={18} />
                  </button>
                  <button
                    onClick={handleZoomIn}
                    className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg shadow-md transition"
                    title="Zoom avant"
                  >
                    <FaSearchPlus size={18} />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg shadow-md transition"
                    title="Zoom arrière"
                  >
                    <FaSearchMinus size={18} />
                  </button>
                </div>
              )}

              {hasMultipleImages && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 p-2 rounded-full shadow-md transition"
                  >
                    <FaArrowLeft size={18} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 p-2 rounded-full shadow-md transition"
                  >
                    <FaArrowRight size={18} />
                  </button>
                </>
              )}

              {zoomLevel > 1 && (
                <div className="absolute top-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                  {zoomLevel}x
                </div>
              )}
            </div>

            {/* Miniatures */}
            {hasMultipleImages && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageSelect(img.url)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                      activeImage === img.url 
                        ? 'border-brand-red shadow-md' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img 
                      src={img.url} 
                      alt={`${product.name} - ${img.label}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <span className="sr-only">{img.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span>📷 {images.length} vue{images.length > 1 ? 's' : ''}</span>
              <button
                onClick={() => activeImage && openModal(activeImage)}
                className="text-brand-red hover:underline text-xs ml-auto"
              >
                Agrandir
              </button>
            </div>
          </div>

          {/* Colonne informations */}
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-brand-red font-semibold uppercase text-sm tracking-wider">
                {product.category_name}
              </p>
              <h1 className="text-2xl font-extrabold text-brand-black mt-1">
                {product.name}
              </h1>
            </div>

            <div>
              {renderStars(4.5, 127)}
            </div>

            <div className="flex items-baseline gap-4">
              <p className="text-2xl font-bold text-brand-black">
                {formatFCFA(product.unit_price)}
              </p>
              {product.unit_price > 100000 && (
                <span className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                  -10% avec code RED10
                </span>
              )}
            </div>

            <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
              <p>{product.description || "Aucune description disponible."}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-red/20 flex items-center justify-center">
                  <span className="font-bold text-brand-red text-sm">
                    {product.created_by_name?.[0]?.toUpperCase() || 'V'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm flex items-center gap-1">
                    <FaStore size={14} className="text-brand-red" />
                    Vendu par {product.created_by_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Stock disponible : {product.quantity} unité{product.quantity > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Garanties */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex flex-col items-center text-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                <FaTruck className="text-brand-red text-lg mb-1" />
                <span className="text-[10px] text-gray-600">Livraison 24-48h</span>
              </div>
              <div className="flex flex-col items-center text-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                <FaShieldAlt className="text-brand-red text-lg mb-1" />
                <span className="text-[10px] text-gray-600">Garantie 12 mois</span>
              </div>
              <div className="flex flex-col items-center text-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                <FaUndo className="text-brand-red text-lg mb-1" />
                <span className="text-[10px] text-gray-600">Retour 14 jours</span>
              </div>
            </div>

            {/* Quantité et ajout au panier */}
            {product.quantity > 0 ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="px-2 py-1.5 text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaMinus size={12} />
                    </button>
                    <span className="w-10 text-center font-medium text-sm">{quantity}</span>
                    <button
                      onClick={incrementQuantity}
                      disabled={quantity >= product.quantity}
                      className="px-2 py-1.5 text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaPlus size={12} />
                    </button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={adding}
                    className={`py-2 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 text-sm ${
                      added 
                        ? "bg-green-500 text-white cursor-default"
                        : adding
                        ? "bg-gray-400 text-white cursor-wait"
                        : "bg-brand-red hover:bg-red-700 text-white hover:scale-105 active:scale-95"
                    }`}
                  >
                    {added ? (
                      <>
                        <FaCheckCircle className="animate-bounce" size={14} />
                        Ajouté
                      </>
                    ) : adding ? (
                      <>
                        <FaSpinner className="animate-spin" size={14} />
                        Ajout...
                      </>
                    ) : (
                      <>
                        <FaShoppingCart size={14} />
                        Ajouter
                      </>
                    )}
                  </button>
                </div>

                {cartQuantity > 0 && (
                  <div className="text-sm text-brand-red font-medium">
                    Déjà {cartQuantity} dans votre panier
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  <span className="text-green-600 font-medium">✔</span> Livraison disponible à Douala, Yaoundé et Bafoussam
                </p>
              </>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-brand-red font-semibold">❌ Produit en rupture de stock</p>
                <p className="text-sm text-gray-500 mt-1">Soyez averti dès son retour</p>
                <button className="mt-2 text-brand-red hover:text-red-700 text-sm font-medium transition">
                  Me notifier
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Produits associés */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-brand-black mb-4">Produits similaires</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedProducts.map((related) => (
                <Link
                  key={related.id}
                  to={`/products/${related.id}`}
                  className="bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition shadow-sm"
                >
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={related.image_front || related.image}
                      alt={related.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold truncate">{related.name}</p>
                    <p className="text-brand-red font-bold text-sm">
                      {formatFCFA(related.unit_price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ✅ Modal d'agrandissement de l'image */}
      {modalOpen && modalImage && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4" onClick={closeModal}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 text-white hover:text-brand-red transition text-3xl"
            >
              <FaTimes />
            </button>
            <img
              src={modalImage}
              alt={product.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}