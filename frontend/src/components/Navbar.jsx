import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useState, useEffect, useRef } from "react";
import { 
  FaShoppingCart, 
  FaUser, 
  FaUserCircle, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes,
  FaHome,
  FaTachometerAlt,
  FaStore,
  FaSearch,
  FaCog,
  FaHistory,
  FaUserCog,
  FaBox,
  FaChartBar,
  FaBell,
  FaChevronDown,
  FaChevronUp,
  FaShoppingBag,
  FaCreditCard,
  FaRobot
} from "react-icons/fa";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartAnimate, setCartAnimate] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  
  const profileDropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (cartCount > 0) {
      setCartAnimate(true);
      setTimeout(() => setCartAnimate(false), 1000);
    }
  }, [cartCount]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 100);
    }
  }, [isSearchOpen]);

  const dashboardLink = () => {
    if (!user) return null;
    if (user.role === "super_admin") return "/superadmin";
    if (user.role === "admin") return "/admin";
    return "/client";
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getRoleLabel = (role) => {
    const labels = {
      super_admin: "Super Admin",
      admin: "Admin",
      client: "Client"
    };
    return labels[role] || role;
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName) return "?";
    if (lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    return firstName[0].toUpperCase();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  // ✅ Fonction pour ouvrir le chatbot
  const openChatBot = () => {
    // Chercher le bouton du chatbot et le cliquer
    const chatButton = document.querySelector('.chatbot-toggle-btn');
    if (chatButton) {
      chatButton.click();
    } else {
      // Fallback: rediriger vers une page de chat si le composant n'est pas chargé
      navigate('/chat');
    }
  };

  return (
    <nav 
      className={`bg-brand-black text-white sticky top-0 z-50 transition-shadow duration-300 ${
        isScrolled ? "shadow-lg" : "shadow-md"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-2xl font-extrabold hover:scale-105 transition-transform duration-200 flex-shrink-0"
          >
            Red<span className="text-brand-red">Square</span>
          </Link>

          {/* Liens de navigation - Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className={`transition duration-200 flex items-center gap-1 ${
                isActive("/") 
                  ? "text-brand-red font-semibold" 
                  : "hover:text-brand-red"
              }`}
            >
              <FaStore className="text-sm" />
              Boutique
            </Link>

            {/* Panier - Desktop */}
            <Link 
              to="/cart" 
              className={`relative transition duration-200 flex items-center gap-1 ${
                isActive("/cart") 
                  ? "text-brand-red font-semibold" 
                  : "hover:text-brand-red"
              }`}
            >
              <FaShoppingCart className={`text-sm transition-transform duration-300 ${cartAnimate ? "scale-125" : ""}`} />
              Panier
              {cartCount > 0 && (
                <span className={`absolute -top-2 -right-4 bg-brand-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center transition-all duration-300 ${
                  cartAnimate ? "scale-150 bg-green-500" : "animate-pulse"
                }`}>
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-gray-400 hover:text-white transition p-2 rounded-lg hover:bg-white/5"
              aria-label="Rechercher"
            >
              <FaSearch size={18} />
            </button>

            {/* ✅ Assistant IA - Desktop */}
            <button
              onClick={openChatBot}
              className="text-gray-400 hover:text-white transition p-2 rounded-lg hover:bg-white/5 flex items-center gap-1"
              aria-label="Assistant IA"
            >
              <FaRobot size={18} />
              <span className="text-xs">IA</span>
            </button>

            {user && (user.role === "admin" || user.role === "super_admin") && (
              <button
                className="relative text-gray-400 hover:text-white transition p-2 rounded-lg hover:bg-white/5"
                aria-label="Notifications"
              >
                <FaBell size={18} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            )}

            {user ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className={`flex items-center gap-2 hover:text-brand-red transition duration-200 p-2 rounded-lg hover:bg-white/5 ${
                    isProfileDropdownOpen ? "bg-white/10" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center text-white text-sm font-bold">
                    {getInitials(user.first_name, user.last_name)}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {user.first_name} {user.last_name || ''}
                    </span>
                    <span className="text-xs text-gray-400">
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <FaChevronDown className={`text-xs text-gray-400 transition-transform duration-200 ${isProfileDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white text-brand-black rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-sm">
                        {user.first_name} {user.last_name || ''}
                      </p>
                      <p className="text-xs text-gray-500">{user.email || user.phone_number}</p>
                      <span className="inline-block mt-1 text-xs bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-full">
                        {getRoleLabel(user.role)}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to={dashboardLink()}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <FaTachometerAlt className="text-brand-red" />
                        Mon Dashboard
                      </Link>
                      
                      {/* ✅ Historique des commandes */}
                      <Link
                        to="/order-history"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <FaHistory className="text-gray-500" />
                        Historique des commandes
                      </Link>

                      {/* ✅ Méthodes de paiement */}
                      <Link
                        to="/payment-methods"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <FaCreditCard className="text-gray-500" />
                        Méthodes de paiement
                      </Link>

                      <Link
                        to="/cart"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <FaShoppingBag className="text-gray-500" />
                        Mon panier ({cartCount})
                      </Link>

                      <hr className="my-1 border-gray-100" />

                      <button
                        onClick={() => {
                          logout();
                          navigate("/");
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <FaSignOutAlt />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  to="/login" 
                  className={`hover:text-brand-red transition duration-200 text-sm ${
                    isActive("/login") ? "text-brand-red font-semibold" : ""
                  }`}
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="bg-brand-red hover:bg-red-700 px-4 py-1.5 rounded-md text-sm transition duration-200 hover:scale-105"
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>

          {/* Menu mobile - Panier visible à droite du menu hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            <Link 
              to="/cart" 
              className="relative text-white hover:text-brand-red transition"
            >
              <FaShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-brand-red text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            
            {/* ✅ Assistant IA - Mobile */}
            <button
              onClick={openChatBot}
              className="text-white hover:text-brand-red transition p-2"
              aria-label="Assistant IA"
            >
              <FaRobot size={20} />
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-brand-red transition duration-200 p-2"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>

        {/* Barre de recherche rapide */}
        {isSearchOpen && (
          <div className="py-3 border-t border-gray-800">
            <form onSubmit={handleSearch} className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher un produit, une catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
              >
                <FaTimes size={16} />
              </button>
            </form>
          </div>
        )}

        {/* Menu mobile */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="py-4 border-t border-gray-800 space-y-2">
            {/* Recherche - Mobile */}
            <div className="relative mb-2">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
                    setIsMobileMenuOpen(false);
                    setSearchQuery("");
                  }
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>

            <Link 
              to="/" 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition duration-200 ${
                isActive("/") 
                  ? "bg-brand-red/20 text-brand-red" 
                  : "hover:bg-white/5"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <FaStore />
              Boutique
            </Link>

            {user ? (
              <>
                <div className="px-4 py-2 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-red flex items-center justify-center text-white text-sm font-bold">
                      {getInitials(user.first_name, user.last_name)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.first_name} {user.last_name || ''}
                      </p>
                      <span className="text-xs text-gray-400">
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ✅ Historique des commandes - Mobile */}
                <Link
                  to="/order-history"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-white/5 transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaHistory className="text-gray-400" size={16} />
                  Historique
                </Link>

                {/* ✅ Méthodes de paiement - Mobile */}
                <Link
                  to="/payment-methods"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-white/5 transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaCreditCard className="text-gray-400" size={16} />
                  Paiements
                </Link>

                {/* ✅ Assistant IA - Mobile */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openChatBot();
                  }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2.5 rounded-lg hover:bg-white/5 transition"
                >
                  <FaRobot className="text-gray-400" size={16} />
                  Assistant IA
                </button>

                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2.5 rounded-lg bg-brand-red/10 hover:bg-brand-red/20 text-brand-red transition duration-200"
                >
                  <FaSignOutAlt />
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition duration-200 ${
                    isActive("/login") 
                      ? "bg-brand-red/20 text-brand-red" 
                      : "hover:bg-white/5"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaUser />
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-red text-white hover:bg-red-700 transition duration-200 text-center justify-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Créer un compte
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sous-navbar - Affichée sur certaines pages */}
      {user && (user.role === "admin" || user.role === "super_admin") && (
        <div className="bg-gray-900/50 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-4 overflow-x-auto py-2 text-sm scrollbar-thin scrollbar-thumb-gray-700">
              <Link 
                to="/" 
                className="flex items-center gap-1 text-gray-400 hover:text-white transition duration-200 whitespace-nowrap"
              >
                <FaHome className="text-xs" />
                Boutique
              </Link>
              <span className="text-gray-700">|</span>
              <Link 
                to={dashboardLink()} 
                className="flex items-center gap-1 text-brand-red hover:text-red-400 transition duration-200 whitespace-nowrap"
              >
                <FaTachometerAlt className="text-xs" />
                Dashboard
              </Link>
              {user.role === "super_admin" && (
                <>
                  <span className="text-gray-700">|</span>
                  <span className="text-yellow-500 text-xs font-medium flex items-center gap-1">
                    ⭐ Super Admin
                  </span>
                </>
              )}
              {user.role === "admin" && (
                <>
                  <span className="text-gray-700">|</span>
                  <span className="text-purple-400 text-xs font-medium flex items-center gap-1">
                    <FaUserCog className="text-xs" /> Admin
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}