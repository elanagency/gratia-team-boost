import { motion } from 'framer-motion';
import { useRef, useMemo } from 'react';
import pedroMemoji from '@/assets/pedro-memoji.png';

const COLORS = ['#F572FF', '#5DE8E0', '#FFD166', '#FF6B6B', '#6BCB77', '#4D96FF'];
const SHAPES = ['circle', 'square', 'diamond'] as const;

interface Particle {
  id: number;
  x: number;
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
    x: Math.random() * 100,
    size: Math.random() * 5 + 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    delay: Math.random() * 1.2,
    duration: Math.random() * 1.5 + 2,
    drift: Math.random() * 40 - 20,
    rotation: Math.random() * 720 - 360,
  }));

const ParticleShape = ({ particle }: { particle: Particle }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${particle.x}%`,
    top: -10,
    width: particle.size,
    height: particle.size,
    backgroundColor: particle.color,
    borderRadius: particle.shape === 'circle' ? '50%' : particle.shape === 'diamond' ? '2px' : '1px',
    transform: particle.shape === 'diamond' ? `rotate(45deg)` : undefined,
  };

  return (
    <motion.div
      style={style}
      animate={{
        y: [0, 120, 280, 400],
        x: [0, particle.drift * 0.5, particle.drift, particle.drift * 0.8],
        opacity: [0, 1, 1, 0],
        rotate: [0, particle.rotation * 0.5, particle.rotation],
        scale: [0, 1, 1, 0.5],
      }}
      transition={{
        duration: particle.duration,
        delay: particle.delay,
        ease: 'easeIn',
        repeat: Infinity,
        repeatDelay: Math.random() * 2 + 0.5,
      }}
    />
  );
};

const CelebrationsSection = () => {
  const ref = useRef(null);
  const particles = useMemo(() => generateParticles(30), []);

  return (
    <section
      ref={ref}
      className="relative py-24 md:py-32 overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #ffffff 0%, #EEF2F9 30%, #EEF2F9 70%, #ffffff 100%)' }}
    >
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
            <div className="relative w-full max-w-[420px] rounded-2xl p-10" style={{ backgroundColor: '#E8EDF5' }}>
              {/* Card */}
              <div className="relative bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center z-10 overflow-hidden">
                {/* Confetti container inside white card */}
                <div className="absolute inset-0 pointer-events-none">
                  {particles.map((p) => (
                    <ParticleShape key={p.id} particle={p} />
                  ))}
                </div>

                {/* Avatar */}
                <img
                  src={pedroMemoji}
                  alt="Pedro avatar"
                  className="w-24 h-24 object-contain mb-4 relative z-10"
                />

                <h3
                  className="font-sans font-bold text-lg mb-1 relative z-10"
                  style={{ color: '#0F0D33' }}
                >
                  Happy Birthday Pedro!
                </h3>
                <p className="text-sm mb-5 relative z-10" style={{ color: '#6B7280' }}>
                  Here's a little something to celebrate you.
                </p>

                <button
                  className="relative z-10 inline-flex items-center justify-center rounded-lg px-8 py-3 text-sm font-medium text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#0F0D33' }}
                >
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
              className="font-[Poppins] text-[36px] font-semibold leading-[1.3] mb-6"
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
