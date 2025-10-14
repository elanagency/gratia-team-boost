import { motion } from 'framer-motion';
import { UserPlus, Heart, TrendingUp } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      title: 'Set Up Your Team',
      description: 'Invite your team members in minutes. Simple onboarding, zero hassle!',
      gradient: 'from-[#FC36FF] to-[#7F38B7]',
    },
    {
      icon: Heart,
      title: 'Start Recognizing',
      description: 'Empower employees to send kudos and earn points for every appreciation.',
      gradient: 'from-[#7A1BF7] to-[#00C2FF]',
    },
    {
      icon: TrendingUp,
      title: 'Watch Engagement Soar',
      description: 'See morale boost, productivity rise, and culture transform with real-time analytics!',
      gradient: 'from-[#00E5A1] to-[#00C2FF]',
    },
  ];

  return (
    <section className="py-24 px-4 bg-[#0F0533] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-10 w-64 h-64 bg-[#7A1BF7]/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Get Started in
            <span className="block text-gradient">3 Simple Steps</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            No complex setup, no training needed. Just pure recognition magic! ✨
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="relative"
            >
              <div className="card-gradient p-8 rounded-3xl border border-white/50 shadow-lg text-center relative">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-[#FC36FF] to-[#7A1BF7] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {index + 1}
                </div>

                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  className={`inline-flex p-6 rounded-3xl bg-gradient-to-br ${step.gradient} mb-6 shadow-xl`}
                >
                  <step.icon className="w-12 h-12 text-white" />
                </motion.div>

                <h3 className="text-2xl font-bold mb-4 text-white">{step.title}</h3>
                <p className="text-gray-300 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
