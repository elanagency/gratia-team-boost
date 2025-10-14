import { motion } from 'framer-motion';
import { Gift, Users, TrendingUp, Award, Sparkles, Heart } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Gift,
      title: "Instant Recognition",
      description: "Send points in real-time to celebrate wins, big and small.",
      gradient: "from-[#FC36FF] to-[#7A1BF7]"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Foster teamwork and strengthen connections across your organization.",
      gradient: "from-[#7A1BF7] to-[#FC36FF]"
    },
    {
      icon: TrendingUp,
      title: "Track Impact",
      description: "Measure engagement and see how recognition drives performance.",
      gradient: "from-[#FC36FF] to-[#7A1BF7]"
    },
    {
      icon: Award,
      title: "Reward Store",
      description: "Choose from hundreds of gift cards and experiences to redeem.",
      gradient: "from-[#7A1BF7] to-[#FC36FF]"
    },
    {
      icon: Sparkles,
      title: "Custom Programs",
      description: "Tailor recognition programs to match your company culture.",
      gradient: "from-[#FC36FF] to-[#7A1BF7]"
    },
    {
      icon: Heart,
      title: "Employee Wellness",
      description: "Boost morale and create a positive workplace environment.",
      gradient: "from-[#7A1BF7] to-[#FC36FF]"
    }
  ];

  return (
    <section id="features" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Teams Love <span className="text-gradient">Grattia</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Everything you need to build a culture of recognition and appreciation
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="card-gradient rounded-2xl p-8 relative overflow-hidden group cursor-pointer"
              >
                {/* Animated gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6`}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3 text-white">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-300">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
