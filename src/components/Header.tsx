import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
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
      className="fixed top-0 left-0 right-0 z-50 pt-6 px-4 md:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 px-4 md:px-8 bg-white/40 backdrop-blur-md rounded-full border border-white/20 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08)]">
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

          <div className="hidden md:flex items-center gap-4">
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

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-[#0F0D33]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden mt-2 mx-2 rounded-2xl bg-white/90 backdrop-blur-md border border-white/20 shadow-lg p-4 flex flex-col gap-3"
            >
              <button
                onClick={() => scrollToSection('features')}
                className="text-[#0F0D33]/70 hover:text-[#0F0D33] font-medium text-sm py-2 text-left"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-[#0F0D33]/70 hover:text-[#0F0D33] font-medium text-sm py-2 text-left"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('faqs')}
                className="text-[#0F0D33]/70 hover:text-[#0F0D33] font-medium text-sm py-2 text-left"
              >
                FAQs
              </button>
              <div className="border-t border-gray-200 pt-3 flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full text-[#0F0D33] hover:bg-gray-100">
                    Log In
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-[#FC36FF] via-[#7F78F8] to-[#71F8F7] hover:opacity-90 text-white rounded-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;
