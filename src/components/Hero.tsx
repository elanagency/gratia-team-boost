import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import RecognitionCarousel from '@/components/hero/RecognitionCarousel';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center px-4 py-20 pt-32 lg:pt-20 bg-white">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center lg:text-left space-y-8"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl md:text-[64px] font-extrabold leading-[115%] text-[#0F0D33]"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Recognition Shouldn't Be Reserved for Review Season
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto lg:mx-0"
          >
            Grattia helps teams feel recognized daily while providing HR and leadership with real-time culture insights.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          >
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#FC36FF] to-[#7A1BF7] hover:from-[#fd5eff] hover:to-[#8c3cff] text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Get Started
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-[#0F0D33] text-[#0F0D33] hover:bg-gray-50 px-8 py-6 text-lg rounded-full transition-all duration-300"
            >
              Book a Demo
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
          className="relative flex items-center justify-center w-full"
        >
          <RecognitionCarousel />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
