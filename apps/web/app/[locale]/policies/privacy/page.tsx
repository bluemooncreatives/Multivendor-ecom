import { StaticPage } from "@/components/storefront/static-page";

export default function PrivacyPolicyPage() {
  return (
    <StaticPage title="Privacy Policy">
      <p>
        We collect only the information necessary to process orders, manage accounts, and improve
        our services — such as name, email, address, and order history.
      </p>
      <p>
        Your data is never sold to third parties. Payment details are handled directly by our
        payment providers and are not stored on our servers.
      </p>
    </StaticPage>
  );
}
