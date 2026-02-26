import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface MetricState {
  metricIndex: number; // 0-3 for dot indicators
  title: string;
  bigNumber: string;
  trendLabel: string;
  toggle: 'Department' | 'Person';
  barColor: string;
  barColorLight: string;
  labels: string[];
  heights: number[]; // percentages 0-100
  tooltipBar: number; // which bar gets the tooltip
  tooltipText: string;
}

const STATES: MetricState[] = [
  {
    metricIndex: 0,
    title: 'Participation Rate',
    bigNumber: '87%',
    trendLabel: '+12%',
    toggle: 'Department',
    barColor: '#8B7EC8',
    barColorLight: '#B8ACE6',
    labels: ['Eng', 'Sales', 'Mktg', 'HR', 'Prod'],
    heights: [78, 94, 65, 82, 70],
    tooltipBar: 1,
    tooltipText: '94% Participation Rate',
  },
  {
    metricIndex: 0,
    title: 'Participation Rate',
    bigNumber: '87%',
    trendLabel: '+12%',
    toggle: 'Person',
    barColor: '#8B7EC8',
    barColorLight: '#B8ACE6',
    labels: ['Sarah', 'Mike', 'Jess', 'David', 'Emily'],
    heights: [92, 68, 85, 55, 78],
    tooltipBar: 0,
    tooltipText: '92% Participation',
  },
  {
    metricIndex: 1,
    title: 'Recognitions Received',
    bigNumber: '312',
    trendLabel: '+8%',
    toggle: 'Person',
    barColor: '#F572FF',
    barColorLight: '#F9A8FF',
    labels: ['Sarah', 'Mike', 'Jess', 'David', 'Emily'],
    heights: [95, 72, 60, 85, 50],
    tooltipBar: 0,
    tooltipText: '45 Recognitions Received',
  },
  {
    metricIndex: 2,
    title: 'Recognitions Sent',
    bigNumber: '1,847',
    trendLabel: '+15%',
    toggle: 'Department',
    barColor: '#5DE8E0',
    barColorLight: '#9AF0EB',
    labels: ['Eng', 'Sales', 'Mktg', 'HR', 'Prod'],
    heights: [70, 82, 60, 95, 75],
    tooltipBar: 3,
    tooltipText: '410 Recognitions Sent',
  },
  {
    metricIndex: 3,
    title: 'Redemption Rate',
    bigNumber: '54%',
    trendLabel: '+5%',
    toggle: 'Department',
    barColor: '#F5A623',
    barColorLight: '#FCCF7E',
    labels: ['Eng', 'Sales', 'Mktg', 'HR', 'Prod'],
    heights: [58, 72, 90, 65, 48],
    tooltipBar: 2,
    tooltipText: '65% Redemption Rate',
  },
];

const HOLD_TIME = 3500;

const AnalyticsShowcase = () => {
  const [stateIndex, setStateIndex] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [barsKey, setBarsKey] = useState(0);

  const current = STATES[stateIndex];

  const advance = useCallback(() => {
    setShowTooltip(false);
    setBarsKey((k) => k + 1);
    setStateIndex((prev) => (prev + 1) % STATES.length);
  }, []);

  // Show tooltip after bars animate
  useEffect(() => {
    const tooltipTimer = setTimeout(() => setShowTooltip(true), 800);
    return () => clearTimeout(tooltipTimer);
  }, [stateIndex]);

  // Hold then advance
  useEffect(() => {
    const timer = setTimeout(advance, HOLD_TIME);
    return () => clearTimeout(timer);
  }, [stateIndex, advance]);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden" style={{ background: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left column — animated card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center lg:justify-start"
          >
            <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              {/* Header row */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-[Poppins] font-semibold text-base" style={{ color: '#0F0D33' }}>
                  {current.title}
                </h3>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="transition-all duration-300"
                      style={{
                        width: current.metricIndex === i ? 16 : 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: current.metricIndex === i ? current.barColor : '#D1D5DB',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Big number + trend */}
              <div className="flex items-end gap-3 mb-5">
                <span className="font-[Poppins] text-3xl font-bold" style={{ color: '#0F0D33' }}>
                  {current.bigNumber}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mb-1" style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>
                  <TrendingUp size={12} />
                  {current.trendLabel}
                </span>
              </div>

              {/* Department / Person toggle */}
              <div className="flex gap-2 mb-6">
                {(['Department', 'Person'] as const).map((label) => (
                  <div
                    key={label}
                    className="px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300"
                    style={{
                      border: current.toggle === label ? `1.5px solid ${current.barColor}` : '1.5px solid #E5E7EB',
                      color: current.toggle === label ? current.barColor : '#9CA3AF',
                      backgroundColor: current.toggle === label ? `${current.barColor}08` : 'transparent',
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div className="flex items-end justify-between gap-3 h-[160px] relative">
                {current.labels.map((label, i) => (
                  <div key={`${barsKey}-${i}`} className="flex-1 flex flex-col items-center relative h-full justify-end">
                    {/* Tooltip */}
                    <AnimatePresence>
                      {showTooltip && current.tooltipBar === i && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.3 }}
                          className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-10"
                        >
                          <div
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white shadow-md"
                            style={{ backgroundColor: current.barColor }}
                          >
                            {current.tooltipText}
                          </div>
                          <div
                            className="w-2 h-2 rotate-45 mx-auto -mt-1"
                            style={{ backgroundColor: current.barColor }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${current.heights[i]}%` }}
                      transition={{ duration: 0.6, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="w-full rounded-t-md"
                      style={{
                        background: `linear-gradient(to top, ${current.barColor}, ${current.barColorLight})`,
                      }}
                    />
                    {/* Label */}
                    <span className="text-[10px] mt-2 font-medium" style={{ color: '#9CA3AF' }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right column — text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="font-[Poppins] text-3xl md:text-4xl lg:text-[44px] font-semibold leading-tight mb-6" style={{ color: '#0F0D33' }}>
              Analytics that show what's really happening
            </h2>
            <p className="text-lg md:text-xl leading-relaxed" style={{ color: 'rgba(15, 13, 51, 0.7)' }}>
              Track recognition trends, engagement rates, and participation gaps across your entire organization. Make data-driven decisions about your team culture.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AnalyticsShowcase;
