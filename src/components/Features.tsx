import { Gift, LineChart, Store } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Gift className="h-12 w-12 text-grattia-pink mb-4 mx-auto" />,
      title: "Instant Recognition",
      description: "Send points in real-time to celebrate wins, big and small."
    },
    {
      icon: <LineChart className="h-12 w-12 text-grattia-pink mb-4 mx-auto" />,
      title: "Track Impact",
      description: "Measure engagement and see how recognition drives team performance."
    },
    {
      icon: <Store className="h-12 w-12 text-grattia-pink mb-4 mx-auto" />,
      title: "Reward Store",
      description: "Choose from hundreds of gift cards and experiences to redeem points."
    }
  ];

  return (
    <section id="features" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Why Teams Love Grattia
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="border border-grattia-purple-light/20 rounded-2xl p-8 relative overflow-hidden animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-center">
                {feature.icon}
                <h3 className="text-xl font-semibold mb-3 text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-300">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
