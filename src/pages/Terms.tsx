import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0F0533' }}>
      <Navbar />
      
      {/* Main content */}
      <div className="py-20 px-4 sm:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-lg prose-invert max-w-none">
            <h1 className="text-4xl font-bold text-center mb-8">Grattia Terms of Service</h1>
            <p className="text-center text-gray-300 mb-12"><strong>Effective Date:</strong> 8/1/2025</p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">1. Introduction</h2>
              <p className="mb-4">
                Welcome to Grattia ("Grattia," "we," "us," or "our"). These Terms of Service ("Terms") govern your access to and use of the Grattia website, platform, and related services (collectively, the "Service").
              </p>
              <p>
                Grattia contracts directly with subscribing companies ("Employers") to provide the Service. Employees of those Employers ("Users" or "you") are granted access under their Employer's subscription. These Terms apply to Users' use of the Service. The Employer's subscription agreement governs the commercial relationship between Grattia and the Employer.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">2. Acceptance of Terms</h2>
              <p>
                By accessing or using the Service, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, you are not authorized to use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">3. Eligibility</h2>
              <p>
                The Service is intended for employees of subscribed Employers. You may only use the Service if you are at least 18 years old and have the legal capacity to enter into a binding agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">4. User Accounts</h2>
              <p>
                Employer-created accounts are provisioned to their employees. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Notify Grattia immediately of any unauthorized access or use. Employers remain responsible for managing and disabling accounts when employment ends.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">5. Use of the Service</h2>
              <p className="mb-4">
                The Service is provided for the purpose of enabling employees to participate in recognition and rewards programs offered by their Employer through Grattia, including earning and redeeming points for gift cards or other rewards.
              </p>
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service for any illegal, fraudulent, or unauthorized purpose</li>
                <li>Violate applicable laws or regulations</li>
                <li>Infringe intellectual property rights</li>
                <li>Transmit harmful, abusive, or unlawful content</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Attempt to gain unauthorized access to any systems</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">6. Third-Party Services</h2>
              <p>
                The Service may integrate with or provide access to third-party vendors (e.g., gift card issuers, merchants, service providers). Grattia does not control and is not responsible for the content, products, or services of third parties. Your interactions with third-party vendors are solely between you and those vendors.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">7. Intellectual Property</h2>
              <p>
                The Service, including all content, software, and trademarks, is owned by Grattia or its licensors. Except as expressly permitted, you may not copy, modify, distribute, or create derivative works of any portion of the Service without Grattia's prior written consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">8. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Grattia, its affiliates, and their officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, or expenses (including legal fees) arising out of or related to: (a) your use of the Service in violation of these Terms, or (b) your violation of any applicable law or rights of any third party.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">9. Disclaimers</h2>
              <p>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." GRATTIA DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. GRATTIA DOES NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE, SECURE, OR UNINTERRUPTED, OR THAT REWARDS OR THIRD-PARTY OFFERS WILL BE AVAILABLE OR FUNCTION AS DESCRIBED.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">10. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, GRATTIA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, EVEN IF GRATTIA HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. GRATTIA'S TOTAL LIABILITY TO YOU FOR ALL CLAIMS RELATING TO THE SERVICE SHALL NOT EXCEED ONE HUNDRED U.S. DOLLARS ($100).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">11. Termination</h2>
              <p>
                Grattia may suspend or terminate your access to the Service at any time, with or without cause or notice, including when your Employer's subscription ends. You may stop using the Service at any time. Provisions concerning intellectual property, disclaimers, limitation of liability, indemnification, and dispute resolution will survive termination.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">12. Governing Law</h2>
              <p>
                These Terms are governed by the laws of the State of North Carolina, without regard to conflict of law rules.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">13. Dispute Resolution</h2>
              <p>
                Any dispute arising out of or relating to these Terms or the Service shall be resolved by binding arbitration under the rules of the American Arbitration Association ("AAA"). Arbitration shall take place in Charlotte, North Carolina, unless otherwise agreed in writing. The arbitrator's decision shall be final and binding.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">14. Amendments</h2>
              <p>
                Grattia may update these Terms from time to time. For material changes, we will provide notice (e.g., via the Service or email). Your continued use of the Service after the effective date of the updated Terms constitutes your acceptance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-grattia-accent">15. Miscellaneous</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Entire Agreement.</strong> These Terms and our Privacy Policy constitute the entire agreement regarding use of the Service.</li>
                <li><strong>Severability.</strong> If any provision is found unenforceable, the remaining provisions remain in effect.</li>
                <li><strong>No Waiver.</strong> Failure to enforce any provision shall not be deemed a waiver.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Terms;