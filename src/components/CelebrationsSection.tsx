import { motion, useInView } from 'framer-motion';
import { useRef, useMemo } from 'react';
import { Gift } from 'lucide-react';

const COLORS = ['#F572FF', '#5DE8E0', '#FFD166', '#FF6B6B', '#6BCB77', '#4D96FF'];
const SHAPES = ['circle', 'square', 'diamond'] as const;

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  shape: typeof SHAPES[number];
  delay: number;
  duration: number;
  drift: number;
  rotation: number;
}

const generateParticles = (count: number): Particle[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 280 - 20,
    y: Math.random() * -40 - 10,
    size: Math.random() * 5 + 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    delay: Math.random() * 0.8,
    duration: Math.random() * 1.5 + 2,
    drift: Math.random() * 40 - 20,
    rotation: Math.random() * 360,
  }));

const ParticleShape = ({ particle }: { particle: Particle }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: particle.x,
    top: particle.y,
    width: particle.size,
    height: particle.size,
    backgroundColor: particle.color,
    borderRadius: particle.shape === 'circle' ? '50%' : particle.shape === 'diamond' ? '2px' : '1px',
    transform: particle.shape === 'diamond' ? `rotate(45deg)` : undefined,
  };

  return (
    <motion.div
      style={style}
      initial={{ y: 0, x: 0, opacity: 0, rotate: 0 }}
      whileInView={{
        y: [0, 260, 320],
        x: [0, particle.drift * 0.5, particle.drift],
        opacity: [0, 1, 1, 0],
        rotate: [0, particle.rotation],
      }}
      viewport={{ once: true }}
      transition={{
        duration: particle.duration,
        delay: particle.delay + 0.3,
        ease: 'easeOut',
      }}
    />
  );
};

const CelebrationsSection = () => {
  const ref = useRef(null);
  const particles = useMemo(() => generateParticles(18), []);

  return (
    <section ref={ref} className="relative py-24 md:py-32 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left column — celebration card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center lg:justify-start"
          >
            <div className="relative w-full max-w-[340px] rounded-2xl p-8" style={{ backgroundColor: '#F3F4F6' }}>
              {/* Confetti container */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                {particles.map((p) => (
                  <ParticleShape key={p.id} particle={p} />
                ))}
              </div>

              {/* Card */}
              <div className="relative bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center z-10">
                {/* Avatar */}
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #F572FF, #5DE8E0)',
                  }}
                >
                  <span className="text-2xl font-bold text-white font-[Poppins]">P</span>
                </div>

                <h3
                  className="font-[Poppins] font-bold text-lg mb-1"
                  style={{ color: '#0F0D33' }}
                >
                  Happy Birthday Pedro!
                </h3>
                <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
                  Here's a little something to celebrate you.
                </p>

                <button
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: '#0F0D33' }}
                >
                  <Gift size={16} />
                  Redeem a $25 gift card
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right column — text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <h2
              className="font-[Poppins] text-3xl md:text-4xl lg:text-[44px] font-semibold leading-tight mb-6"
              style={{ color: '#0F0D33' }}
            >
              Birthdays and anniversaries, handled automatically
            </h2>
            <p
              className="text-lg md:text-xl leading-relaxed"
              style={{ color: 'rgba(15, 13, 51, 0.7)' }}
            >
              Grattia remembers every milestone. Consistent, small moments add up to a culture where people feel valued.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CelebrationsSection;
