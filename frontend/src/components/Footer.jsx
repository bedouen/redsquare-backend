import { Link } from "react-router-dom";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaWhatsapp,
  FaClock,
  FaStore,
  FaTruck,
  FaShieldAlt,
  FaUndo,
} from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-black text-white pt-12 pb-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Colonne 1 - À propos */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold mb-4 flex items-center justify-center md:justify-start gap-2">
              <span className="text-brand-red">●</span> RedSquare
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              La marketplace multi-vendeurs camerounaise. Achetez et vendez en toute sécurité avec paiement en FCFA.
            </p>
            <div className="flex justify-center md:justify-start gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand-red/30 flex items-center justify-center transition duration-300"
                aria-label="Facebook"
              >
                <FaFacebook className="text-gray-300 hover:text-white" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand-red/30 flex items-center justify-center transition duration-300"
                aria-label="Twitter"
              >
                <FaTwitter className="text-gray-300 hover:text-white" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand-red/30 flex items-center justify-center transition duration-300"
                aria-label="Instagram"
              >
                <FaInstagram className="text-gray-300 hover:text-white" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand-red/30 flex items-center justify-center transition duration-300"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="text-gray-300 hover:text-white" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand-red/30 flex items-center justify-center transition duration-300"
                aria-label="YouTube"
              >
                <FaYoutube className="text-gray-300 hover:text-white" />
              </a>
            </div>
          </div>

          {/* Colonne 2 - Liens rapides */}
          <div className="text-center md:text-left">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Liens rapides
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-gray-400 hover:text-brand-red transition">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-gray-400 hover:text-brand-red transition">
                  Panier
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-400 hover:text-brand-red transition">
                  Connexion
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-400 hover:text-brand-red transition">
                  Inscription
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className="text-gray-400 hover:text-brand-red transition">
                  Mot de passe oublié
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 - Service client */}
          <div className="text-center md:text-left">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Service client
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-400">
                <FaPhone className="text-brand-red flex-shrink-0" />
                <span>+237 654 162 939</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-400">
                <FaWhatsapp className="text-green-500 flex-shrink-0" />
                <span>+237 654 162 939</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-400">
                <FaEnvelope className="text-brand-red flex-shrink-0" />
                <a href="mailto:contact@redsquare.com" className="hover:text-brand-red transition">
                  contact@redsquare.com
                </a>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-400">
                <FaClock className="text-brand-red flex-shrink-0" />
                <span>Lun-Ven: 8h - 18h</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-400">
                <FaMapMarkerAlt className="text-brand-red flex-shrink-0" />
                <span>Douala, Cameroun</span>
              </li>
            </ul>
          </div>

          {/* Colonne 4 - Garanties */}
          <div className="text-center md:text-left">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Garanties
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-400">
                <FaTruck className="text-brand-red flex-shrink-0" />
                <span>Livraison 24-48h</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-400">
                <FaShieldAlt className="text-brand-red flex-shrink-0" />
                <span>Paiement sécurisé</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-400">
                <FaUndo className="text-brand-red flex-shrink-0" />
                <span>Retour 14 jours</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-gray-400">
                <FaStore className="text-brand-red flex-shrink-0" />
                <span>100% vendeurs vérifiés</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Google Maps */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4 text-center">
            Nous trouver
          </h4>
          <div className="w-full h-48 rounded-xl overflow-hidden">
            <iframe
              title="RedSquare Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15920.952583889998!2d9.7043!3d4.0511!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x106112b3e4b2b2b3%3A0x3b2b2b2b2b2b2b2b!2sDouala%2C%20Cameroun!5e0!3m2!1sfr!2s!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>
            &copy; {currentYear} RedSquare. Tous droits réservés.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Made with ❤️ au Cameroun
          </p>
        </div>
      </div>
    </footer>
  );
}