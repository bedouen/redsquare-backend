/**
 * Utilitaires de formatage des devises
 * Devise utilisée : FCFA (XAF)
 */

/**
 * Formate un montant en FCFA
 * 
 * @param {number|string} amount - Le montant à formater
 * @param {Object} options - Options de formatage
 * @param {boolean} options.showSymbol - Afficher le symbole (défaut: true)
 * @param {number} options.decimalPlaces - Nombre de décimales (défaut: 0)
 * @param {string} options.locale - Locale (défaut: 'fr-FR')
 * @returns {string} - Montant formaté en FCFA
 */
export const formatFCFA = (amount, options = {}) => {
  const {
    showSymbol = true,
    decimalPlaces = 0,
    locale = 'fr-FR'
  } = options;

  const value = Number(amount || 0);
  
  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(value);
    
    // Remplacer 'XAF' par 'FCFA' si le symbole est affiché
    return showSymbol ? formatted.replace('XAF', 'FCFA') : formatted.replace('XAF', '').trim();
  } catch (error) {
    // Fallback en cas d'erreur
    return `${value.toLocaleString(locale)} FCFA`;
  }
};

/**
 * Formatage court du FCFA (ex: 1.5M, 2.5k)
 * 
 * @param {number} amount - Le montant à formater
 * @returns {string} - Montant formaté court
 */
export const formatFCFAShort = (amount) => {
  const value = Number(amount || 0);
  
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M FCFA`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value % 1000 === 0 ? 0 : 1)}k FCFA`;
  }
  return formatFCFA(value);
};

/**
 * Parse un string FCFA en nombre
 * 
 * @param {string} str - La chaîne à parser (ex: "10 000 FCFA")
 * @returns {number} - Le montant numérique
 */
export const parseFCFA = (str) => {
  if (!str) return 0;
  
  // Supprimer 'FCFA' et les espaces, remplacer la virgule par un point
  const cleaned = str
    .replace(/FCFA/g, '')
    .replace(/\s/g, '')
    .replace(/,/g, '.');
  
  return parseFloat(cleaned) || 0;
};

/**
 * Vérifie si une valeur est un montant FCFA valide
 * 
 * @param {*} value - La valeur à vérifier
 * @returns {boolean} - True si valide
 */
export const isValidFCFA = (value) => {
  if (value === undefined || value === null) return false;
  const num = Number(value);
  return !isNaN(num) && num >= 0;
};

/**
 * Arrondit un montant à l'entier le plus proche
 * (les centimes ne sont pas utilisés en FCFA)
 * 
 * @param {number} amount - Le montant à arrondir
 * @returns {number} - Montant arrondi
 */
export const roundFCFA = (amount) => {
  return Math.round(Number(amount || 0));
};

/**
 * Calcule le total d'un panier
 * 
 * @param {Array} items - Liste des articles [{unit_price, quantity}]
 * @param {number} deliveryFee - Frais de livraison
 * @returns {Object} - { subtotal, deliveryFee, total }
 */
export const calculateCartTotal = (items, deliveryFee = 0) => {
  if (!Array.isArray(items)) {
    return { subtotal: 0, deliveryFee: 0, total: 0 };
  }
  
  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.unit_price || 0);
    const quantity = Number(item.quantity || 0);
    return sum + (price * quantity);
  }, 0);
  
  const fee = Number(deliveryFee || 0);
  const total = subtotal + fee;
  
  return {
    subtotal,
    deliveryFee: fee,
    total,
  };
};

/**
 * Formate les prix d'un panier pour l'affichage
 * 
 * @param {Array} items - Liste des articles
 * @param {number} deliveryFee - Frais de livraison
 * @returns {Object} - Prix formatés
 */
export const formatCartPrices = (items, deliveryFee = 0) => {
  const totals = calculateCartTotal(items, deliveryFee);
  
  return {
    subtotal: formatFCFA(totals.subtotal),
    deliveryFee: formatFCFA(totals.deliveryFee),
    total: formatFCFA(totals.total),
    raw: totals,
  };
};

/**
 * Ajoute le symbole FCFA à un nombre
 * 
 * @param {number} amount - Le montant
 * @returns {string} - Montant avec le symbole
 */
export const addFCFASymbol = (amount) => {
  const value = Number(amount || 0);
  return `${value.toLocaleString('fr-FR')} FCFA`;
};

/**
 * Formate un montant pour les champs de formulaire
 * 
 * @param {number} amount - Le montant
 * @returns {string} - Montant sans symboles
 */
export const formatFCFAInput = (amount) => {
  const value = Number(amount || 0);
  return value.toString();
};

// Exports par défaut (pour compatibilité)
export default {
  formatFCFA,
  formatFCFAShort,
  parseFCFA,
  isValidFCFA,
  roundFCFA,
  calculateCartTotal,
  formatCartPrices,
  addFCFASymbol,
  formatFCFAInput,
};