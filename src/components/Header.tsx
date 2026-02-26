import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Header = () => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-2">
            <img
              src="/lovable-uploads/logo-grattia.png"
              alt="Grattia Logo"
              className="h-8"
            />
          </div>

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
                className="bg-gradient-to-r from-[#FC36FF] to-[#7A1BF7] hover:from-[#fd5eff] hover:to-[#8c3cff] text-white px-5 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
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
