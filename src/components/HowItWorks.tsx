
const steps = [
  {
    number: 1,
    title: "Give Recognition",
    description: "Instantly send points with a personal message"
  },
  {
    number: 2,
    title: "Collect Points",
    description: "Watch your points grow with each recognition"
  },
  {
    number: 3,
    title: "Choose Rewards",
    description: "Browse our curated reward catalog"
  },
  {
    number: 4,
    title: "Redeem & Enjoy",
    description: "Get your rewards instantly delivered"
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Simple & Effective
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div 
              key={step.number} 
              className="flex flex-col items-center border border-grattia-purple-light/20 rounded-2xl p-6 relative overflow-hidden animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-full bg-grattia-pink flex items-center justify-center text-white font-semibold text-lg mb-4">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">{step.title}</h3>
              <p className="text-gray-300 text-center">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
