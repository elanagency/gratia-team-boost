import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Check, Search, ChevronDown, Loader2 } from 'lucide-react';

type Step = 'blank' | 'dropdown-open' | 'teammate-selected' | 'points-selected' | 'typing' | 'sending' | 'loading' | 'success';

const TIMINGS: Record<Step, number> = {
  'blank': 1500,
  'dropdown-open': 1200,
  'teammate-selected': 800,
  'points-selected': 800,
  'typing': 3000,
  'sending': 400,
  'loading': 1200,
  'success': 2500,
};

const MESSAGE_TEXT = "Great work leading the sprint review! The client loved the new features.";

const STEPS_ORDER: Step[] = ['blank', 'dropdown-open', 'teammate-selected', 'points-selected', 'typing', 'sending', 'loading', 'success'];

const RecognitionDemo = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [typedText, setTypedText] = useState('');

  const step = STEPS_ORDER[stepIndex];

  const advanceStep = useCallback(() => {
    setStepIndex((prev) => {
      const next = (prev + 1) % STEPS_ORDER.length;
      if (next === 0) setTypedText('');
      return next;
    });
  }, []);

  // Typing effect
  useEffect(() => {
    if (step !== 'typing') return;
    setTypedText('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypedText(MESSAGE_TEXT.slice(0, i));
      if (i >= MESSAGE_TEXT.length) clearInterval(interval);
    }, 35);
    return () => clearInterval(interval);
  }, [step]);

  // Step timer
  useEffect(() => {
    const timer = setTimeout(advanceStep, TIMINGS[step]);
    return () => clearTimeout(timer);
  }, [step, advanceStep]);

  const showTeammate = step !== 'blank' && step !== 'dropdown-open';
  const showPoints = step === 'points-selected' || step === 'typing' || step === 'sending' || step === 'loading';
  const showMessage = step === 'typing' || step === 'sending' || step === 'loading';
  const isSuccess = step === 'success';
  const isLoading = step === 'loading';
  const isSending = step === 'sending';
  const isDropdownOpen = step === 'dropdown-open';

  return (
    <section className="relative py-24 md:py-32 overflow-hidden" style={{ background: 'linear-gradient(to bottom, #F5F3FF, #ffffff)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-[Poppins] text-3xl md:text-4xl lg:text-[44px] font-bold leading-tight mb-6" style={{ color: '#0F0D33' }}>
              Recognition that becomes part of how your team works
            </h2>
            <p className="text-lg md:text-xl leading-relaxed" style={{ color: 'rgba(15, 13, 51, 0.7)' }}>
              When recognition is easy, it becomes a habit. Grattia makes sure every great moment gets acknowledged, not just the loudest ones.
            </p>
          </motion.div>

          {/* Right column — animated card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden min-h-[420px]">
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <SuccessState key="success" />
                ) : (
                  <FormState
                    key="form"
                    isDropdownOpen={isDropdownOpen}
                    showTeammate={showTeammate}
                    showPoints={showPoints}
                    showMessage={showMessage}
                    typedText={typedText}
                    isLoading={isLoading}
                    isSending={isSending}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

function FormState({
  isDropdownOpen,
  showTeammate,
  showPoints,
  showMessage,
  typedText,
  isLoading,
  isSending,
}: {
  isDropdownOpen: boolean;
  showTeammate: boolean;
  showPoints: boolean;
  showMessage: boolean;
  typedText: string;
  isLoading: boolean;
  isSending: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-[Poppins] font-semibold text-lg" style={{ color: '#0F0D33' }}>
          Send Recognition
        </h3>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
        </div>
      </div>

      {/* TO field */}
      <div className="mb-5">
        <label className="text-xs font-semibold tracking-wider mb-2 block" style={{ color: '#0F0D33' }}>TO</label>
        <div className="relative">
          <div
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors text-sm ${
              isDropdownOpen || showTeammate ? 'border-[#5e2ca5]' : 'border-gray-200'
            }`}
          >
            <span style={{ color: showTeammate ? '#0F0D33' : '#9ca3af' }}>
              {showTeammate ? 'Elena Rodriguez' : 'Select teammate...'}
            </span>
            <ChevronDown size={16} className="text-gray-400" />
          </div>

          {/* Dropdown */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-10 top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden"
              >
                <div className="p-2">
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-50 mb-1">
                    <Search size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-400">Search...</span>
                  </div>
                  <div className="px-2 py-2 rounded hover:bg-gray-50 text-sm cursor-pointer flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-medium text-[#5e2ca5]">ER</div>
                    Elena Rodriguez
                  </div>
                  <div className="px-2 py-2 rounded hover:bg-gray-50 text-sm cursor-pointer flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">SM</div>
                    Sarah Miller
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* POINTS field */}
      <div className="mb-5">
        <label className="text-xs font-semibold tracking-wider mb-2 block" style={{ color: '#0F0D33' }}>POINTS</label>
        <div className="flex gap-2">
          {[10, 50, 100].map((pts) => {
            const isSelected = showPoints && pts === 50;
            return (
              <div
                key={pts}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-[#5e2ca5] text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                +{pts}
              </div>
            );
          })}
        </div>
      </div>

      {/* MESSAGE field */}
      <div className="mb-6">
        <label className="text-xs font-semibold tracking-wider mb-2 block" style={{ color: '#0F0D33' }}>MESSAGE</label>
        <div className="min-h-[80px] rounded-lg border border-gray-200 px-3 py-2.5 text-sm" style={{ color: '#0F0D33' }}>
          {showMessage ? (
            <span>
              {typedText}
              <span className="inline-block w-0.5 h-4 bg-[#5e2ca5] ml-0.5 animate-pulse align-text-bottom" />
            </span>
          ) : (
            <span className="text-gray-400">Write a message...</span>
          )}
        </div>
      </div>

      {/* Send button */}
      <motion.button
        animate={isSending ? { scale: 0.97 } : { scale: 1 }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium text-sm transition-colors"
        style={{ backgroundColor: '#0F0D33' }}
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <>
            <Send size={16} />
            Send Recognition
          </>
        )}
      </motion.button>
    </motion.div>
  );
}

function SuccessState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="p-6 flex flex-col items-center justify-center min-h-[380px]"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5"
      >
        <Check size={32} className="text-green-500" />
      </motion.div>
      <h3 className="font-[Poppins] font-semibold text-xl mb-2" style={{ color: '#0F0D33' }}>
        Recognition Sent!
      </h3>
      <p className="text-sm text-gray-500 text-center">
        Elena will get a notification in Slack.
      </p>
    </motion.div>
  );
}

export default RecognitionDemo;
