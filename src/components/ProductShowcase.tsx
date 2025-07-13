
import { Star, Gift, TrendingUp, Users, Award, Coffee } from 'lucide-react';

const ProductShowcase = () => {
  return (
    <section className="relative py-20 px-4 overflow-hidden" style={{ backgroundColor: '#0F0533' }}>
      {/* Background gradient effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-grattia-pink/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-grattia-purple/10 blur-3xl"></div>
      </div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            See How It Works
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Recognition made simple - give points, choose rewards, track impact
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {/* Recognition Card 1 */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-transform duration-300 animate-fade-in flex flex-col" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-grattia-pink rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">Sarah M.</p>
                <p className="text-gray-300 text-sm">Product Manager</p>
              </div>
            </div>
            <p className="text-white text-sm mb-3 flex-grow">
              "Amazing work on the new feature launch! Your attention to detail made all the difference."
            </p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-white text-sm">Recognition</span>
              </div>
              <div className="bg-grattia-pink px-3 py-1 rounded-full">
                <span className="text-white font-bold text-sm">+25 pts</span>
              </div>
            </div>
          </div>

          {/* Recognition Card 2 */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-transform duration-300 animate-fade-in flex flex-col" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-grattia-purple-light rounded-full flex items-center justify-center">
                <Award className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">Mike R.</p>
                <p className="text-gray-300 text-sm">Team Lead</p>
              </div>
            </div>
            <p className="text-white text-sm mb-3 flex-grow">
              "Thanks for staying late to help with the deployment. True team player!"
            </p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-white text-sm">Teamwork</span>
              </div>
              <div className="bg-grattia-pink px-3 py-1 rounded-full">
                <span className="text-white font-bold text-sm">+15 pts</span>
              </div>
            </div>
          </div>

          {/* Reward Store */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 animate-fade-in flex flex-col md:col-span-2 lg:col-span-1" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center gap-2 mb-4">
              <Gift className="h-5 w-5 text-grattia-pink" />
              <h3 className="text-white font-semibold">Reward Store</h3>
            </div>
            <div className="space-y-3 flex-grow">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Coffee className="h-8 w-8 text-amber-500" />
                  <div>
                    <p className="text-white font-medium text-sm">Coffee Gift Card</p>
                    <p className="text-gray-300 text-xs">$10 Starbucks</p>
                  </div>
                </div>
                <div className="bg-grattia-pink px-2 py-1 rounded text-white text-xs font-bold">
                  50 pts
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Gift className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-white font-medium text-sm">Amazon Gift Card</p>
                    <p className="text-gray-300 text-xs">$25 Amazon</p>
                  </div>
                </div>
                <div className="bg-grattia-pink px-2 py-1 rounded text-white text-xs font-bold">
                  100 pts
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-white font-medium text-sm">Team Lunch</p>
                    <p className="text-gray-300 text-xs">Group Experience</p>
                  </div>
                </div>
                <div className="bg-grattia-pink px-2 py-1 rounded text-white text-xs font-bold">
                  200 pts
                </div>
              </div>
            </div>
          </div>

          {/* Points Dashboard */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-transform duration-300 animate-fade-in flex flex-col" style={{ animationDelay: '0.8s' }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-grattia-pink" />
              <h3 className="text-white font-semibold">Your Points</h3>
            </div>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-white mb-1">247</div>
              <div className="text-gray-300 text-sm">Total Points</div>
            </div>
            <div className="space-y-3 flex-grow">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">This month</span>
                <span className="text-grattia-pink font-medium">+85 pts</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Recognition given</span>
                <span className="text-white">12</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Recognition received</span>
                <span className="text-white">8</span>
              </div>
              <div className="mt-4 pt-3 border-t border-white/20">
                <div className="text-xs text-gray-300 mb-2">Recent Activity</div>
                <div className="space-y-2">
                  <div className="text-xs text-white">+25 from Sarah for "Great work"</div>
                  <div className="text-xs text-white">+15 from Mike for "Team player"</div>
                  <div className="text-xs text-gray-400">-50 Coffee gift card redeemed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Engagement */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 animate-fade-in flex flex-col justify-center" style={{ animationDelay: '1s' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-white" />
              </div>
              <span className="text-white text-sm font-medium">Team Engagement</span>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">94%</div>
              <div className="text-gray-300 text-xs">↑ 12% from last month</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
