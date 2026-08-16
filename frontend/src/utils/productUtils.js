/**
 * Utilitaires pour la gestion des produits
 * Toutes les fonctions sont pures et réutilisables
 */

/**
 * Récupère l'image principale d'un produit
 * La priorité est donnée à l'image front, puis left, top, right
 * 
 * @param {Object} product - L'objet produit
 * @returns {string|null} - L'URL de l'image ou null
 */
// utils/productImage.js ou directement dans ProductCard.jsx

export const getProductImage = (product) => {
  if (!product) return null;
  
  // Priorité: front > left > top > right
  let imagePath = null;
  if (product.image_front) imagePath = product.image_front;
  else if (product.image_left) imagePath = product.image_left;
  else if (product.image_top) imagePath = product.image_top;
  else if (product.image_right) imagePath = product.image_right;
  else if (product.image) imagePath = product.image; // Fallback pour l'ancien champ
  
  if (!imagePath) return null;
  
  // ✅ Si l'URL est déjà complète (http ou https)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // ✅ Si l'URL commence par /media/ (relative)
  if (imagePath.startsWith('/media/')) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://redsquare-backend-production.up.railway.app';
    return `${baseUrl}${imagePath}`;
  }
  
  // ✅ Si l'URL est juste le nom du fichier (sans /media/)
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://redsquare-backend-production.up.railway.app';
  return `${baseUrl}/media/${imagePath}`;
};
/*export const getProductImage = (product) => {
  if (!product) return null;
  
  // Priorité: front > left > top > right
  if (product.image_front) return product.image_front;
  if (product.image_left) return product.image_left;
  if (product.image_top) return product.image_top;
  if (product.image_right) return product.image_right;
  if (product.image) return product.image; // Fallback pour l'ancien champ
  
  return null;
};*/

/**
 * Récupère toutes les images disponibles d'un produit
 * 
 * @param {Object} product - L'objet produit
 * @param {Object} options - Options de configuration
 * @param {boolean} options.includeNull - Inclure les valeurs null
 * @returns {Array} - Tableau des images avec leurs labels
 */
export const getProductImages = (product, options = {}) => {
  if (!product) return [];
  
  const { includeNull = false } = options;
  const images = [];
  
  const imageFields = [
    { url: product.image_front, label: 'Face' },
    { url: product.image_left, label: 'Gauche' },
    { url: product.image_top, label: 'Dessus' },
    { url: product.image_right, label: 'Droite' },
  ];
  
  for (const img of imageFields) {
    if (img.url || includeNull) {
      images.push({
        url: img.url,
        label: img.label,
        isAvailable: !!img.url
      });
    }
  }
  
  return images;
};

/**
 * Vérifie si le produit est nouveau (moins de 30 jours)
 * 
 * @param {Object} product - L'objet produit
 * @param {number} days - Nombre de jours pour la période "nouveau" (défaut: 30)
 * @returns {boolean} - True si le produit est nouveau
 */
export const isProductNew = (product, days = 30) => {
  if (!product?.created_at) return false;
  
  try {
    const createdDate = new Date(product.created_at);
    const now = new Date();
    const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
    return diffDays <= days && diffDays >= 0;
  } catch (error) {
    console.warn('Erreur lors du calcul de la date du produit:', error);
    return false;
  }
};

/**
 * Vérifie si le produit est en stock
 * 
 * @param {Object} product - L'objet produit
 * @returns {boolean} - True si le produit est en stock
 */
export const isProductInStock = (product) => {
  return product && typeof product.quantity === 'number' && product.quantity > 0;
};

/**
 * Obtient le niveau de stock comme texte
 * 
 * @param {Object} product - L'objet produit
 * @returns {Object} - { label: string, color: string }
 */
export const getStockLevel = (product) => {
  if (!product) return { label: 'Indisponible', color: 'text-red-500' };
  
  const quantity = product.quantity || 0;
  
  if (quantity <= 0) {
    return { label: 'Rupture de stock', color: 'text-red-500' };
  } else if (quantity < 5) {
    return { label: 'Stock très bas', color: 'text-orange-500' };
  } else if (quantity < 10) {
    return { label: 'Stock limité', color: 'text-yellow-500' };
  } else {
    return { label: 'En stock', color: 'text-green-500' };
  }
};

/**
 * Obtient le nombre de vues d'images disponibles
 * 
 * @param {Object} product - L'objet produit
 * @returns {number} - Nombre d'images disponibles
 */
export const getImageViewsCount = (product) => {
  if (!product) return 0;
  
  let count = 0;
  if (product.image_front) count++;
  if (product.image_left) count++;
  if (product.image_top) count++;
  if (product.image_right) count++;
  
  return count;
};

/**
 * Obtient la première image disponible ou une image de fallback
 * 
 * @param {Object} product - L'objet produit
 * @param {string} fallback - URL de fallback
 * @returns {string} - URL de l'image
 */
export const getProductImageSafe = (product, fallback = '') => {
  const image = getProductImage(product);
  return image || fallback || '/placeholder-product.png';
};

/**
 * Calcule une note simulée pour un produit (pour les démos)
 * 
 * @param {Object} product - L'objet produit
 * @param {number} seed - Seed pour la génération (défaut: basé sur l'ID)
 * @returns {Object} - { rating: number, count: number, stars: number }
 */
