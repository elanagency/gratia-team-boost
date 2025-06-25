
const Footer = () => {
  return (
    <footer className="py-12 px-4 border-t border-grattia-purple-light/20">
      <div className="container mx-auto max-w-[1440px]">
        <div className="text-center">
          {/* Centered Logo */}
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/a81380be-c852-4afc-a6f8-7b72de94f671.png" 
              alt="Grattia Logo" 
              className="h-10 w-auto" 
            />
          </div>
          
          {/* Description text */}
          <p className="text-gray-300 mb-8">
            Making employee appreciation meaningful and rewarding.
          </p>
          
          {/* Copyright */}
          <p className="text-gray-400">© 2025 Grattia. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
