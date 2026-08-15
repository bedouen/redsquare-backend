import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Charger le panier depuis localStorage
  const loadCart = () => {
    try {
      const saved = localStorage.getItem("redsquare_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  // Charger l'historique depuis localStorage
  const loadHistory = () => {
    try {
      const saved = localStorage.getItem("redsquare_order_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const [items, setItems] = useState(loadCart);
  const [orderHistory, setOrderHistory] = useState(loadHistory);
  const [loading, setLoading] = useState(true);

  // Sauvegarder le panier dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem("redsquare_cart", JSON.stringify(items));
  }, [items]);

  // Sauvegarder l'historique dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem("redsquare_order_history", JSON.stringify(orderHistory));
  }, [orderHistory]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const addToCart = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  // Ajouter une commande à l'historique
  const addToHistory = (order) => {
    setOrderHistory((prev) => [order, ...prev]);
  };

  // Récupérer l'historique des commandes d'un utilisateur
  const getUserHistory = (userId) => {
    return orderHistory.filter((order) => order.userId === userId);
  };

  const total = items.reduce((sum, i) => sum + i.product.unit_price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total,
        orderHistory,
        addToHistory,
        getUserHistory,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);