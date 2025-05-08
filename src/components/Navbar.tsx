import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return <nav className="w-full py-4 px-4 md:px-8 lg:px-16 absolute top-0 left-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <a href="/" className="flex items-center">
            <img alt="Grattia Logo" className="h-10 w-auto" src="/lovable-uploads/9b86fd8b-fc4f-4456-8dcb-4970ae47f7f5.png" />
            <span className="text-2xl font-bold ml-2 text-white">grattia</span>
          </a>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6">
          <a href="#features" className="text-gray-200 hover:text-white">Features</a>
          <a href="#how-it-works" className="text-gray-200 hover:text-white">How It Works</a>
          <a href="#pricing" className="text-gray-200 hover:text-white">Pricing</a>
          <div className="flex items-center space-x-4 ml-6">
            <a href="/login" className="text-white hover:text-grattia-pink">Log In</a>
            <Button className="grattia-button">Sign Up</Button>
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
      {isMenuOpen && <div className="lg:hidden absolute top-16 left-0 right-0 bg-grattia-purple-dark/95 backdrop-blur-md p-4 border-t border-grattia-purple-light/20">
          <div className="flex flex-col space-y-4">
            <a href="#features" className="text-gray-200 hover:text-white py-2">Features</a>
            <a href="#how-it-works" className="text-gray-200 hover:text-white py-2">How It Works</a>
            <a href="#pricing" className="text-gray-200 hover:text-white py-2">Pricing</a>
            <hr className="border-grattia-purple-light/20" />
            <a href="/login" className="text-white hover:text-grattia-pink py-2">Log In</a>
            <Button className="grattia-button w-full">Sign Up</Button>
          </div>
        </div>}
    </nav>;
};
export default Navbar;