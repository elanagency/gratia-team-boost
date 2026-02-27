import { motion } from 'framer-motion';
import { User } from 'lucide-react';

const reviews = [
  {
    name: 'Alex Chen',
    date: 'Jan 26, 2026',
    dotColor: '#F572FF',
    text: 'Elvin went above and beyond to help the new interns get settled. Her patience and...',
  },
  {
    name: 'Emily Rodriguez',
    date: 'Jan 16, 2026',
    dotColor: '#F572FF',
    text: 'Thank you for organizing the team building event! It was exactly what we...',
  },
  {
    name: 'Shomari Love',
    date: 'Dec 16, 2025',
    dotColor: '#5DE8E0',
    text: 'Incredible work on the Q3 financial report. Your attention to detail saved us weeks of...',
  },
];

const ReviewCyclesSection = () => {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left column — text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="font-[Poppins] text-[36px] font-semibold leading-[1.3] mb-6"
              style={{ color: '#0F0D33' }}
            >
              Review cycles that don't start from scratch
            </h2>
            <p
              className="text-lg md:text-xl leading-relaxed"
              style={{ color: 'rgba(15, 13, 51, 0.7)' }}
            >
              With every recognition logged, performance reviews stop being a memory test. Managers are prepared, and employees feel seen.
            </p>
          </motion.div>

          {/* Right column — review card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="w-full max-w-[576px] rounded-[24px] p-8" style={{ backgroundColor: '#F9FAFB' }}>
            <div className="w-full max-w-[420px] mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#F3F0FF' }}
                >
                  <User size={18} style={{ color: '#8B7EC8' }} />
                </div>
                <span
                  className="font-[Poppins] font-semibold text-base"
                  style={{ color: '#0F0D33' }}
                >
                  Elvin Acevedo's Review
                </span>
              </div>

              {/* Recognition entries */}
              <div className="flex flex-col gap-3">
                {reviews.map((review, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: 0.3 + i * 0.15 }}
                    className="rounded-xl p-4"
                    style={{ backgroundColor: '#F9FAFB' }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: review.dotColor }}
                      />
                      <span
                        className="font-[Poppins] font-semibold text-sm"
                        style={{ color: '#0F0D33' }}
                      >
                        {review.name}
                      </span>
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>
                        {review.date}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed pl-[18px]" style={{ color: '#6B7280' }}>
                      {review.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ReviewCyclesSection;
