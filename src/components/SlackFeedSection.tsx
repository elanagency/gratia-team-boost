import { motion } from 'framer-motion';
import slackLogo from '@/assets/slack-logo.webp';
import teamsLogo from '@/assets/teams-logo.png';

const RECOGNITION_ENTRIES = [
  { sender: 'Lucas', senderInitials: 'LC', senderColor: 'bg-blue-100 text-blue-600', recipient: 'Daniel', value: 'Support', message: 'Thanks for helping me with the onboarding.', fire: 1, clap: 2, time: '10:24 AM' },
  { sender: 'James', senderInitials: 'JM', senderColor: 'bg-green-100 text-green-600', recipient: 'Grace', value: 'Excellence', message: 'Customer feedback has been amazing.', fire: 3, clap: 1, time: '10:31 AM' },
  { sender: 'Mike', senderInitials: 'MK', senderColor: 'bg-orange-100 text-orange-600', recipient: 'Jessica', value: 'Innovation', message: 'Love the new design concepts.', fire: 3, clap: 5, time: '11:02 AM' },
  { sender: 'David', senderInitials: 'DV', senderColor: 'bg-purple-100 text-purple-600', recipient: 'Emily', value: 'Leadership', message: 'Thanks for leading the sprint planning.', fire: 4, clap: 2, time: '11:15 AM' },
  { sender: 'Emma', senderInitials: 'EM', senderColor: 'bg-pink-100 text-pink-600', recipient: 'Chris', value: 'Dedication', message: 'Staying late to fix that bug was heroic.', fire: 5, clap: 3, time: '11:42 AM' },
  { sender: 'Nour', senderInitials: 'NR', senderColor: 'bg-teal-100 text-teal-600', recipient: 'Sophie', value: 'Creativity', message: 'The new ad copy is brilliant!', fire: 2, clap: 4, time: '12:08 PM' },
];

// Duplicate for seamless loop
const DOUBLED_ENTRIES = [...RECOGNITION_ENTRIES, ...RECOGNITION_ENTRIES];

function RecognitionEntry({ entry }: { entry: typeof RECOGNITION_ENTRIES[0] }) {
  return (
    <div className="px-4 py-3 hover:bg-gray-50/50 transition-colors">
      <div className="flex gap-2.5">
        <div className={`w-9 h-9 rounded-lg ${entry.senderColor} flex items-center justify-center text-xs font-bold shrink-0 mt-0.5`}>
          {entry.senderInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-sm" style={{ color: '#0F0D33' }}>{entry.sender}</span>
            <span className="text-[11px] text-gray-400">{entry.time}</span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: '#0F0D33' }}>
            Recognized{' '}
            <span className="font-medium" style={{ color: '#5e2ca5' }}>@{entry.recipient}</span>
            {' '}for{' '}
            <span className="font-medium" style={{ color: '#5e2ca5' }}>#{entry.value}</span>
          </p>
          <div className="mt-1.5 pl-3 border-l-[3px] border-gray-200">
            <p className="text-sm italic text-gray-500">"{entry.message}"</p>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs">
              🔥 <span className="text-gray-600">{entry.fire}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs">
              👏 <span className="text-gray-600">{entry.clap}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const SlackFeedSection = () => {
  const singleSetHeight = RECOGNITION_ENTRIES.length * 152; // approx height per entry

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left column — Slack channel mock */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center lg:justify-start"
          >
            <div className="w-full max-w-[576px] rounded-[24px] p-8" style={{ backgroundColor: '#F9FAFB' }}>
            <div className="w-full max-w-[420px] mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Slack header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100" style={{ backgroundColor: '#350D36' }}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white"># recognition</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-white/70">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span>42</span>
                </div>
              </div>

              {/* Scrolling feed */}
              <div className="h-[400px] overflow-hidden relative">
                {/* Fade overlays */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

                <div
                  className="animate-slack-scroll"
                  style={{
                    animationDuration: `${RECOGNITION_ENTRIES.length * 5}s`,
                  }}
                >
                  {DOUBLED_ENTRIES.map((entry, i) => (
                    <RecognitionEntry key={`${entry.sender}-${i}`} entry={entry} />
                  ))}
                </div>
              </div>

              {/* Input bar */}
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/50">
                  <span className="text-sm text-gray-400">Message #recognition</span>
                </div>
              </div>
            </div>
            </div>
          </motion.div>

          {/* Right column — Text + badges */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="font-[Poppins] text-3xl md:text-4xl lg:text-[44px] font-semibold leading-[1.3] mb-6" style={{ color: '#0F0D33' }}>
              Celebrations that show up right in Slack and Teams
            </h2>
            <p className="text-lg md:text-xl leading-relaxed mb-8" style={{ color: 'rgba(15, 13, 51, 0.7)' }}>
              When someone gets recognized in Grattia, it shows up directly in your Slack or Microsoft Teams channels. The whole team can celebrate together, right where conversations already happen.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-gray-200 bg-white shadow-sm">
                <img src={slackLogo} alt="Slack" className="w-5 h-5 object-contain" />
                <span className="text-sm font-medium" style={{ color: '#0F0D33' }}>Slack</span>
              </div>
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-gray-200 bg-white shadow-sm">
                <img src={teamsLogo} alt="Microsoft Teams" className="w-5 h-5 object-contain" />
                <span className="text-sm font-medium" style={{ color: '#0F0D33' }}>Microsoft Teams</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SlackFeedSection;
