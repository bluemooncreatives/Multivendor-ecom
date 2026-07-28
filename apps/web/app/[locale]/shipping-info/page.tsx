import { StaticPage } from "@/components/storefront/static-page";

export default function ShippingInfoPage() {
  return (
    <StaticPage title="Shipping Information">
      <p>
        Shipping costs are calculated at checkout based on your delivery address and the items in
        your cart. Some sellers offer free shipping above a minimum order value.
      </p>
      <p>
        Once your order ships, you&apos;ll receive updates on its status, and it will be marked as
        delivered once confirmed by the courier.
      </p>
    </StaticPage>
  );
}
