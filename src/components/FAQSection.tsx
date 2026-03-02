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
      question: "What if our employees don't use it?",
      answer:
        "The platforms that go unused are the ones that feel like extra work. Grattia lives inside Slack and Teams, takes 30 seconds to use, and taps into something people genuinely want to do. Appreciate each other. Adoption tends to happen naturally once the first few recognitions go out and the whole team can see them.",
    },
    {
      question: "We already do shoutouts in Slack. Why do we need this?",
      answer:
        "Informal recognition is a great start, but it disappears. It doesn't get logged, it doesn't carry into performance reviews, and leadership has no visibility into it. Grattia keeps the spirit of what you're already doing and makes it permanent, measurable, and useful across your entire HR function.",
    },
  ],
  "Integrations & Setup": [
    {
      question: "Does it work with Slack and Microsoft Teams?",
      answer:
        "Yes. Recognitions sent in Grattia surface directly in your Slack or Teams channels so the whole team can celebrate together in real time.",
    },
    {
      question: "Do we need IT involved to set this up?",
      answer:
        "No. Grattia requires zero IT involvement. Any HR or people team leader can set it up independently without raising a single ticket.",
    },
    {
      question: "How long does it take to get set up?",
      answer:
        "Most teams are live the same day they sign up. Grattia is fully self-serve with no IT involvement required. Import your team, connect Slack or Teams, set your company values, and you're ready to go.",
    },
  ],
  Rewards: [
    {
      question: "How do employees redeem their points?",
      answer:
        "Employees log into Grattia and choose from 300+ gift card options across top brands. Redemptions are instant and there are no redemption fees ever.",
    },
    {
      question: "Are gift cards an additional cost?",
      answer:
        "No. When an employee redeems their points for a gift card, there is no additional charge to anyone. The value is already covered by the points included in your monthly seat cost. What you pay for your seats is what funds the rewards. Nothing extra, ever.",
    },
    {
      question: "Do giving points expire?",
      answer:
        "Yes. Every employee receives 100 fresh points at the start of each month, and unspent points reset when the new month begins. This is intentional. It keeps recognition flowing consistently rather than being saved up and forgotten. Think of it less like a budget and more like a habit. A little appreciation, spread around often, does more for your culture than a big gesture once in a while.",
    },
    {
      question: "What happens to earned reward points if an employee hasn't redeemed them?",
      answer:
        "Earned reward points accumulate in each employee's account until they're ready to redeem. There's no expiry pressure that would make the reward feel hollow.",
    },
  ],
  Scale: [
    {
      question: "We're a small team right now. Is Grattia worth it at our size?",
      answer:
        "Recognition culture is actually easier to build early than to fix later. Starting with Grattia when your team is small means the habit is already embedded by the time you scale. The earlier you start, the stronger the culture foundation.",
    },
    {
      question: "What happens when we grow past 500 employees?",
      answer:
        "Grattia's standard pricing applies up to 500 seats. Beyond that we offer volume-based pricing. Reach out and we'll put together a straightforward quote with no surprises.",
    },
  ],
};

const categories = Object.keys(faqData);

const FAQSection = () => {
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  return (
    <section className="py-24 px-4 bg-white" id="faqs">
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
                className={`whitespace-nowrap rounded-[14px] text-sm font-medium transition-colors text-left w-full ${
                  activeCategory === cat
                    ? "text-white"
                    : "hover:bg-gray-100"
                }`}
                style={{
                  padding: "15px 24px 17px 24px",
                  backgroundColor:
                    activeCategory === cat ? "#7F78F8" : "transparent",
                  color: activeCategory === cat ? "#ffffff" : "#0F0D33",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ Accordion */}
          <div className="min-h-[500px]">
            <Accordion type="single" collapsible className="space-y-3">
              {faqData[activeCategory].map((item, i) => (
                <AccordionItem
                  key={`${activeCategory}-${i}`}
                  value={`item-${i}`}
                  className="border border-[#F3F4F6] rounded-[16px] px-6 bg-white"
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
