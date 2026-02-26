import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RecognitionCard {
  id: number;
  sender: string;
  senderInitials: string;
  senderColor: string;
  recipient: string;
  recipientInitials: string;
  recipientColor: string;
  points: number;
  category: string;
  categoryColor: string;
  message: string;
  reactions: { emoji: string; count: number }[];
}

const cards: RecognitionCard[] = [
  {
    id: 1,
    sender: 'Sarah Jenkins',
    senderInitials: 'SJ',
    senderColor: 'bg-pink-400',
    recipient: 'Alex Chen',
    recipientInitials: 'AC',
    recipientColor: 'bg-blue-400',
    points: 50,
    category: 'TEAMWORK',
    categoryColor: 'bg-blue-100 text-blue-700',
    message: '"Your collaboration on the product launch was outstanding. Thanks for always being there for the team!"',
    reactions: [
      { emoji: '🎉', count: 12 },
      { emoji: '❤️', count: 8 },
      { emoji: '👏', count: 5 },
    ],
  },
  {
    id: 2,
    sender: 'Shomari Love',
    senderInitials: 'SL',
    senderColor: 'bg-emerald-400',
    recipient: 'Priya Patel',
    recipientInitials: 'PP',
    recipientColor: 'bg-purple-400',
    points: 100,
    category: 'CULTURE',
    categoryColor: 'bg-orange-100 text-orange-700',
    message: '"You bring such positive energy to every meeting. Your mentorship has been invaluable to the new hires!"',
    reactions: [
      { emoji: '🙌', count: 15 },
      { emoji: '💜', count: 9 },
      { emoji: '🔥', count: 7 },
    ],
  },
  {
    id: 3,
    sender: 'Elena Rodriguez',
    senderInitials: 'ER',
    senderColor: 'bg-amber-400',
    recipient: 'David Kim',
    recipientInitials: 'DK',
    recipientColor: 'bg-teal-400',
    points: 75,
    category: 'EXCELLENCE',
    categoryColor: 'bg-green-100 text-green-700',
    message: '"Your attention to detail on the Q3 report saved us hours of revision. Truly exceptional work!"',
    reactions: [
      { emoji: '⭐', count: 10 },
      { emoji: '🏆', count: 6 },
      { emoji: '💪', count: 4 },
    ],
  },
];

const RecognitionCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cards.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getCardIndex = (offset: number) => {
    return (activeIndex + offset + cards.length) % cards.length;
  };

  return (
    <div className="relative h-[480px] w-full max-w-[420px] mx-auto overflow-hidden">
      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

      <div className="relative h-full flex flex-col items-center justify-center">
        <AnimatePresence mode="popLayout">
          {[-1, 0, 1].map((offset) => {
            const cardIndex = getCardIndex(offset);
            const card = cards[cardIndex];
            const isCenter = offset === 0;

            return (
              <motion.div
                key={`${card.id}-${offset}`}
                layout
                initial={{ opacity: 0, y: offset * 100, scale: 0.85 }}
                animate={{
                  opacity: isCenter ? 1 : 0.5,
                  y: offset * 170,
                  scale: isCenter ? 1 : 0.88,
                  zIndex: isCenter ? 20 : 10,
                }}
                exit={{ opacity: 0, y: -200, scale: 0.8 }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                className="absolute w-full"
              >
                <div
                  className={`bg-white rounded-2xl p-5 border transition-shadow duration-300 ${
                    isCenter
                      ? 'shadow-xl border-gray-200'
                      : 'shadow-md border-gray-100'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-9 h-9 rounded-full ${card.senderColor} flex items-center justify-center text-white text-xs font-bold`}
                      >
                        {card.senderInitials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0F0D33]">
                          {card.sender}{' '}
                          <span className="font-normal text-gray-500">recognized</span>{' '}
                          {card.recipient}
                        </p>
                      </div>
                    </div>
                    <span className="bg-gradient-to-r from-[#FC36FF] to-[#7A1BF7] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      +{card.points}
                    </span>
                  </div>

                  {/* Category tag */}
                  <span
                    className={`inline-block text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full mb-3 ${card.categoryColor}`}
                  >
                    {card.category}
                  </span>

                  {/* Message */}
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 italic">
                    {card.message}
                  </p>

                  {/* Reactions */}
                  <div className="flex gap-2">
                    {card.reactions.map((reaction, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-2.5 py-1 text-xs"
                      >
                        {reaction.emoji}{' '}
                        <span className="text-gray-500 font-medium">
                          {reaction.count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RecognitionCarousel;
