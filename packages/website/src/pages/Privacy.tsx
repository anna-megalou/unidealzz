import LegalPage, { LegalSection } from "@/components/legal/LegalPage";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <LegalPage
      title="Privacy Policy"
      updatedOn="April 29, 2026"
      intro="Your privacy matters to us. This Privacy Policy explains what personal data Unidealz collects, why we collect it, how we use it, and the rights you have under applicable data-protection laws, including the EU General Data Protection Regulation (GDPR)."
    >
      <LegalSection title="1. Data We Collect">
        <p>We collect the following categories of personal data:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li><strong>Account data:</strong> name, email address, password (hashed), and profile preferences.</li>
          <li><strong>Verification data:</strong> academic email, student ID documents, and institution name when you complete student verification.</li>
          <li><strong>Usage data:</strong> pages visited, offers viewed and claimed, device type, and approximate location derived from your IP address.</li>
          <li><strong>Communications:</strong> messages you send us via support or contact forms.</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. How We Use Personal Data">
        <p>We process your data to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Provide and operate the Platform and its core features.</li>
          <li>Verify your student status and prevent fraud or misuse of discounts.</li>
          <li>Send transactional emails (verification, password reset, account notifications).</li>
          <li>Improve our service through aggregated analytics.</li>
          <li>Comply with legal obligations.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Student Verification Data">
        <p>
          Documents and academic identifiers submitted for student verification
          are used only to confirm eligibility. We retain proof of verification
          for the duration of your account, plus a limited period required for
          audit and anti-fraud purposes. We never sell verification documents.
        </p>
      </LegalSection>

      <LegalSection title="4. Account and Login Information">
        <p>
          Your password is stored using strong one-way hashing. If you sign in
          via a third-party identity provider (such as Google), we receive only
          the basic profile information you authorize.
        </p>
      </LegalSection>

      <LegalSection title="5. Analytics and Cookies">
        <p>
          We use cookies and similar technologies to operate the Platform,
          remember your preferences, and understand how it is used. You can
          control non-essential cookies at any time. For details, see our{" "}
          <Link to="/cookies" className="text-primary hover:underline">
            Cookie Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="6. Data Sharing with Service Providers">
        <p>
          We share personal data with trusted service providers who help us run
          the Platform, including hosting, authentication, email delivery, and
          analytics. These providers act as data processors under contractual
          obligations to protect your data and use it only on our instructions.
        </p>
        <p>
          We do not sell your personal data. We may share limited, aggregated
          information with partner brands to help them understand discount
          performance, but never in a way that identifies you personally.
        </p>
      </LegalSection>

      <LegalSection title="7. Data Retention">
        <p>
          We retain your personal data for as long as your account is active
          and for a reasonable period afterwards to comply with legal,
          accounting, or reporting requirements. You may request deletion at
          any time, subject to those obligations.
        </p>
      </LegalSection>

      <LegalSection title="8. Your Rights">
        <p>Under GDPR and similar laws you have the right to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Access the personal data we hold about you.</li>
          <li>Rectify inaccurate or incomplete data.</li>
          <li>Request deletion of your data ("right to be forgotten").</li>
          <li>Restrict or object to certain processing.</li>
          <li>Receive your data in a portable format.</li>
          <li>Lodge a complaint with your local data-protection authority.</li>
        </ul>
        <p>
          To exercise these rights, email us at{" "}
          <a href="mailto:privacy@unidealz.gr" className="text-primary hover:underline">
            privacy@unidealz.gr
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="9. Security">
        <p>
          We use industry-standard security measures, including TLS encryption
          in transit, encrypted storage, role-based access controls, and
          regular security reviews. No system is perfectly secure, so we
          encourage you to use a unique password and to report any suspicious
          activity immediately.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          For privacy-related questions or to exercise your rights, contact our
          team at{" "}
          <a href="mailto:privacy@unidealz.gr" className="text-primary hover:underline">
            privacy@unidealz.gr
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
};

export default Privacy;
