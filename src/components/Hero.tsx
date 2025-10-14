import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import ProductAnimation from './ProductAnimation';

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      {/* Animated background orbs */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0]
        }}
        transition={{ 
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-r from-[#FC36FF]/30 to-[#7A1BF7]/30 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ 
          scale: [1, 1.3, 1],
          x: [0, -50, 0],
          y: [0, -30, 0]
        }}
        transition={{ 
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-20 left-0 w-[500px] h-[500px] bg-gradient-to-r from-[#7A1BF7]/20 to-[#FC36FF]/20 rounded-full blur-3xl"
      />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Text content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
            >
              Recognize & Reward{' '}
              <span className="text-gradient">Your Team</span> 🎉
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl md:text-2xl hero-text-color mb-10 max-w-xl mx-auto lg:mx-0"
            >
              Build a culture of appreciation with instant peer recognition and meaningful rewards that make your team feel valued.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-[#FC36FF] to-[#7A1BF7] hover:from-[#fd5eff] hover:to-[#8c3cff] text-white px-8 py-6 text-lg rounded-full shadow-2xl hover:shadow-[#FC36FF]/50 transition-all duration-300">
                  Get Started for Free
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Right column - Product animation */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="hidden lg:block"
          >
            <ProductAnimation />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
