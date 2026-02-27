import { Link } from "react-router-dom";

const FinalCTA = () => {
  return (
    <section className="py-40 px-4 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2
          className="font-[Poppins] text-[60px] font-extrabold leading-[75px] text-[#0F0D33] mb-10"
        >
          Your people are doing great work right now.
        </h2>
        <p
          className="font-[Poppins] text-[20px] leading-[32.5px] text-[#4A5565] mb-1"
        >
          Someone stayed late. Someone saved a project. None of that was recognized today.
        </p>
        <p
          className="font-[Poppins] text-[20px] leading-[32.5px] text-[#4A5565] mb-14"
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
