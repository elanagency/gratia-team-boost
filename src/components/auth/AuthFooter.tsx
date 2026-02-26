const AuthFooter = () => {
  return (
    <footer className="py-12 px-4" style={{ backgroundColor: '#0F0533' }}>
      <div className="max-w-md mx-auto text-center space-y-4">
        <img
          src="/lovable-uploads/grattia-logo-new.png"
          alt="Grattia Logo"
          className="h-8 mx-auto brightness-0 invert"
        />
        <p className="text-gray-400 text-sm">
          Making employee appreciation meaningful and rewarding.
        </p>
        <p className="text-gray-500 text-xs">
          © {new Date().getFullYear()} Grattia. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default AuthFooter;
