import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CTA = () => {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Animated background gradient */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0]
        }}
        transition={{ 
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute inset-0 bg-gradient-to-r from-[#FC36FF]/20 via-[#7A1BF7]/20 to-[#FC36FF]/20 blur-3xl"
      />
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block mb-6"
          >
            <span className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FC36FF]/20 to-[#7A1BF7]/20 border border-[#FC36FF]/30 text-sm font-medium text-white">
              🚀 Start Today
            </span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your{' '}
            <span className="text-gradient">Team Culture</span>?
          </h2>
          
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join hundreds of companies using Grattia to build stronger, more engaged teams through meaningful recognition.
          </p>
          
          <Link to="/signup">
            <Button 
              className="bg-gradient-to-r from-[#FC36FF] to-[#7A1BF7] hover:from-[#fd5eff] hover:to-[#8c3cff] text-white px-8 py-6 text-lg rounded-full shadow-2xl hover:shadow-[#FC36FF]/50 transition-all duration-300"
            >
              Get Started for Free
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
