import { PolicyPage } from "@/components/storefront/policy-page";

export const dynamic = "force-dynamic";

export default function SellerPolicyPage() {
  return <PolicyPage type="seller_agreement" title="Seller Policy" />;
}
