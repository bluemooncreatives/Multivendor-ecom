"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/lib/hooks/useCart";
import { useCheckout, useValidateCoupon, type InlineAddress, type CheckoutInput } from "@/lib/hooks/useCheckout";
import { useCreateGatewaySession, useCreatePayhereSession, submitAutoForm, type RedirectGateway } from "@/lib/hooks/useExtraGateways";
import { formatPrice } from "@/lib/format";
import { CheckoutSteps } from "@/components/storefront/checkout-steps";

type Step = "address" | "payment" | "review";

const PAYMENT_METHODS: { value: CheckoutInput["paymentMethod"]; label: string }[] = [
  { value: "cod", label: "Cash on delivery" },
  { value: "wallet", label: "Wallet" },
  { value: "manual", label: "Manual / bank transfer" },
  { value: "stripe", label: "Card (Stripe)" },
  { value: "razorpay", label: "Razorpay" },
  { value: "paypal", label: "PayPal" },
  { value: "sslcommerz", label: "SSLCommerz" },
  { value: "instamojo", label: "Instamojo" },
  { value: "paystack", label: "PayStack" },
  { value: "voguepay", label: "VoguePay" },
  { value: "payhere", label: "Payhere" },
  { value: "ngenius", label: "N-Genius" },
];

const REDIRECT_GATEWAYS: RedirectGateway[] = ["sslcommerz", "instamojo", "paystack", "voguepay", "ngenius"];

// Synchronously-settled methods (COD/Wallet/Manual) finish right here. The
// redirect-based regional gateways create a session against the just-created
// order and hand the browser off to that gateway's hosted payment page — the
// gateway's own callback settles the order server-side once payment completes.
// Stripe/Razorpay/PayPal's hosted-widget (Elements / Checkout.js / Buttons SDK)
// integration remains the acknowledged next increment on top of this flow.
export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const router = useRouter();
  const { data: cart } = useCart();
  const checkout = useCheckout();
  const validateCoupon = useValidateCoupon();
  const createSslcommerzSession = useCreateGatewaySession("sslcommerz");
  const createInstamojoSession = useCreateGatewaySession("instamojo");
  const createPaystackSession = useCreateGatewaySession("paystack");
  const createVoguePaySession = useCreateGatewaySession("voguepay");
  const createNgeniusSession = useCreateGatewaySession("ngenius");
  const createPayhereSession = useCreatePayhereSession();

  const redirectSessionByGateway: Record<RedirectGateway, typeof createSslcommerzSession> = {
    sslcommerz: createSslcommerzSession,
    instamojo: createInstamojoSession,
    paystack: createPaystackSession,
    voguepay: createVoguePaySession,
    ngenius: createNgeniusSession,
  };

  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState<InlineAddress>({
    line1: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<CheckoutInput["paymentMethod"]>("cod");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  const subtotal = cart?.subtotal ?? 0;
  const total = Math.max(0, subtotal - discount);

  async function handleApplyCoupon() {
    if (!couponCode) return;
    try {
      const result = await validateCoupon.mutateAsync({ code: couponCode, orderSubtotal: subtotal });
      setDiscount(result.discount);
      toast.success(`Coupon applied: -${formatPrice(result.discount, cart?.items[0]?.currency)}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Invalid coupon");
      setDiscount(0);
    }
  }

  async function handlePlaceOrder() {
    try {
      const order = await checkout.mutateAsync({
        address,
        paymentMethod,
        couponCode: discount > 0 ? couponCode : undefined,
        idempotencyKey,
      });

      if (paymentMethod === "payhere") {
        const session = await createPayhereSession.mutateAsync(order.id);
        submitAutoForm(session.actionUrl, session.fields);
        return;
      }

      if ((REDIRECT_GATEWAYS as string[]).includes(paymentMethod)) {
        const session = await redirectSessionByGateway[paymentMethod as RedirectGateway].mutateAsync(order.id);
        window.location.href = session.redirectUrl;
        return;
      }

      router.push(`/${locale}/checkout/order-confirmed?code=${order.code}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not place order");
    }
  }

  if (!cart || cart.items.length === 0) {
    return <div className="container py-16 text-center text-muted-foreground">Your cart is empty.</div>;
  }

  const stepNumber = step === "address" ? 2 : step === "payment" ? 3 : 4;

  return (
    <div className="container max-w-xl space-y-6 py-6">
      <CheckoutSteps current={stepNumber} />
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {step === "address" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("address")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Address line 1</Label>
                <Input value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Postal code</Label>
                  <Input
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} required />
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={() => setStep("payment")}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "payment" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("payment")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <label key={method.value} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value)}
                  />
                  {method.label}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("address")}>
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep("review")}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "review" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("review")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm">
              {cart.items.map((item) => (
                <div key={`${item.productId}-${item.variantSku}`} className="flex justify-between">
                  <span>
                    {item.productName} × {item.quantity}
                  </span>
                  <span>{formatPrice(item.lineTotal, item.currency)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
              <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={validateCoupon.isPending}>
                Apply
              </Button>
            </div>

            <div className="space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal, cart.items[0]?.currency)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(discount, cart.items[0]?.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(total, cart.items[0]?.currency)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("payment")}>
                Back
              </Button>
              <Button className="flex-1" onClick={handlePlaceOrder} disabled={checkout.isPending}>
                {t("placeOrder")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
