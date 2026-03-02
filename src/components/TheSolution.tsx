import { motion } from 'framer-motion';
import grattiaSymbol from '@/assets/grattia-symbol.png';

const TheSolution = () => {
  return (
    <section id="features" className="pt-32 pb-40 px-6 md:px-[136px]" style={{ background: 'linear-gradient(to bottom, #ffffff 0%, #F5F3FF 10%, #F5F3FF 90%, #ffffff 100%)' }}>
      <div className="max-w-4xl mx-auto text-center">
        {/* Pulsating pill badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#E0D4F5] bg-[#F5F3FF] text-[#5e2ca5] text-sm font-medium font-[Poppins] animate-pulse-shadow">
            <img src={grattiaSymbol} alt="Grattia" className="w-4 h-4" />
            The Solution
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="font-[Poppins] text-[32px] md:text-[48px] font-bold leading-[125%] text-[#0F0D33] mb-6"
        >
          Make recognition a daily habit,<br className="hidden md:block" /> not an annual obligation.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="font-[Poppins] text-[18px] md:text-[20px] font-normal leading-[140%] text-[#0F0D33]/80 max-w-2xl mx-auto"
        >
          Empower your team to celebrate wins instantly. Turn moments into actionable data and see your culture in real-time.
        </motion.p>
      </div>
    </section>
  );
};

export default TheSolution;