export const getProductRating = (product, seed = null) => {
  if (!product) return { rating: 4.0, count: 0, stars: 4 };
  
  // Utiliser l'ID comme seed si non spécifié
  const ratingSeed = seed || (product.id ? product.id.length : 0);
  
  // Générer une note entre 3.5 et 5.0
  const rating = 3.5 + ((ratingSeed % 15) / 10);
  const count = 10 + (ratingSeed % 90);
  
  // Arrondir à 0.5
  const roundedRating = Math.round(rating * 2) / 2;
  
  return {
    rating: roundedRating,
    count: count,
    stars: Math.round(roundedRating),
  };
};

/**
 * Formate une note en étoiles HTML
 * 
 * @param {number} rating - La note (0-5)
 * @param {number} size - Taille des étoiles (défaut: 14)
 * @returns {string} - Code HTML des étoiles
 */
export const getStarsHTML = (rating, size = 14) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let html = '';
  
  for (let i = 0; i < fullStars; i++) {
    html += `<svg class="text-yellow-400 inline" style="width:${size}px;height:${size}px" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
  }
  
  if (hasHalfStar) {
    html += `<svg class="text-yellow-400 inline" style="width:${size}px;height:${size}px" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
  }
  
  for (let i = 0; i < emptyStars; i++) {
    html += `<svg class="text-yellow-400 inline" style="width:${size}px;height:${size}px" fill="none" stroke="currentColor" viewBox="0 0 20 20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
  }
  
  return html;
};

/**
 * Calcule le prix promotionnel (simulé)
 * 
 * @param {Object} product - L'objet produit
 * @param {number} discount - Pourcentage de réduction (défaut: 10)
 * @returns {Object} - { originalPrice, discountedPrice, discountPercentage, isOnSale }
 */
export const getProductPrice = (product, discount = 10) => {
  if (!product) return { originalPrice: 0, discountedPrice: 0, discountPercentage: 0, isOnSale: false };
  
  const originalPrice = product.unit_price || 0;
  
  // Simuler une promotion pour les produits > 100000 FCFA
  const isOnSale = originalPrice > 100000;
  const discountPercentage = isOnSale ? discount : 0;
  const discountedPrice = isOnSale ? originalPrice * (1 - discountPercentage / 100) : originalPrice;
  
  return {
    originalPrice,
    discountedPrice: Math.round(discountedPrice * 100) / 100,
    discountPercentage,
    isOnSale,
    formattedOriginal: formatFCFA(originalPrice),
    formattedDiscounted: formatFCFA(Math.round(discountedPrice * 100) / 100),
  };
};

/**
 * Formate un prix en FCFA
 * 
 * @param {number} amount - Le montant à formater
 * @returns {string} - Le montant formaté en FCFA
 */
export const formatFCFA = (amount) => {
  if (!amount && amount !== 0) return '0 FCFA';
  
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('XAF', 'FCFA');
  } catch (error) {
    return `${amount} FCFA`;
  }
};

/**
 * Extrait les catégories d'une liste de produits avec leurs compteurs
 * 
 * @param {Array} products - Liste des produits
 * @returns {Array} - Catégories avec leurs compteurs
 */
export const extractCategoriesFromProducts = (products) => {
  if (!Array.isArray(products) || products.length === 0) return [];
  
  const categoryMap = new Map();
  
  for (const product of products) {
    const categoryId = product.category || product.category_id;
    const categoryName = product.category_name || 'Sans catégorie';
    
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        id: categoryId,
        name: categoryName,
        count: 0,
        products: [],
      });
    }
    
    const categoryData = categoryMap.get(categoryId);
    categoryData.count += 1;
    categoryData.products.push(product);
  }
  
  return Array.from(categoryMap.values());
};

/**
 * Filtre les produits par prix
 * 
 * @param {Array} products - Liste des produits
 * @param {number} min - Prix minimum
 * @param {number} max - Prix maximum
 * @returns {Array} - Produits filtrés
 */
export const filterProductsByPrice = (products, min = 0, max = Infinity) => {
  if (!Array.isArray(products)) return [];
  return products.filter(p => {
    const price = p.unit_price || 0;
    return price >= min && price <= max;
  });
};

/**
 * Trie les produits selon différents critères
 * 
 * @param {Array} products - Liste des produits
 * @param {string} sortBy - Critère de tri ('price-asc', 'price-desc', 'name-asc', 'name-desc', 'newest')
 * @returns {Array} - Produits triés
 */
export const sortProducts = (products, sortBy = 'newest') => {
  if (!Array.isArray(products)) return [];
  
  const sorted = [...products];
  
  switch (sortBy) {
    case 'price-asc':
      sorted.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0));
      break;
    case 'price-desc':
      sorted.sort((a, b) => (b.unit_price || 0) - (a.unit_price || 0));
      break;
    case 'name-asc':
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
    case 'name-desc':
      sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      break;
    case 'newest':
    default:
      sorted.sort((a, b) => {
        const aDate = new Date(a.created_at || 0);
        const bDate = new Date(b.created_at || 0);
        return bDate - aDate;
      });
      break;
  }
  
  return sorted;
};

/**
 * Pagine une liste de produits
 * 
 * @param {Array} products - Liste des produits
 * @param {number} page - Numéro de page (1-indexed)
 * @param {number} pageSize - Nombre d'éléments par page
 * @returns {Object} - { items, total, totalPages, currentPage }
 */
export const paginateProducts = (products, page = 1, pageSize = 20) => {
  if (!Array.isArray(products)) {
    return { items: [], total: 0, totalPages: 0, currentPage: 1 };
  }
  
  const total = products.length;
  const totalPages = Math.ceil(total / pageSize);
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const items = products.slice(start, end);
  
  return {
    items,
    total,
    totalPages,
    currentPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};