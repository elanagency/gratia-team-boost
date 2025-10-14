import { motion } from 'framer-motion';
import { Zap, Gift, BarChart3, Users, MessageCircle, Star } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Zap,
      title: "Peer-to-Peer Recognition",
      description: "Empower employees to give instant kudos and appreciation to their colleagues.",
      gradient: "from-[#FC36FF] to-[#7F38B7]"
    },
    {
      icon: Gift,
      title: "Points & Gift Cards",
      description: "Employees earn points for recognition, redeemable for a wide range of gift cards.",
      gradient: "from-[#7A1BF7] to-[#00C2FF]"
    },
    {
      icon: BarChart3,
      title: "Real-time HR Analytics",
      description: "HR personnel gain insights into team collaboration and recognition trends.",
      gradient: "from-[#00E5A1] to-[#00C2FF]"
    },
    {
      icon: Users,
      title: "Team Celebrations",
      description: "Celebrate wins together with team-wide shoutouts and achievements.",
      gradient: "from-[#00E5A1] to-[#7F38B7]"
    },
    {
      icon: MessageCircle,
      title: "Social Recognition Feed",
      description: "Create a vibrant culture of appreciation with a dynamic recognition feed.",
      gradient: "from-[#FC36FF] to-[#7A1BF7]"
    },
    {
      icon: Star,
      title: "Custom Badges",
      description: "Design unique badges that reflect your company values and culture.",
      gradient: "from-[#7F38B7] to-[#00C2FF]"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to
            <span className="block text-gradient">Spread the Love</span>
          </h2>
          <p className="text-xl text-gray-300 mx-auto">
            Powerful features designed to make employee recognition effortless and enjoyable
          </p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="card-gradient rounded-3xl p-8 border border-white/50 shadow-lg hover:shadow-2xl transition-shadow duration-300 group cursor-pointer"
              >
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-semibold mb-3 text-white">
                  {feature.title}
                </h3>
                
                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
