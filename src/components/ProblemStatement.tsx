import { motion } from 'framer-motion';

const cards = [
  {
    title: 'The Quiet Contributor',
    body: 'Your hardest workers are often your least visible ones. They deserve to be seen just as much as anyone else.',
  },
  {
    title: 'The Silo Problem',
    body: "Teams naturally celebrate their own, but the people who bridge departments and drive collaboration rarely get the credit they've earned.",
  },
  {
    title: 'Invisible Work',
    body: 'The late nights, the saved projects, the teammate who always shows up. None of it shows up in a report.',
  },
  {
    title: 'The Memory Trap',
    body: 'Reviews are based on what managers remember from last week, not last year.',
  },
];

const ProblemStatement = () => {
  return (
    <section className="bg-white py-24 px-6 md:px-[136px]">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-[Poppins] text-[32px] md:text-[48px] font-bold leading-[125%] text-[#0F0D33] mb-6"
        >
          Your people appreciate each other more than you know. The problem is, that appreciation is invisible.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="font-[Poppins] text-[18px] md:text-[20px] font-normal leading-[140%] text-[#4A5565]"
        >
          Grattia brings it to the surface — in real time, across your whole company.
        </motion.p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="border border-[#E5E7EB] rounded-2xl p-8"
          >
            <h3 className="font-[Poppins] text-[24px] font-bold leading-[133%] tracking-[-0.6px] text-[#0F0D33] mb-4">
              {card.title}
            </h3>
            <p className="font-[Poppins] text-[16px] leading-[160%] text-[#4A5565]">
              {card.body}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ProblemStatement;
