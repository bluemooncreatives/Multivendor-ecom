import { StaticPage } from "@/components/storefront/static-page";

export default function SellerPolicyPage() {
  return (
    <StaticPage title="Seller Policy">
      <p>
        Sellers must list only genuine products with accurate descriptions, pricing, and stock
        levels. Misrepresenting products or manipulating reviews will result in account suspension.
      </p>
      <p>
        Orders must be fulfilled within the committed processing time. Repeated late fulfillment or
        cancellations may affect your seller rating and withdrawal eligibility.
      </p>
    </StaticPage>
  );
}
