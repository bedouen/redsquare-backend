// frontend/src/components/ChatBot.jsx
import { useState, useEffect, useRef } from "react";
import { 
  FaRobot, 
  FaTimes, 
  FaPaperPlane, 
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaWhatsapp
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatBot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Charger les suggestions
  useEffect(() => {
    api.get("/chat/suggestions/").then(({ data }) => {
      setSuggestions(data.suggestions || []);
    }).catch(() => {
      setSuggestions([
        "Quels sont vos meilleurs produits ?",
        "Je cherche un smartphone",
        "Comment suivre ma commande ?",
        "Quels sont les frais de livraison ?"
      ]);
    });
  }, []);

  // Scroll vers le bas des messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus sur l'input quand le chat s'ouvre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Message de bienvenue
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          type: "assistant",
          content: "Bonjour ! 👋 Je suis l'assistant RedSquare.\nJe peux vous aider à trouver des produits, suivre vos commandes ou répondre à vos questions.\nComment puis-je vous aider ?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/chat/", {
        session_id: sessionId,
        message: userMessage.content,
      });

      const data = response.data;
      
      if (!sessionId) {
        setSessionId(data.session_id);
      }

      const assistantMessage = {
        id: data.message_id || Date.now().toString() + "-assistant",
        type: "assistant",
        content: data.response.message,
        timestamp: new Date(),
        data: data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.response.type === "product_list" && data.response.products) {
        const productNames = data.response.products.map(p => p.name).slice(0, 3);
        setSuggestions(prev => [...productNames, ...prev.slice(0, 5)]);
      }

    } catch (error) {
      console.error("Erreur chat:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "-error",
          type: "assistant",
          content: "Désolé, une erreur est survenue. Veuillez réessayer.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    setTimeout(sendMessage, 100);
  };

  const formatMessage = (content) => {
    return content.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        {i < content.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  // Rendu des produits dans un message
  const renderProductList = (products) => {
    if (!products || products.length === 0) return null;
    
    return (
      <div className="mt-3 space-y-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-gray-50 rounded-lg p-2 text-xs hover:bg-gray-100 transition cursor-pointer border border-gray-100"
            onClick={() => {
              setInput(`Je veux des informations sur ${product.name}`);
              setTimeout(sendMessage, 100);
            }}
          >
            <div className="flex items-center gap-2">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-10 h-10 object-cover rounded"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1">
                <p className="font-medium text-xs">{product.name}</p>
                <p className="text-gray-500 text-xs">{product.price} FCFA</p>
              </div>
              <button 
                className="text-brand-red text-xs font-medium hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/products/${product.id}`;
                }}
              >
                Voir
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Rendu des commandes dans un message
  const renderOrderList = (orders) => {
    if (!orders || orders.length === 0) return null;
    
    return (
      <div className="mt-3 space-y-2">
        {orders.map((order) => (
          <div key={order.id} className="bg-gray-50 rounded-lg p-2 text-xs border border-gray-100">
            <p className="font-medium">Commande #{order.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-gray-500">Total: {order.total} FCFA</p>
            <p className="text-gray-500">Statut: {order.status_display}</p>
            <p className="text-gray-400 text-[10px]">
              {new Date(order.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        ))}
      </div>
    );
  };

  // Calculer la hauteur maximale du chat
  const getMaxHeight = () => {
    // Hauteur de l'écran - marge de sécurité
    const windowHeight = window.innerHeight;
    // Réserver de l'espace pour les boutons en bas
    const bottomOffset = 120; // Espace pour les boutons
    const topOffset = 20; // Marge en haut
    return Math.min(windowHeight - bottomOffset - topOffset, 600);
  };

  return (
    <>
      {/* ✅ Bouton WhatsApp - En bas à DROITE */}
      <a
        href="https://wa.me/237654162939"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
        aria-label="WhatsApp"
      >
        <FaWhatsapp size={28} className="text-white" />
      </a>

      {/* ✅ Bouton IA - En bas à DROITE, AU-DESSUS de WhatsApp */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`chatbot-toggle-btn fixed bottom-28 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
          isOpen ? "bg-gray-800 hover:bg-gray-700" : "bg-brand-red hover:bg-red-700"
        } text-white flex items-center justify-center`}
      >
        {isOpen ? <FaTimes size={24} /> : <FaRobot size={24} />}
      </button>

      {/* Fenêtre de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatContainerRef}
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? "auto" : "auto"
            }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{ 
              maxHeight: isMinimized ? "auto" : `${getMaxHeight()}px`,
              minHeight: isMinimized ? "auto" : "350px"
            }}
            className={`fixed bottom-44 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden`}
          >
            {/* En-tête */}
            <div className="bg-brand-red text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <FaRobot size={20} />
                <span className="font-semibold">Assistant RedSquare</span>
                {user && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {user.first_name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="hover:bg-red-700 p-1 rounded-lg transition"
                  title={isMinimized ? "Agrandir" : "Réduire"}
                >
                  {isMinimized ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-red-700 p-1 rounded-lg transition"
                >
                  <FaTimes size={18} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages - avec hauteur adaptative */}
                <div 
                  className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
                  style={{ 
                    maxHeight: `${getMaxHeight() - 180}px`, // Réserve l'espace pour l'input et les suggestions
                    minHeight: "200px"
                  }}
                >
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                          msg.type === "user"
                            ? "bg-brand-red text-white rounded-br-none"
                            : "bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{formatMessage(msg.content)}</p>
                        
                        {msg.data?.type === "product_list" && msg.data?.products && (
                          renderProductList(msg.data.products)
                        )}

                        {msg.data?.type === "order_list" && msg.data?.orders && (
                          renderOrderList(msg.data.orders)
                        )}
                        
                        <span className="text-[10px] opacity-50 mt-1 block">
                          {new Date(msg.timestamp).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
                        <FaSpinner className="animate-spin text-brand-red" size={18} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-100 bg-white overflow-x-auto flex gap-2 flex-shrink-0">
                    {suggestions.slice(0, 5).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full whitespace-nowrap transition flex-shrink-0"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t border-gray-200 bg-white flex gap-2 flex-shrink-0">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Écrivez votre message..."
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-brand-red/50 transition"
                    rows="1"
                    style={{ minHeight: "42px", maxHeight: "100px" }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    className="bg-brand-red hover:bg-red-700 text-white px-4 py-2 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {loading ? <FaSpinner className="animate-spin" size={18} /> : <FaPaperPlane size={18} />}
                  </button>
                </div>
              </>
            )}

            {/* État minimisé */}
            {isMinimized && (
              <div className="p-3 text-center text-sm text-gray-500 border-t border-gray-100">
                Cliquez pour agrandir
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}