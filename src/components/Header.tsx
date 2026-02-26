import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
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
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 pt-6 px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 px-8 bg-white/40 backdrop-blur-md rounded-full border border-white/20 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08)]">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/lovable-uploads/grattia-logo-new.png"
              alt="Grattia Logo"
              className="h-8"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-[#0F0D33]/70 hover:text-[#0F0D33] font-medium text-sm transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-[#0F0D33]/70 hover:text-[#0F0D33] font-medium text-sm transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('faqs')}
              className="text-[#0F0D33]/70 hover:text-[#0F0D33] font-medium text-sm transition-colors"
            >
              FAQs
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button
                variant="ghost"
                className="text-[#0F0D33] hover:bg-gray-100"
              >
                Log In
              </Button>
            </Link>
            <Link to="/signup">
              <Button
                className="bg-gradient-to-r from-[#FC36FF] via-[#7F78F8] to-[#71F8F7] hover:opacity-90 text-white px-5 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
