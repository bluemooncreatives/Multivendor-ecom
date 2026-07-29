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
import {
  useCheckout,
  useValidateCoupon,
  usePickupPoints,
  useClubPointBalance,
  type InlineAddress,
  type CheckoutInput,
} from "@/lib/hooks/useCheckout";
import {
  useCreateGatewaySession,
  useCreateFormPostSession,
  useCreateRazorpayOrder,
  useCreateMpesaPush,
  useCreatePaypalOrder,
  useCapturePaypalOrder,
  submitAutoForm,
  loadScript,
  type RedirectGateway,
  type FormPostGateway,
} from "@/lib/hooks/useExtraGateways";
import { useAuthStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { CheckoutSteps } from "@/components/storefront/checkout-steps";

// Four steps, matching the legacy shipping-info -> delivery-info -> payment ->
// confirm flow. The delivery step is where the shopper picks home delivery or
// in-person collection per seller, which decides that seller's shipping cost.
type Step = "address" | "delivery" | "payment" | "review";

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
  { value: "paytm", label: "Paytm" },
  { value: "mpesa", label: "M-Pesa" },
  { value: "flutterwave", label: "Flutterwave" },
  { value: "twocheckout", label: "2Checkout" },
];

const REDIRECT_GATEWAYS: RedirectGateway[] = [
  "sslcommerz",
  "instamojo",
  "paystack",
  "voguepay",
  "ngenius",
  "flutterwave",
  // Stripe uses a hosted Checkout Session, so it redirects like the others.
  "stripe",
];

const FORM_POST_GATEWAYS: FormPostGateway[] = ["payhere", "paytm", "twocheckout"];

// Settled at order-creation time, with no gateway round trip.
const SYNCHRONOUS_METHODS = ["cod", "wallet", "manual"];

