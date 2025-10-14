import { motion } from 'framer-motion';

const Pricing = () => {
  return (
    <section className="py-24 px-4">
      <div className="max-w-xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Transparent Pricing
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-12">
            No hidden fees, no complex tiers.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card-gradient rounded-3xl p-8 md:p-12 border-2 border-[#7A1BF7]/50 shadow-2xl"
        >
          <div className="flex flex-col justify-center items-center gap-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-2">One Simple Plan</h3>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-extrabold text-gradient">$10</span>
                <span className="text-lg text-gray-300">per employee, per month</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
