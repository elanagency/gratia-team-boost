import { motion } from 'framer-motion';

const BRANDS_ROW1 = ['Nike', 'Visa', 'Amazon', 'Apple', 'Nordstrom', 'Airbnb', 'Starbucks', 'Target'];
const BRANDS_ROW2 = ['Uber', 'Sephora', 'DoorDash', 'Spotify', 'Netflix', 'Adidas', 'Walmart', 'Lululemon'];

function BrandCard({ name }: { name: string }) {
  return (
    <div className="flex-shrink-0 w-[140px] h-[80px] bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center mx-2">
      <span className="text-sm font-semibold tracking-tight" style={{ color: '#0F0D33' }}>{name}</span>
    </div>
  );
}

function MarqueeRow({ brands, direction }: { brands: string[]; direction: 'left' | 'right' }) {
  const doubled = [...brands, ...brands];
  return (
    <div className="overflow-hidden">
      <div className={direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right'} style={{ display: 'flex', width: 'max-content' }}>
        {doubled.map((brand, i) => (
          <BrandCard key={`${brand}-${i}`} name={brand} />
        ))}
      </div>
    </div>
  );
}

const BrandCatalogSection = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left column — Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-[Poppins] text-3xl md:text-4xl lg:text-[44px] font-semibold leading-tight mb-6" style={{ color: '#0F0D33' }}>
              A rewards catalog employees actually want
            </h2>
            <p className="text-lg md:text-xl leading-relaxed" style={{ color: 'rgba(15, 13, 51, 0.7)' }}>
              Every recognition received comes with points. Redeem them from 300+ gift card options across top brands, instantly.
            </p>
          </motion.div>

          {/* Right column — Brand grid card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="w-full max-w-[520px] rounded-2xl p-6 flex flex-col gap-4" style={{ backgroundColor: '#F5F5F7' }}>
              <MarqueeRow brands={BRANDS_ROW1} direction="left" />
              <MarqueeRow brands={BRANDS_ROW2} direction="right" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BrandCatalogSection;
