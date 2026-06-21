import LegalPage, { LegalSection } from "@/components/legal/LegalPage";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <LegalPage
      title="Terms of Service"
      updatedOn="April 29, 2026"
      intro="Welcome to Unidealz. These Terms of Service ('Terms') govern your access to and use of the Unidealz website, mobile experience, and related services (collectively, the 'Platform'). By creating an account or using the Platform, you agree to these Terms."
    >
      <LegalSection title="1. Introduction">
        <p>
          Unidealz is a curated discovery platform that helps verified students
          find exclusive offers and discounts from partner brands. The Platform
          is operated from Greece and intended primarily for students enrolled
          in higher-education institutions in Greece and the European Union.
        </p>
        <p>
          By accessing or using Unidealz, you acknowledge that you have read,
          understood, and agreed to be bound by these Terms and our{" "}
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <p>
          You must be at least 16 years old and a current student of a
          recognized educational institution to create an account. By
          registering, you represent that the information you provide is
          accurate, current, and complete, and that you have the legal capacity
          to enter into these Terms.
        </p>
      </LegalSection>

      <LegalSection title="3. Student Verification">
        <p>
          Access to discounts is conditional on successful student
          verification. We may request academic email addresses, student ID
          documents, or other reasonable proof of enrollment. Submitting false,
          forged, or misleading verification information is a serious breach of
          these Terms and may result in immediate termination of your account
          and reporting to the relevant authorities or institution.
        </p>
      </LegalSection>

      <LegalSection title="4. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Share, resell, or transfer discount codes to non-verified users.</li>
          <li>Use automated tools, scrapers, or bots to access the Platform.</li>
          <li>Attempt to bypass verification, security, or rate-limiting systems.</li>
          <li>Upload unlawful, harmful, defamatory, or infringing content.</li>
          <li>Interfere with the proper functioning of the Platform.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Offers and Discounts Disclaimer">
        <p>
          Offers displayed on Unidealz are provided by independent partner
          brands and are subject to their availability, terms, and conditions.
          We make reasonable efforts to keep listings accurate, but we do not
          guarantee the availability, pricing, quality, or fulfillment of any
          offer. Discounts may be limited in time, quantity, or geography.
        </p>
      </LegalSection>

      <LegalSection title="6. Partner Store Disclaimer">
        <p>
          When you redeem an offer, you transact directly with the partner
          brand. Unidealz is not a party to that transaction and is not
          responsible for the goods, services, customer support, refunds, or
          warranties provided by the partner. Any disputes regarding a purchase
          should be addressed with the partner brand first; we are happy to
          help facilitate where reasonable.
        </p>
      </LegalSection>

      <LegalSection title="7. User-Generated Content">
        <p>
          Certain features (such as community experiences, reviews, or
          comments) allow you to post content. You retain ownership of what you
          post, but grant Unidealz a worldwide, non-exclusive, royalty-free
          license to host, display, and distribute that content within the
          Platform. You are solely responsible for the legality and accuracy of
          what you post, and we may remove content that violates these Terms.
        </p>
      </LegalSection>

      <LegalSection title="8. Account Responsibilities">
        <p>
          You are responsible for maintaining the confidentiality of your login
          credentials and for all activity that occurs under your account.
          Notify us immediately if you suspect unauthorized access. We
          recommend using a strong, unique password.
        </p>
      </LegalSection>

      <LegalSection title="9. Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, Unidealz, its
          affiliates, and its team will not be liable for any indirect,
          incidental, consequential, or special damages arising out of or in
          connection with your use of the Platform, including loss of data,
          loss of profit, or inability to redeem an offer. The Platform is
          provided on an "as is" and "as available" basis.
        </p>
      </LegalSection>

      <LegalSection title="10. Termination and Suspension">
        <p>
          We may suspend or terminate your access to the Platform at any time
          if we reasonably believe you have breached these Terms, misused
          verification, or engaged in fraudulent activity. You may close your
          account at any time from your account settings.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to These Terms">
        <p>
          We may update these Terms from time to time to reflect changes to the
          Platform, our partners, or applicable law. When we make material
          changes, we will notify you through the Platform or via email. The
          updated Terms take effect on the date stated at the top of this page.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>
          For questions about these Terms, please contact us at{" "}
          <a href="mailto:hello@unidealz.gr" className="text-primary hover:underline">
            hello@unidealz.gr
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
};

export default Terms;
