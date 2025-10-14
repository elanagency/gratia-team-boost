import { motion } from 'framer-motion';
import { Gift, Award, Star } from 'lucide-react';

const ProductAnimation = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Animated floating cards */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Main card */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 2, 0]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="card-gradient rounded-3xl p-8 shadow-2xl relative z-10"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#FC36FF] to-[#7A1BF7] flex items-center justify-center">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">100 Points</h3>
              <p className="text-gray-300 text-sm">Monthly Allocation</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[#FC36FF]" />
              <span className="text-sm text-gray-300">Instant Recognition</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#FC36FF]" />
              <span className="text-sm text-gray-300">Redeem Rewards</span>
            </div>
          </div>
        </motion.div>

        {/* Background floating elements */}
        <motion.div
          animate={{ 
            y: [0, 30, 0],
            x: [0, -10, 0]
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-r from-[#FC36FF]/20 to-[#7A1BF7]/20 rounded-full blur-2xl"
        />
        <motion.div
          animate={{ 
            y: [0, -30, 0],
            x: [0, 10, 0]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -bottom-4 -left-4 w-40 h-40 bg-gradient-to-r from-[#7A1BF7]/20 to-[#FC36FF]/20 rounded-full blur-2xl"
        />
      </motion.div>
    </div>
  );
};

export default ProductAnimation;
