import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaWhatsapp,
  FaTimes,
  FaArrowRight,
  FaShoppingBag,
  FaStore
} from "react-icons/fa";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showWhatsApp, setShowWhatsApp] = useState(true);
  const [categoryScrollPosition, setCategoryScrollPosition] = useState(0);
  
  const categoryContainerRef = useRef(null);
  const typingIntervalRef = useRef(null);

  // Typing effect text
  const typingTexts = [
    "Découvrez les meilleurs produits du Cameroun 🇨🇲",
    "Paiement sécurisé en FCFA 💰",
    "Livraison rapide à Douala, Yaoundé et Bafoussam 🚚",
    "Vendez vos produits sur RedSquare 🛒"
  ];
  const [typingText, setTypingText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  // Charger les catégories
  useEffect(() => {
    api.get("/catalog/categories/").then(({ data }) => {
      const categoriesData = data.results || data || [];
      setCategories(categoriesData);
    });
  }, []);

  // Charger les produits
  useEffect(() => {
    setLoading(true);
    const params = {};
    if (selectedCategory) params.category = selectedCategory;
    if (search) params.search = search;
    api
      .get("/catalog/products/", { params })
      .then(({ data }) => {
        setProducts(data.results || data || []);
      })
      .finally(() => setLoading(false));
  }, [selectedCategory, search]);

  // Typing effect
  useEffect(() => {
    const currentFullText = typingTexts[currentTextIndex];
    const isTypingComplete = typingText === currentFullText;
    
    if (isDeleting) {
      if (typingText.length > 0) {
        const timeout = setTimeout(() => {
          setTypingText(typingText.slice(0, -1));
        }, 40);
        return () => clearTimeout(timeout);
      } else {
        setIsDeleting(false);
        setCurrentTextIndex((prev) => (prev + 1) % typingTexts.length);
      }
    } else {
      if (typingText.length < currentFullText.length) {
        const timeout = setTimeout(() => {
          setTypingText(currentFullText.slice(0, typingText.length + 1));
        }, 60);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 2500);
        return () => clearTimeout(timeout);
      }
    }
  }, [typingText, isDeleting, currentTextIndex, typingTexts]);

  // Défilement des catégories
  const scrollCategories = (direction) => {
    const container = categoryContainerRef.current;
    if (!container) return;
    
    const scrollAmount = 200;
    const newPosition = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    container.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
    setCategoryScrollPosition(newPosition);
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId === selectedCategory ? "" : categoryId);
  };

  // Animation variants pour les produits
  const productVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  // Calculer le nombre total de produits
  const totalProducts = products.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ Bannière avec effet de frappe - HAUTEUR RÉDUITE */}
      <div className="relative bg-gradient-to-r from-brand-black to-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-brand-red rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-red/30 rounded-full blur-3xl"></div>
        </div>
        
        {/* ✅ py-10 au lieu de py-12 pour réduire la hauteur */}
        <div className="max-w-7xl mx-auto px-4 py-10 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              {/* ✅ text-3xl md:text-4xl au lieu de text-4xl md:text-5xl */}
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
                Bienvenue sur <span className="text-brand-red">RedSquare</span>
              </h1>
              {/* ✅ h-7 au lieu de h-8, police plus petite */}
              <div className="h-7 flex items-center justify-center md:justify-start">
                <span className="text-gray-300 text-xs md:text-sm">
                  {typingText}
                  <span className="inline-block w-0.5 h-4 bg-brand-red ml-0.5 animate-pulse"></span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* ✅ badge plus petit */}
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <FaStore className="text-brand-red text-sm" />
                <span className="text-xs font-medium">{totalProducts} produits</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Carrousel des catégories */}
      {categories.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-brand-black flex items-center gap-2">
              <span className="text-brand-red">●</span> Catégories
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollCategories('left')}
                className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-brand-red transition shadow-sm"
                aria-label="Catégories précédentes"
              >
                <FaChevronLeft className="text-gray-600" size={16} />
              </button>
              <button
                onClick={() => scrollCategories('right')}
                className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-brand-red transition shadow-sm"
                aria-label="Catégories suivantes"
              >
                <FaChevronRight className="text-gray-600" size={16} />
              </button>
            </div>
          </div>
          
          <div
            ref={categoryContainerRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-4 hide-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Catégorie "Toutes" */}
            <button
              onClick={() => setSelectedCategory("")}
              className={`flex-shrink-0 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                !selectedCategory
                  ? "bg-brand-red text-white shadow-lg shadow-brand-red/30 scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>Toutes</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  !selectedCategory ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {totalProducts}
                </span>
              </div>
            </button>

            {categories.map((category) => {
              const isActive = selectedCategory === category.id;
              const productCount = category.product_count || 0;
              
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`flex-shrink-0 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-brand-red text-white shadow-lg shadow-brand-red/30 scale-105"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{category.name}</span>
                    {productCount > 0 && (
                      <span className={`relative inline-flex items-center justify-center text-xs font-bold ${
                        isActive ? "text-white" : "text-brand-red"
                      }`}>
                        <span className={`absolute inset-0 rounded-full ${
                          isActive ? "bg-white/20" : "bg-brand-red/10"
                        }`}></span>
                        <span className="relative px-1.5 py-0.5 min-w-[20px] text-center">
                          {productCount}
                        </span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtres de recherche */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red transition bg-white shadow-sm"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="flex items-center gap-2 px-4 py-3 text-gray-500 hover:text-brand-red transition"
            >
              <FaTimes /> Effacer
            </button>
          )}
        </div>
      </div>

      {/* Grille des produits - 4 colonnes desktop, 1 colonne mobile */}
      <div className="max-w-7xl mx-auto px-4 py-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-brand-red/20 border-t-brand-red rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-4">Chargement des produits...</p>
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white rounded-2xl border border-gray-100"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-400">
              {search || selectedCategory 
                ? "Essayez de modifier vos filtres de recherche" 
                : "Aucun produit disponible pour le moment"}
            </p>
            {(search || selectedCategory) && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("");
                }}
                className="mt-4 text-brand-red hover:underline font-medium"
              >
                Réinitialiser les filtres
              </button>
            )}
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-brand-black">{products.length}</span> produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}
              </p>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory("")}
                  className="text-sm text-brand-red hover:underline font-medium"
                >
                  Voir tous les produits
                </button>
              )}
            </div>
            {/* Grille : 1 colonne mobile, 4 colonnes desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={productVariants}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bouton WhatsApp Flottant 
      <AnimatePresence>
        {showWhatsApp && (
          <motion.a
            href="https://wa.me/237690787473"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-500 text-white px-4 py-3 rounded-full shadow-xl hover:bg-green-600 transition-all duration-300 group"
          >
            <FaWhatsapp className="text-2xl" />
            <span className="hidden sm:inline font-medium text-sm group-hover:block">
              Nous contacter
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowWhatsApp(false);
              }}
              className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-gray-700 transition"
            >
              <FaTimes size={10} />
            </button>
          </motion.a>
        )}
      </AnimatePresence>
*/}
      {/* Indicateur de scroll pour les catégories */}
      {categories.length > 5 && (
        <div className="max-w-7xl mx-auto px-4 pb-2">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <FaChevronLeft size={10} />
            <span>Faites défiler les catégories</span>
            <FaChevronRight size={10} />
          </div>
        </div>
      )}

      {/* Style pour masquer la scrollbar des catégories */}
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
    </div>
  );
}