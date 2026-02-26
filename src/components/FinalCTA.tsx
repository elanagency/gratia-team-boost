import { Link } from "react-router-dom";

const FinalCTA = () => {
  return (
    <section className="py-32 px-4 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight"
          style={{ color: "#0F0D33", fontFamily: "Roboto, sans-serif" }}
        >
          Your people are doing great work right now.
        </h2>
        <p
          className="text-lg md:text-xl mb-2"
          style={{ color: "#6B7280" }}
        >
          Someone stayed late. Someone saved a project. None of that was recognized today.
        </p>
        <p
          className="text-lg md:text-xl mb-12"
          style={{ color: "#6B7280" }}
        >
          Grattia makes sure it stops slipping by.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#0F0D33" }}
          >
            Get Started
          </Link>
          <a
            href="https://calendly.com/pedro-grattia/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-medium border-2 transition-colors hover:bg-gray-50"
            style={{ borderColor: "#0F0D33", color: "#0F0D33" }}
          >
            Book a Demo
          </a>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
