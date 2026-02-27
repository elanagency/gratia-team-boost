import { motion } from 'framer-motion';
import nikeLogo from '@/assets/brands/nike.png';
import visaLogo from '@/assets/brands/visa.png';
import amazonLogo from '@/assets/brands/amazon.png';
import appleLogo from '@/assets/brands/apple.png';
import nordstromLogo from '@/assets/brands/nordstrom.png';
import airbnbLogo from '@/assets/brands/airbnb.png';

interface Brand {
  name: string;
  logo?: string;
}

const BRANDS_ROW1: Brand[] = [
  { name: 'Nike', logo: nikeLogo },
  { name: 'Visa', logo: visaLogo },
  { name: 'Amazon', logo: amazonLogo },
];

const BRANDS_ROW2: Brand[] = [
  { name: 'Apple', logo: appleLogo },
  { name: 'Nordstrom', logo: nordstromLogo },
  { name: 'Airbnb', logo: airbnbLogo },
];

function BrandCard({ brand }: { brand: Brand }) {
  return (
    <div className="flex-shrink-0 w-[160px] h-[100px] bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center mx-2 p-3">
      {brand.logo ? (
        <img src={brand.logo} alt={brand.name} className="max-h-[48px] max-w-[110px] object-contain" />
      ) : (
        <span className="text-sm font-semibold tracking-tight" style={{ color: '#0F0D33' }}>{brand.name}</span>
      )}
    </div>
  );
}

function MarqueeRow({ brands, direction }: { brands: Brand[]; direction: 'left' | 'right' }) {
  const doubled = [...brands, ...brands];
  return (
    <div className="overflow-hidden py-1 px-4">
      <div className={direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right'} style={{ display: 'flex', width: 'max-content' }}>
        {doubled.map((brand, i) => (
          <BrandCard key={`${brand.name}-${i}`} brand={brand} />
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
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-[Poppins] text-[36px] font-semibold leading-[1.3] mb-6" style={{ color: '#0F0D33' }}>
              A rewards catalog employees actually want
            </h2>
            <p className="text-lg md:text-xl leading-relaxed" style={{ color: 'rgba(15, 13, 51, 0.7)' }}>
              Every recognition received comes with points. Redeem them from 300+ gift card options across top brands, instantly.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="w-full max-w-[576px] rounded-[24px] p-10 overflow-hidden flex flex-col gap-6" style={{ backgroundColor: '#F9FAFB' }}>
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
