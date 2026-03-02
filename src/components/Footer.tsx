import { Link, useLocation, useNavigate } from "react-router-dom";
import { Linkedin } from "lucide-react";

const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    if (location.pathname !== '/') {
      navigate('/#' + id);
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0F0533] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Row 1 */}
        <div className="flex items-center justify-between mb-10">
          <img
            src="/lovable-uploads/a81380be-c852-4afc-a6f8-7b72de94f671.png"
            alt="Grattia Logo"
            className="h-8"
          />
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-gray-300 hover:text-gray-100 text-sm transition-colors">Features</button>
            <button onClick={() => scrollToSection('pricing')} className="text-gray-300 hover:text-gray-100 text-sm transition-colors">Pricing</button>
            <button onClick={() => scrollToSection('faqs')} className="text-gray-300 hover:text-gray-100 text-sm transition-colors">FAQs</button>
          </nav>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-gray-100 transition-colors"
          >
            <Linkedin size={20} />
          </a>
        </div>

        {/* Row 2 */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            © 2026 Grattia. All rights reserved.
          </p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
