import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Send, Star, CheckCircle2, Gift, ShoppingCart } from 'lucide-react';

const TypingText = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setTypingComplete(true);
        if (onComplete) onComplete();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [text, onComplete]);
  
  return (
    <p className="text-gray-300 h-12">
      {displayedText}
      {!typingComplete && <span className="animate-ping">|</span>}
    </p>
  );
};

const ProductAnimation = () => {
  const [step, setStep] = useState(0);
  const [loopKey, setLoopKey] = useState(0);
  const points = useMotionValue(0);
  const roundedPoints = useTransform(points, latest => Math.round(latest));
  const totalPoints = useMotionValue(0);
  const roundedTotalPoints = useTransform(totalPoints, latest => Intl.NumberFormat('en-US').format(Math.round(latest)));

  useEffect(() => {
    const sequence = async () => {
      if (step === 0) {
        await new Promise(res => setTimeout(res, 1000));
        setStep(1);
      }
    };
    sequence();
  }, [step, loopKey]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 4) {
      timer = setTimeout(() => {
        setStep(5);
        animate(totalPoints, 3000, { duration: 1.5, ease: 'easeOut' });
      }, 2000);
    }
    if (step === 5) {
      timer = setTimeout(() => {
        setStep(6);
      }, 2500);
    }
    if (step === 6) {
      timer = setTimeout(() => {
        setStep(7);
      }, 1500);
    }
    if (step === 7) {
      timer = setTimeout(() => {
        setStep(0);
        points.set(0);
        totalPoints.set(0);
        setLoopKey(prev => prev + 1);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [step, points, totalPoints]);

  const handleTypingComplete = () => {
    setTimeout(() => {
      setStep(3);
      setTimeout(() => {
        setStep(4);
      }, 1000);
    }, 500);
  };

  useEffect(() => {
    let controls: any;
    if (step === 1) {
      controls = animate(points, 50, { duration: 2.5 });
    }
    return () => controls?.stop();
  }, [step, points]);
  
  return (
    <motion.div
      key={loopKey}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="card-gradient w-full max-w-md rounded-2xl shadow-2xl p-6 border-2 border-[#7A1BF7]/30"
    >
      <AnimatePresence mode="wait">
        {step < 4 ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
            className="min-h-[220px]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-white">New Recognition</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>To: James</span>
              </div>
            </div>
            <div className="bg-black/20 p-3 rounded-xl mb-4">
              {step >= 1 ? (
                <TypingText text="Thanks for the amazing work on the Q3 report!" onComplete={handleTypingComplete} />
              ) : (
                <p className="text-gray-500 h-12">Write a message...</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-[#FC36FF]" />
                <span className="font-semibold text-white">Points:</span>
                <motion.span className="font-bold text-gradient text-lg w-8 text-center">
                  {roundedPoints}
                </motion.span>
              </div>
              <motion.button
                animate={step === 3 ? { scale: [1, 0.95, 1] } : {}}
                transition={step === 3 ? { duration: 0.5, ease: 'easeInOut' } : {}}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold transition-colors duration-300 ${
                  step >= 3 ? 'bg-gradient-to-r from-[#FC36FF] to-[#7A1BF7]' : 'bg-white/10 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                Send
              </motion.button>
            </div>
          </motion.div>
        ) : step === 4 ? (
          <motion.div
            key="recognition-success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
            className="flex flex-col items-center justify-center min-h-[220px] text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
            >
              <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-2">Recognition Sent!</h3>
            <p className="text-gray-300">James will be notified.</p>
          </motion.div>
        ) : step >= 5 && step < 7 ? (
          <motion.div
            key="redeem-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="flex flex-col items-center justify-center min-h-[220px] text-center rounded-2xl p-4 bg-black/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <Gift className="w-8 h-8 text-[#00C2FF]" />
              <h3 className="text-2xl font-bold text-white">Your Points Balance</h3>
            </div>
            <div className="text-5xl font-bold text-gradient mb-6">
              <motion.span>{roundedTotalPoints}</motion.span>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={step === 6 ? { scale: [1, 0.95, 1], transition: { duration: 0.3 } } : {}} 
              className="flex items-center gap-3 px-6 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-[#00C2FF] to-[#0082FF] shadow-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              Redeem for a Gift Card
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="redeem-success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.5 } }}
            className="flex flex-col items-center justify-center min-h-[220px] text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
            >
              <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-2">Gift Card Redeemed!</h3>
            <p className="text-gray-300">Enjoy your reward!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductAnimation;
