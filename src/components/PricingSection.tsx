import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, LayoutGrid } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const FEATURES = [
  "100 monthly points per user to give as recognition",
  "Zero redemption fees, always",
  "Automated birthday and anniversary celebrations",
  "Slack and Teams integration",
  "Real-time analytics",
  "Dedicated support",
];

const PricingSection = () => {
  const [employees, setEmployees] = useState(2);
  const [giftValue, setGiftValue] = useState(0);

  const seatCost = employees * 10;
  const celebrationCost = giftValue * Math.round(employees * 0.167);
  const totalCost = seatCost + celebrationCost;

  return (
    <section id="pricing" className="py-20 px-4 md:px-8 bg-white">
      <div
        className="max-w-6xl mx-auto rounded-3xl p-8 md:p-14"
        style={{
          background: "linear-gradient(180deg, #F5F3FF, #ffffff)",
          border: "1px solid rgba(127,120,248,0.2)",
          boxShadow: "0 4px 32px rgba(127,120,248,0.08)",
        }}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4" style={{ color: "#0F0D33", fontFamily: "Poppins, sans-serif" }}>
            Transparent pricing, no surprises
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
            One flat rate. No hidden fees. Ever.
            <br />
            What you see here is exactly what you pay.
          </p>
        </div>

        {/* Two columns */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left - Calculator */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-border/50">
            {/* Company Size */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-sm" style={{ color: "#0F0D33" }}>Company Size</span>
                <Badge
                  className="border text-xs font-semibold"
                  style={{ backgroundColor: "#F5F3FF", color: "#7F78F8", borderColor: "rgba(127,120,248,0.2)" }}
                >
                  {employees} employees
                </Badge>
              </div>
              <Slider
                value={[employees]}
                onValueChange={(v) => setEmployees(v[0])}
                min={2}
                max={500}
                step={1}
                className="mb-4 [&_[data-radix-slider-track]]:bg-purple-100 [&_[data-radix-slider-range]]:bg-purple-500 [&_[data-radix-slider-thumb]]:border-purple-500"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Platform access and 100 points per user per month</span>
                <span className="font-medium whitespace-nowrap ml-2">$10 / seat per month</span>
              </div>
            </div>

            {/* Celebration Gift Value */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm" style={{ color: "#0F0D33" }}>Celebration Gift Value</span>
                  <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground/30">Optional</Badge>
                </div>
                <Badge
                  className="border text-xs font-semibold"
                  style={{ backgroundColor: "#FDF2F8", color: "#E60076", borderColor: "#FCE7F3" }}
                >
                  ${giftValue} / event
                </Badge>
              </div>
              <Slider
                value={[giftValue]}
                onValueChange={(v) => setGiftValue(v[0])}
                min={0}
                max={100}
                step={5}
                className="mb-4 [&_[data-radix-slider-track]]:bg-pink-100 [&_[data-radix-slider-range]]:bg-pink-400 [&_[data-radix-slider-thumb]]:border-pink-400"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Monthly cost based on your team's events</span>
                <span className="font-medium whitespace-nowrap ml-2">${celebrationCost}/mo</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50 my-6" />

            {/* Total */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Monthly Cost</p>
                <p className="text-4xl font-bold mb-1" style={{ color: "#0F0D33" }}>
                  ${totalCost.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Platform, points, and celebrations.</p>
              </div>
              <Button asChild className="rounded-xl px-8 py-5 text-sm font-semibold" style={{ backgroundColor: "#0F0D33" }}>
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </div>

          {/* Right - Everything Included */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 flex items-center justify-center"
                style={{ borderRadius: "10px", backgroundColor: "rgba(127,120,248,0.1)" }}
              >
                <LayoutGrid className="w-5 h-5" style={{ color: "#7F78F8" }} />
              </div>
              <h3 className="text-xl font-bold" style={{ color: "#0F0D33" }}>Everything included</h3>
            </div>

            <ul className="space-y-4 mb-8">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-sm" style={{ color: "#0F0D33" }}>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-border/50 pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                More than 500 employees?{" "}
                <a href="mailto:hello@grattia.com" className="font-semibold hover:underline" style={{ color: "#7F78F8" }}>
                  Contact us for volume pricing.
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
