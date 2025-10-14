import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const CTA = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden bg-gradient-to-br from-[#FC36FF] via-[#7F38B7] to-[#7A1BF7]">
      {/* Animated radial gradient overlays */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
        }}
      />
      <motion.div
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
        }}
      />
      
      <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
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
            animate={{ y: [0, -10, 0] }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-sm font-medium text-white mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Join the Movement Toward Better Workplace Culture
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Ready to Transform Your <span className="block">Workplace Culture?</span>
          </h2>
          
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Start making your team feel valued today.
          </p>
          
          <div className="pt-4">
            <Link to="/signup">
              <Button 
                className="bg-white text-[#7A1BF7] hover:bg-gray-100 px-8 py-6 text-lg rounded-full shadow-2xl transition-all duration-300"
              >
                Let's Do It!
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade to background */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0F0533] to-transparent"
      />
    </section>
  );
};

export default CTA;
