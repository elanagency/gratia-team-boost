import { motion } from 'framer-motion';
import { Zap, Gift, BarChart3, Users, MessageCircle, Star } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Zap,
      title: "Peer-to-Peer Recognition",
      description: "Empower employees to give instant kudos and appreciation to their colleagues.",
      gradient: "from-[#00D4FF] to-[#9333EA]"
    },
    {
      icon: Gift,
      title: "Points & Gift Cards",
      description: "Employees earn points for recognition, redeemable for a wide range of gift cards.",
      gradient: "from-[#9333EA] to-[#00D4FF]"
    },
    {
      icon: BarChart3,
      title: "Real-time HR Analytics",
      description: "HR personnel gain insights into team collaboration and recognition trends.",
      gradient: "from-[#00D4FF] to-[#9333EA]"
    },
    {
      icon: Users,
      title: "Team Celebrations",
      description: "Celebrate wins together with team-wide shoutouts and achievements.",
      gradient: "from-[#9333EA] to-[#00D4FF]"
    },
    {
      icon: MessageCircle,
      title: "Social Recognition Feed",
      description: "Create a vibrant culture of appreciation with a dynamic recognition feed.",
      gradient: "from-[#00D4FF] to-[#9333EA]"
    },
    {
      icon: Star,
      title: "Custom Badges",
      description: "Design unique badges that reflect your company values and culture.",
      gradient: "from-[#9333EA] to-[#00D4FF]"
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
            Everything You Need to<br />
            <span className="text-gradient">Spread the Love</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Powerful features designed to make employee recognition effortless and enjoyable
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
