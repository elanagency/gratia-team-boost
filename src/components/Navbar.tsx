
import { useState } from 'react';
import { Menu, X, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, userName, isAdmin, isPlatformAdmin } = useAuth();

  // Determine correct dashboard route based on admin status
  const dashboardRoute = isPlatformAdmin ? "/platform-admin" : 
                        isAdmin ? "/dashboard" : 
                        "/dashboard-team";

  return (
    <nav className="w-full py-4 px-4 md:px-8 lg:px-16 absolute top-0 left-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img alt="Grattia Logo" className="h-10 w-auto" src="/lovable-uploads/9b86fd8b-fc4f-4456-8dcb-4970ae47f7f5.png" />
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6">
          <a href="#features" className="text-gray-200 hover:text-white">Features</a>
          <a href="#how-it-works" className="text-gray-200 hover:text-white">How It Works</a>
          <a href="#pricing" className="text-gray-200 hover:text-white">Pricing</a>
          <div className="flex items-center space-x-4 ml-6">
            {user ? (
              <div className="flex items-center">
                <Link to={dashboardRoute} className="flex items-center bg-black/30 hover:bg-black/40 p-2 px-4 rounded-full transition-colors">
                  <UserCircle size={20} className="mr-2 text-[#F572FF]" />
                  <div>
                    <div className="text-white font-medium">
                      {userName}
                      {isPlatformAdmin && <span className="text-xs text-[#F572FF] ml-1">(Platform)</span>}
                    </div>
                    <div className="text-xs text-gray-300">{user.email}</div>
                  </div>
                </Link>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-white hover:text-grattia-pink">Log In</Link>
                <Link to="/signup">
                  <Button className="grattia-button">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-grattia-purple-dark/95 backdrop-blur-md p-4 border-t border-grattia-purple-light/20">
          <div className="flex flex-col space-y-4">
            <a href="#features" className="text-gray-200 hover:text-white py-2">Features</a>
            <a href="#how-it-works" className="text-gray-200 hover:text-white py-2">How It Works</a>
            <a href="#pricing" className="text-gray-200 hover:text-white py-2">Pricing</a>
            <hr className="border-grattia-purple-light/20" />
            {user ? (
              <>
                <Link to={dashboardRoute} className="flex items-center py-2">
                  <UserCircle size={20} className="mr-2 text-[#F572FF]" />
                  <div>
                    <div className="text-white font-medium">
                      {userName}
                      {isPlatformAdmin && <span className="text-xs text-[#F572FF] ml-1">(Platform)</span>}
                    </div>
                    <div className="text-xs text-gray-300">{user.email}</div>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white hover:text-grattia-pink py-2">Log In</Link>
                <Link to="/signup" className="w-full">
                  <Button className="grattia-button w-full">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
