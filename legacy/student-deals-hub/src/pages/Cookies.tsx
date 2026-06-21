import LegalPage, { LegalSection } from "@/components/legal/LegalPage";
import { Button } from "@/components/ui/button";
import { openCookiePreferences } from "@/components/cookies/cookieConsent";

const Cookies = () => {
  return (
    <LegalPage
      title="Cookie Policy"
      updatedOn="April 29, 2026"
      intro="This Cookie Policy explains how Unidealz uses cookies and similar technologies to recognize you when you visit our Platform, what they do, and how you can manage your preferences."
    >
      <LegalSection title="1. What Are Cookies?">
        <p>
          Cookies are small text files placed on your device by websites you
          visit. They are widely used to make websites work efficiently, to
          remember your preferences, and to provide reporting information to
          site owners. Similar technologies include local storage and pixel
          tags.
        </p>
      </LegalSection>

      <LegalSection title="2. Categories of Cookies We Use">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Essential Cookies</h3>
            <p>
              Required for the Platform to function properly. They enable
              authentication, session management, security, and storing your
              cookie preferences. These cannot be turned off.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Analytics Cookies</h3>
            <p>
              Help us understand how visitors interact with the Platform so we
              can improve it. These collect information in aggregated, mostly
              anonymous form.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Functional Cookies</h3>
            <p>
              Remember choices you make (such as language or saved offers) to
              provide a more personalized experience.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Marketing Cookies</h3>
            <p>
              Used to measure the performance of marketing campaigns and, where
              enabled in the future, to show you more relevant content. These
              are off by default.
            </p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="3. Managing Your Preferences">
        <p>
          You can change your cookie preferences at any time. Essential cookies
          will always remain active. Disabling other categories may affect
          certain features of the Platform.
        </p>
        <div className="pt-2">
          <Button onClick={openCookiePreferences} variant="outline">
            Manage cookie preferences
          </Button>
        </div>
      </LegalSection>

      <LegalSection title="4. Browser Controls">
        <p>
          Most browsers also let you block or delete cookies through their
          settings. Please consult your browser's help section for instructions.
          Note that blocking essential cookies may prevent the Platform from
          working as intended.
        </p>
      </LegalSection>

      <LegalSection title="5. Updates">
        <p>
          We may update this Cookie Policy as our use of cookies evolves. Any
          changes will be reflected on this page with a new "Last updated"
          date.
        </p>
      </LegalSection>
    </LegalPage>
  );
};

export default Cookies;
