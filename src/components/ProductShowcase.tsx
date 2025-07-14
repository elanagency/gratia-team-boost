
import { Star, Gift, TrendingUp, Users, Award, Coffee, Heart, Target, ShoppingBag, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Recognition Example Card */}
          <Card className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-grattia-teal to-grattia-purple flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Sarah Martinez</h3>
                  <p className="text-sm text-white/70">Marketing Team</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 mb-4">
                <p className="text-white/90 text-sm italic">
                  "Amazing work on the Q3 campaign! Your creative approach increased engagement by 45%."
                </p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-grattia-teal font-medium">+150 points</span>
                <span className="text-white/60 text-xs">2 hours ago</span>
              </div>
            </CardContent>
          </Card>

          {/* Another Recognition Card */}
          <Card className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 animate-fade-in [animation-delay:200ms]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-grattia-purple to-grattia-teal flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Alex Thompson</h3>
                  <p className="text-sm text-white/70">Development Team</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 mb-4">
                <p className="text-white/90 text-sm italic">
                  "Outstanding debugging skills! Fixed the critical issue in record time."
                </p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-grattia-purple font-medium">+200 points</span>
                <span className="text-white/60 text-xs">5 hours ago</span>
              </div>
            </CardContent>
          </Card>

          {/* Reward Store Card */}
          <Card className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 animate-fade-in [animation-delay:400ms]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShoppingBag className="w-8 h-8 text-grattia-teal" />
                <h3 className="text-lg font-semibold text-white">Reward Store</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded"></div>
                    <span className="text-white text-sm">Coffee Voucher</span>
                  </div>
                  <span className="text-grattia-teal font-medium">50 pts</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded"></div>
                    <span className="text-white text-sm">Extra PTO Day</span>
                  </div>
                  <span className="text-grattia-purple font-medium">500 pts</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded"></div>
                    <span className="text-white text-sm">Team Lunch</span>
                  </div>
                  <span className="text-grattia-teal font-medium">200 pts</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Points Dashboard Card */}
          <Card className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 animate-fade-in [animation-delay:600ms]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-8 h-8 text-grattia-purple" />
                <h3 className="text-lg font-semibold text-white">Your Points</h3>
              </div>
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-white mb-2">1,247</div>
                <p className="text-white/70 text-sm">Total Points Earned</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/70 text-sm">This Month</span>
                  <span className="text-grattia-teal font-medium">+320</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70 text-sm">Available</span>
                  <span className="text-white font-medium">892</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-gradient-to-r from-grattia-teal to-grattia-purple h-2 rounded-full" style={{width: '71%'}}></div>
                </div>
                <p className="text-xs text-white/60 text-center">71% towards next milestone</p>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Team Engagement Card */}
          <Card className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 animate-fade-in [animation-delay:800ms]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-8 h-8 text-grattia-teal" />
                <h3 className="text-lg font-semibold text-white">Team Engagement</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-grattia-teal mb-1">87%</div>
                  <p className="text-white/70 text-xs">Participation</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-grattia-purple mb-1">4.8</div>
                  <p className="text-white/70 text-xs">Avg Recognition</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Recognition Given</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 bg-white/20 rounded-full h-1.5">
                      <div className="bg-grattia-purple h-1.5 rounded-full" style={{width: '92%'}}></div>
                    </div>
                    <span className="text-white text-sm font-medium">92%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Team Satisfaction</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 bg-white/20 rounded-full h-1.5">
                      <div className="bg-grattia-teal h-1.5 rounded-full" style={{width: '85%'}}></div>
                    </div>
                    <span className="text-white text-sm font-medium">85%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Active Members</span>
                  <span className="text-white text-sm font-medium">23/27</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Monthly Highlights Card */}
          <Card className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 animate-fade-in [animation-delay:1000ms]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-8 h-8 text-grattia-purple" />
                <h3 className="text-lg font-semibold text-white">Monthly Highlights</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-grattia-teal to-grattia-purple flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Recognition Sent</p>
                    <p className="text-grattia-teal text-lg font-bold">142</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-grattia-purple to-grattia-teal flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Points Distributed</p>
                    <p className="text-grattia-purple text-lg font-bold">8,450</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-grattia-teal/20 to-grattia-purple/20 rounded-lg p-3">
                  <p className="text-white/90 text-sm font-medium mb-1">Top Achievement</p>
                  <p className="text-grattia-teal text-xs">Marketing team exceeded Q4 goals by 28%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
