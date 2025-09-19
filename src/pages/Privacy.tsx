import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-[#0F0533] text-white">
      <Navbar />
      <main className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <h1 className="text-4xl font-bold text-center mb-4">Grattia Privacy Policy</h1>
          <p className="text-center text-gray-300 mb-12">Effective Date: 8/1/2025</p>
          
          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">Our Commitment to Privacy</h2>
              <p className="mb-4">
                Grattia ("Grattia," "we," "us," or "our") respects the privacy of our users ("you" or "your"). This Privacy Policy describes the types of information we collect, how we use it, and your rights under applicable U.S. privacy laws. This Policy applies to users who access our website (www.grattia.com) and the Grattia platform (collectively, the "Service").
              </p>
              <p className="mb-4">
                The Service is provided to employees of companies ("Employers") that have subscribed to Grattia. In many cases, your Employer provides us with your account information and controls certain aspects of your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">Information We Collect</h2>
              <p className="mb-4">We collect the following categories of information:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Identifiers:</strong> Name, email address, Employer information, and login credentials.</li>
                <li><strong>Account Information:</strong> Recognition activity (points awarded, received, redeemed), account settings, and preferences.</li>
                <li><strong>Payment Information:</strong> If applicable, purchases and redemptions. Payment card details are collected and processed directly by Stripe and are not stored by us.</li>
                <li><strong>Device and Usage Data:</strong> IP address, browser type, device information, log files, and cookies to support security, analytics, and performance.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">How We Use Your Information</h2>
              <p className="mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Provide and operate the Service, including recognition and reward functionality.</li>
                <li>Manage your account and authenticate logins.</li>
                <li>Process redemptions and other transactions (facilitated by Stripe or reward vendors).</li>
                <li>Communicate important information about your account and Service updates.</li>
                <li>Improve, monitor, and secure the Service.</li>
                <li>Comply with legal obligations.</li>
              </ul>
              <p className="mb-4">We do not sell your personal information.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">Sharing Your Information</h2>
              <p className="mb-4">We may share your information only in the following circumstances:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>With Service Providers:</strong> Such as hosting providers, payment processors (Stripe), analytics services, email delivery platforms, and reward fulfillment partners. These providers process data only on our behalf and under contractual obligations.</li>
                <li><strong>With Employers:</strong> Your Employer may access information about your use of the Service for program management.</li>
                <li><strong>For Legal Compliance:</strong> When required to comply with laws, regulations, or valid legal requests.</li>
              </ul>
              <p className="mb-4">We do not share your information with third parties for their own independent marketing purposes.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">Data Retention</h2>
              <p className="mb-4">
                We retain your personal information for as long as your Employer's subscription is active and for a reasonable period thereafter (generally up to 12 months), unless a longer retention period is required by law or necessary to resolve disputes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">Your Privacy Rights</h2>
              <p className="mb-4">
                Depending on your state of residence (e.g., California, Virginia, Colorado, Connecticut, Utah), you may have rights to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Request access to the personal information we hold about you.</li>
                <li>Request deletion of your personal information.</li>
                <li>Request correction of inaccurate information.</li>
                <li>Request information about how we use and share your data.</li>
                <li>Opt out of the sale or sharing of personal information (note: we do not sell personal information).</li>
              </ul>
              <p className="mb-4">
                You can exercise these rights by contacting us at <strong>hello@grattia.com</strong>. We may need to verify your identity before processing requests.
              </p>
              <p className="mb-4">
                If you are an employee user, some requests (such as deletion of your account) may need to be directed to your Employer first.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">Security</h2>
              <p className="mb-4">
                We take reasonable steps to protect the information you provide from loss, misuse, unauthorized access, disclosure, alteration, or destruction. Protections include:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Encrypted transmission (HTTPS)</li>
                <li>Encryption of data at rest</li>
                <li>Access controls and monitoring</li>
                <li>Use of PCI-compliant processors (Stripe) for payment transactions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">Children's Privacy</h2>
              <p className="mb-4">
                The Service is not intended for individuals under 18. We do not knowingly collect information from children.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">Changes to this Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. If we make material changes, we will notify you (for example, via email or through the Service). Please review this Policy periodically.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy or your rights, please contact us at:
              </p>
              <p className="mb-4">
                <strong>hello@grattia.com</strong>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;