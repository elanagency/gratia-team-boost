import { motion } from 'framer-motion';
import { Slack, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SlackIntegration = () => {
  const handleLearnMore = () => {
    toast.info("🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀");
  };

  return (
    <section className="py-24 px-4 bg-[#0F0533]">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#00C2FF] to-[#00E5A1] rounded-xl">
              <Slack className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold">
              Integrates with <span className="text-gradient">Slack</span>
            </h2>
          </div>
          <p className="text-lg text-gray-300">
            Bring Grattia into your team's daily workflow. Give recognition, celebrate wins, and track points without ever leaving your favorite communication tool.
          </p>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#00E5A1]" />
              <span>Give kudos instantly with a simple slash command.</span>
            </li>
            <li className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#00E5A1]" />
              <span>Get real-time notifications for team shoutouts.</span>
            </li>
            <li className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#00E5A1]" />
              <span>Keep the culture of appreciation alive, right where you work.</span>
            </li>
          </ul>
          <Button
            onClick={handleLearnMore}
            size="lg"
            className="bg-gradient-to-r from-[#FC36FF] to-[#7A1BF7] hover:from-[#fd5eff] hover:to-[#8c3cff] text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Learn More
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative"
        >
          <div className="relative rounded-2xl shadow-2xl overflow-hidden border-4 border-white/10">
            <img
              className="w-full h-auto"
              alt="An example of the Grattia app being used inside a Slack channel to give recognition to an employee"
              src="https://images.unsplash.com/photo-1679958158521-133d541abf85" 
            />
          </div>
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-[#FC36FF] to-[#7A1BF7] rounded-full blur-2xl opacity-50"></div>
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-[#00C2FF] to-[#00E5A1] rounded-full blur-2xl opacity-50"></div>
        </motion.div>
      </div>
    </section>
  );
};

export default SlackIntegration;
