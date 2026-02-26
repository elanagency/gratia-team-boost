import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, X } from "lucide-react";

const faqData: Record<string, { question: string; answer: string }[]> = {
  "Pricing & Value": [
    {
      question: "How is the $10 per seat actually calculated?",
      answer:
        "It's simple. $10 per seat per month gives every employee 100 points to recognize their colleagues with. That's $5 of recognition value per person, per month. For a 50 person team, that's $250 of peer appreciation flowing through your company every month that didn't exist before.",
    },
    {
      question: "Is 100 points per month enough?",
      answer:
        "More than you'd think. 100 points per user means every single person on your team has something meaningful to give every month. When recognition is distributed evenly across the whole company rather than concentrated at the top, the culture impact is significant even at modest point values.",
    },
    {
      question: "Are there any fees we haven't mentioned?",
      answer:
        "No. No implementation fees, no support fees, no redemption fees, no surprise invoices. The only costs are your base seat cost and whatever celebration budget you choose to set, which is completely optional and fully in your control.",
    },
    {
      question: "When do I actually get charged?",
      answer:
        "You can sign up and explore Grattia completely free. You won't be charged anything until you start inviting your team members.",
    },
  ],
  "Adoption & Usage": [
    {
      question: "How long does it take to see results?",
      answer:
        "Most teams see a noticeable increase in peer recognition within the first two weeks. The monthly points reset creates a natural rhythm that keeps engagement consistent.",
    },
    {
      question: "What if some team members don't participate?",
      answer:
        "That's completely normal at first. As recognition flows increase and people start receiving points, participation tends to grow organically. The leaderboard and feed features also help drive engagement.",
    },
  ],
  "Integrations & Setup": [
    {
      question: "How long does setup take?",
      answer:
        "About 5 minutes. Connect your Slack or Teams workspace, invite your team, and you're ready to go. No IT involvement needed.",
    },
    {
      question: "Does it work with both Slack and Microsoft Teams?",
      answer:
        "Yes. Grattia integrates natively with both Slack and Microsoft Teams, so your team can send recognition right where they already work.",
    },
  ],
  Rewards: [
    {
      question: "What gift cards are available?",
      answer:
        "We offer a curated catalog of popular brands including Amazon, Starbucks, Nike, Visa, and many more. Team members choose the rewards that matter most to them.",
    },
    {
      question: "Are there any redemption fees?",
      answer:
        "Never. When your team redeems points for gift cards, 100% of the value goes to them. No markups, no processing fees, no hidden charges.",
    },
  ],
  Scale: [
    {
      question: "Can Grattia handle large teams?",
      answer:
        "Absolutely. Grattia is built to scale from small teams to organizations with hundreds of employees. For teams over 500, contact us for volume pricing.",
    },
    {
      question: "Can we add or remove team members anytime?",
      answer:
        "Yes. Billing adjusts automatically with prorated charges when you add members, and scales down when you remove them.",
    },
  ],
};

const categories = Object.keys(faqData);

const FAQSection = () => {
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  return (
    <section className="py-24 px-4 bg-white" id="faq">
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-4xl md:text-5xl font-bold text-center mb-16"
          style={{ color: "#0F0D33", fontFamily: "Roboto, sans-serif" }}
        >
          Everything you need to know.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10">
          {/* Category Tabs */}
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-colors text-left ${
                  activeCategory === cat
                    ? "text-white"
                    : "hover:bg-muted"
                }`}
                style={{
                  backgroundColor:
                    activeCategory === cat ? "#4F46E5" : "transparent",
                  color: activeCategory === cat ? "#ffffff" : "#0F0D33",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ Accordion */}
          <div>
            <Accordion type="single" collapsible className="space-y-3">
              {faqData[activeCategory].map((item, i) => (
                <AccordionItem
                  key={`${activeCategory}-${i}`}
                  value={`item-${i}`}
                  className="border rounded-xl px-6 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] data-[state=open]:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="hover:no-underline text-left [&>svg]:hidden">
                    <span
                      className="text-base font-medium pr-4"
                      style={{ color: "#0F0D33" }}
                    >
                      {item.question}
                    </span>
                    <span className="ml-auto shrink-0 text-muted-foreground">
                      <Plus className="h-5 w-5 block [[data-state=open]_&]:hidden" />
                      <X className="h-5 w-5 hidden [[data-state=open]_&]:block" />
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-[15px] leading-relaxed pb-5">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
