import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const FinalCTA = () => {
  return (
    <section className="py-40 px-4 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="font-[Poppins] text-[60px] font-extrabold leading-[75px] text-[#0F0D33] mb-10"
        >
          Your people are doing great work right now.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="font-[Poppins] text-[20px] leading-[32.5px] text-[#4A5565] mb-1"
        >
          Someone stayed late. Someone saved a project. None of that was recognized today.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="font-[Poppins] text-[20px] leading-[32.5px] text-[#4A5565] mb-14"
        >
          Grattia makes sure it stops slipping by.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex items-center justify-center gap-4"
        >
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
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