type DeliveryChoice = { method: "home_delivery" | "pickup_point"; pickupPointId?: string };

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const router = useRouter();
  const { data: cart } = useCart();
  const isSignedIn = useAuthStore((s) => Boolean(s.accessToken));

  const checkout = useCheckout();
  const validateCoupon = useValidateCoupon();
  const { data: pickupPoints } = usePickupPoints();
  const { data: clubPoints } = useClubPointBalance(isSignedIn);

  const createSslcommerzSession = useCreateGatewaySession("sslcommerz");
  const createInstamojoSession = useCreateGatewaySession("instamojo");
  const createPaystackSession = useCreateGatewaySession("paystack");
  const createVoguePaySession = useCreateGatewaySession("voguepay");
  const createNgeniusSession = useCreateGatewaySession("ngenius");
  const createFlutterwaveSession = useCreateGatewaySession("flutterwave");
  const createStripeSession = useCreateGatewaySession("stripe");

  const createPayhereSession = useCreateFormPostSession("payhere");
  const createPaytmSession = useCreateFormPostSession("paytm");
  const createTwoCheckoutSession = useCreateFormPostSession("twocheckout");

  const createRazorpayOrder = useCreateRazorpayOrder();
  const createMpesaPush = useCreateMpesaPush();
  const createPaypalOrder = useCreatePaypalOrder();
  const capturePaypalOrder = useCapturePaypalOrder();

  const redirectSessionByGateway: Record<RedirectGateway, typeof createSslcommerzSession> = {
    sslcommerz: createSslcommerzSession,
    instamojo: createInstamojoSession,
    paystack: createPaystackSession,
    voguepay: createVoguePaySession,
    ngenius: createNgeniusSession,
    flutterwave: createFlutterwaveSession,
    stripe: createStripeSession,
  };

  const formPostByGateway: Record<FormPostGateway, typeof createPayhereSession> = {
    payhere: createPayhereSession,
    paytm: createPaytmSession,
    twocheckout: createTwoCheckoutSession,
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
  const [deliveryChoices, setDeliveryChoices] = useState<Record<string, DeliveryChoice>>({});
  const [paymentMethod, setPaymentMethod] = useState<CheckoutInput["paymentMethod"]>("cod");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [pointsToSpend, setPointsToSpend] = useState(0);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  // One group per seller — each gets its own delivery choice, and each becomes one
  // shipment on the resulting order.
  const sellerGroups = useMemo(() => {
    const groups = new Map<string, { sellerId: string; sellerName: string; items: typeof cart extends undefined ? never : NonNullable<typeof cart>["items"] }>();
    for (const item of cart?.items ?? []) {
      const existing = groups.get(item.sellerId);
      if (existing) existing.items.push(item);
      else groups.set(item.sellerId, { sellerId: item.sellerId, sellerName: item.sellerName, items: [item] });
    }
    return [...groups.values()];
  }, [cart]);

  const subtotal = cart?.subtotal ?? 0;
  const currency = cart?.items[0]?.currency;

  // Indicative only — the server recomputes every figure at order time, so this is
  // a preview and never what the shopper is actually charged.
  const pointsDiscount = clubPoints && pointsToSpend > 0 ? pointsToSpend * clubPoints.convertRate : 0;
  const estimatedTotal = Math.max(0, subtotal - discount - pointsDiscount);

  async function handleApplyCoupon() {
    if (!couponCode) return;
    try {
      const result = await validateCoupon.mutateAsync({ code: couponCode, orderSubtotal: subtotal });
      setDiscount(result.discount);
      toast.success(`Coupon applied: -${formatPrice(result.discount, currency)}`);
    } catch (err) {
      toast.error(apiError(err, "Invalid coupon"));
      setDiscount(0);
    }
  }

  async function handlePlaceOrder() {
    try {
      const order = await checkout.mutateAsync({
        address,
        paymentMethod,
        couponCode: discount > 0 ? couponCode : undefined,
        deliveryChoices,
        clubPoints: pointsToSpend > 0 ? pointsToSpend : undefined,
        idempotencyKey,
      });

      if ((FORM_POST_GATEWAYS as string[]).includes(paymentMethod)) {
        const session = await formPostByGateway[paymentMethod as FormPostGateway].mutateAsync(order.id);
        submitAutoForm(session.actionUrl, session.fields);
        return;
      }

      if ((REDIRECT_GATEWAYS as string[]).includes(paymentMethod)) {
        const session = await redirectSessionByGateway[paymentMethod as RedirectGateway].mutateAsync(order.id);
        window.location.href = session.redirectUrl;
        return;
      }

      if (paymentMethod === "razorpay") {
        await payWithRazorpay(order);
        return;
      }

      if (paymentMethod === "paypal") {
        await payWithPaypal(order);
        return;
      }

      if (paymentMethod === "mpesa") {
        if (!address.phone) return toast.error("A phone number is required for M-Pesa");
        const push = await createMpesaPush.mutateAsync({ orderId: order.id, phone: address.phone });
        toast.success(push.message);
        router.push(`/${locale}/checkout/order-confirmed?code=${order.code}`);
        return;
      }

      // Only COD, wallet and manual reach here — every gateway is dispatched
      // above. Falling through to the confirmation page for a card method is
      // what previously produced confirmed-looking but unpaid orders.
      if (!SYNCHRONOUS_METHODS.includes(paymentMethod)) {
        toast.error("That payment method could not be started. Your order has not been charged.");
        return;
      }

      router.push(`/${locale}/checkout/order-confirmed?code=${order.code}`);
    } catch (err) {
      toast.error(apiError(err, "Could not place order"));
    }
  }

  /** Razorpay Checkout opens over this page rather than redirecting away. */
  async function payWithRazorpay(order: { id: string; code: string }) {
    const rzp = await createRazorpayOrder.mutateAsync(order.id);
    await loadScript("https://checkout.razorpay.com/v1/checkout.js");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Razorpay = (window as any).Razorpay;
    if (!Razorpay) throw new Error("Razorpay could not be loaded");

    new Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      order_id: rzp.razorpayOrderId,
      amount: rzp.amount,
      currency: rzp.currency,
      name: "Order payment",
      prefill: { contact: address.phone },
      // The webhook is what actually settles the order; this callback only moves
      // the shopper along once the modal reports success.
      handler: () => router.push(`/${locale}/checkout/order-confirmed?code=${order.code}`),
      modal: {
        ondismiss: () => toast.error("Payment cancelled — your order has not been charged."),
      },
    }).open();
  }

  /**
   * PayPal's SDK renders its own buttons, which needs a container in the DOM.
   * Rather than restructure the review step around that, the order is created
   * server-side and approved in a popup window opened from this click — which
   * browsers allow because it is still within the user gesture.
   */
  async function payWithPaypal(order: { id: string; code: string }) {
    const { paypalOrderId } = await createPaypalOrder.mutateAsync(order.id);
    const approvalUrl = `https://www.paypal.com/checkoutnow?token=${paypalOrderId}`;

    const popup = window.open(approvalUrl, "paypal", "width=500,height=650");
    if (!popup) {
      toast.error("Allow pop-ups to pay with PayPal. Your order has not been charged.");
      return;
    }

    // Poll for the window closing, then capture. Capture is idempotent server-
    // side, and an abandoned approval simply leaves the order unpaid.
    const timer = setInterval(async () => {
      if (!popup.closed) return;
      clearInterval(timer);
      try {
        await capturePaypalOrder.mutateAsync({ orderId: order.id, paypalOrderId });
        router.push(`/${locale}/checkout/order-confirmed?code=${order.code}`);
      } catch {
        toast.error("PayPal did not confirm the payment. Your order has not been charged.");
      }
    }, 800);
  }

  if (!cart || cart.items.length === 0) {
    return <div className="container py-16 text-center text-muted-foreground">Your cart is empty.</div>;
  }

  // Offset by one: step 1 in the stepper is the cart, which is its own page.
  const stepNumber = step === "address" ? 2 : step === "delivery" ? 3 : step === "payment" ? 4 : 5;

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
            <Button className="w-full" onClick={() => setStep("delivery")}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "delivery" && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your order ships from {sellerGroups.length} seller{sellerGroups.length === 1 ? "" : "s"}. Choose how each
              one reaches you.
            </p>

            {sellerGroups.map((group) => {
              const choice = deliveryChoices[group.sellerId] ?? { method: "home_delivery" as const };
              return (
                <div key={group.sellerId} className="space-y-2 rounded-md border p-3">
                  <p className="text-sm font-medium">{group.sellerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.items.map((i) => `${i.productName} × ${i.quantity}`).join(", ")}
                  </p>

                  <div className="flex flex-wrap gap-3 pt-1 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`delivery-${group.sellerId}`}
                        checked={choice.method === "home_delivery"}
                        onChange={() =>
                          setDeliveryChoices({ ...deliveryChoices, [group.sellerId]: { method: "home_delivery" } })
                        }
                      />
                      Home delivery
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`delivery-${group.sellerId}`}
                        disabled={!pickupPoints || pickupPoints.length === 0}
                        checked={choice.method === "pickup_point"}
                        onChange={() =>
                          setDeliveryChoices({
                            ...deliveryChoices,
                            [group.sellerId]: { method: "pickup_point", pickupPointId: pickupPoints?.[0]?.id },
                          })
                        }
                      />
                      Collect from a pickup point
                    </label>
                  </div>

                  {choice.method === "pickup_point" && (
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={choice.pickupPointId ?? ""}
                      onChange={(e) =>
                        setDeliveryChoices({
                          ...deliveryChoices,
                          [group.sellerId]: { method: "pickup_point", pickupPointId: e.target.value },
                        })
                      }
                    >
                      {(pickupPoints ?? []).map((point) => (
                        <option key={point.id} value={point.id}>
                          {point.name} — {point.address}, {point.city}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("address")}>
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep("payment")}>
                Continue
              </Button>
            </div>
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
              <Button variant="outline" onClick={() => setStep("delivery")}>
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

            {clubPoints && clubPoints.points >= clubPoints.minConvertPoints && (
              <div className="space-y-1">
                <Label htmlFor="club-points">Redeem club points (you have {clubPoints.points})</Label>
                <Input
                  id="club-points"
                  type="number"
                  min={0}
                  max={clubPoints.points}
                  value={pointsToSpend}
                  onChange={(e) => setPointsToSpend(Math.min(clubPoints.points, Math.max(0, Number(e.target.value))))}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum {clubPoints.minConvertPoints} points. Worth {formatPrice(pointsDiscount, currency)}.
                </p>
              </div>
            )}

            <div className="space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal, currency)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon</span>
                  <span>-{formatPrice(discount, currency)}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Club points</span>
                  <span>-{formatPrice(pointsDiscount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold">
                <span>Estimated total</span>
                <span>{formatPrice(estimatedTotal, currency)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Tax and shipping are calculated when you place the order.</p>
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

function apiError(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}
