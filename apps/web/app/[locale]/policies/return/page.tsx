import { PolicyPage } from "@/components/storefront/policy-page";

export const dynamic = "force-dynamic";

export default function ReturnPolicyPage() {
  return <PolicyPage type="return" title="Return Policy" />;
}
