import { motion } from 'framer-motion';
import { useRef, useMemo } from 'react';
import pedroMemoji from '@/assets/pedro-memoji.png';

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
  angle: number;
}

const generateParticles = (count: number): Particle[] =>
  Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    return {
      id: i,
      x: 140 + Math.cos(angle) * (30 + Math.random() * 20),
      y: 60 + Math.sin(angle) * (20 + Math.random() * 15),
      size: Math.random() * 5 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      delay: Math.random() * 0.8,
      duration: Math.random() * 1.5 + 2,
      drift: Math.random() * 60 - 30,
      rotation: Math.random() * 360,
      angle,
    };
  });

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

  const endX = Math.cos(particle.angle) * (80 + Math.random() * 40);
  const endY = Math.sin(particle.angle) * (80 + Math.random() * 40) + 60;

  return (
    <motion.div
      style={style}
      initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0 }}
      whileInView={{
        x: [0, endX * 0.5, endX],
        y: [0, endY * 0.5, endY],
        opacity: [0, 1, 1, 0],
        rotate: [0, particle.rotation],
        scale: [0, 1.2, 1, 0.6],
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
  const particles = useMemo(() => generateParticles(22), []);

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
              {/* Confetti container */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                {particles.map((p) => (
                  <ParticleShape key={p.id} particle={p} />
                ))}
              </div>

              {/* Card */}
              <div className="relative bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center z-10">
                {/* Avatar */}
                <img
                  src={pedroMemoji}
                  alt="Pedro avatar"
                  className="w-24 h-24 object-contain mb-4"
                />

                <h3
                  className="font-sans font-bold text-lg mb-1"
                  style={{ color: '#0F0D33' }}
                >
                  Happy Birthday Pedro!
                </h3>
                <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
                  Here's a little something to celebrate you.
                </p>

                <button
                  className="inline-flex items-center justify-center rounded-lg px-8 py-3 text-sm font-medium text-white transition-colors hover:opacity-90"
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
              className="font-sans text-3xl md:text-4xl lg:text-[44px] font-semibold leading-tight mb-6"
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
