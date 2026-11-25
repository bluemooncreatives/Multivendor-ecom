"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { ShoppingBag, Truck, CreditCard, MapPin, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { NativeSelect } from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormField } from "@/components/shared/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useCart } from "@/lib/hooks/useCart";
import {
  useCheckout,
  useCheckoutOptions,
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
import { getApiErrorMessage } from "@/lib/utils";

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
  "stripe",
];

const FORM_POST_GATEWAYS: FormPostGateway[] = ["payhere", "paytm", "twocheckout"];
const SYNCHRONOUS_METHODS = ["cod", "wallet", "manual"];

type DeliveryChoice = { method: "home_delivery" | "pickup_point"; pickupPointId?: string };

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const router = useRouter();
  const { data: cart } = useCart();
  const isSignedIn = useAuthStore((s) => Boolean(s.accessToken));

  const checkout = useCheckout();
  const { data: options } = useCheckoutOptions();
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
  useEffect(() => {
    if (options?.paymentMethods.length && !options.paymentMethods.includes(paymentMethod)) {
      setPaymentMethod(options.paymentMethods[0]!);
    }
  }, [options, paymentMethod]);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [pointsToSpend, setPointsToSpend] = useState(0);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  const sellerGroups = useMemo(() => {
    const groups = new Map<
      string,
      { sellerId: string; sellerName: string; items: NonNullable<typeof cart>["items"] }
    >();
    for (const item of cart?.items ?? []) {
      const existing = groups.get(item.sellerId);
      if (existing) existing.items.push(item);
      else groups.set(item.sellerId, { sellerId: item.sellerId, sellerName: item.sellerName, items: [item] });
    }
    return [...groups.values()];
  }, [cart]);

  const subtotal = cart?.subtotal ?? 0;
  const currency = cart?.items[0]?.currency;
  const pointsDiscount = clubPoints && pointsToSpend > 0 ? pointsToSpend * clubPoints.convertRate : 0;
  const estimatedTotal = Math.max(0, subtotal - discount - pointsDiscount);

  async function handleApplyCoupon() {
    if (!couponCode) return;
    try {
      const result = await validateCoupon.mutateAsync({ code: couponCode, orderSubtotal: subtotal });
      setDiscount(result.discount);
      toast.success(`Coupon applied: -${formatPrice(result.discount, currency)}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Invalid coupon"));
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

      if (!SYNCHRONOUS_METHODS.includes(paymentMethod)) {
        toast.error("That payment method could not be started. Your order has not been charged.");
        return;
      }

      router.push(`/${locale}/checkout/order-confirmed?code=${order.code}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not place order"));
    }
  }

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
      handler: () => router.push(`/${locale}/checkout/order-confirmed?code=${order.code}`),
      modal: {
        ondismiss: () => toast.error("Payment cancelled — your order has not been charged."),
      },
    }).open();
  }

  async function payWithPaypal(order: { id: string; code: string }) {
    const { paypalOrderId } = await createPaypalOrder.mutateAsync(order.id);
    const approvalUrl = `https://www.paypal.com/checkoutnow?token=${paypalOrderId}`;

    const popup = window.open(approvalUrl, "paypal", "width=500,height=650");
    if (!popup) {
      toast.error("Allow pop-ups to pay with PayPal. Your order has not been charged.");
      return;
    }

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
    return (
      <div className="container max-w-xl py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add products to your cart before starting checkout."
          action={
            <Button asChild>
              <Link href={`/${locale}/products`}>Browse products</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const stepNumber = step === "address" ? 2 : step === "delivery" ? 3 : step === "payment" ? 4 : 5;

  return (
    <div className="container max-w-2xl space-y-6 py-6 lg:py-8">
      <CheckoutSteps current={stepNumber} />
      <PageHeader title={t("title")} />

      {step === "address" && (
        <Card>
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              {t("address")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Address line 1" htmlFor="checkout-line1" required className="sm:col-span-2">
                <Input
                  id="checkout-line1"
                  value={address.line1}
                  onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="City" htmlFor="checkout-city" required>
                <Input
                  id="checkout-city"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="State" htmlFor="checkout-state" required>
                <Input
                  id="checkout-state"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Postal code" htmlFor="checkout-postal-code" required>
                <Input
                  id="checkout-postal-code"
                  value={address.postalCode}
                  onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Phone" htmlFor="checkout-phone" required>
                <Input
                  id="checkout-phone"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  required
                />
              </FormField>
            </div>
            <Button className="w-full" onClick={() => setStep("delivery")}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "delivery" && (
        <Card>
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4 text-primary" />
              Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-muted-foreground">
              Your order ships from {sellerGroups.length} seller{sellerGroups.length === 1 ? "" : "s"}. Choose how each
              one reaches you.
            </p>

            {sellerGroups.map((group) => {
              const choice = deliveryChoices[group.sellerId] ?? { method: "home_delivery" as const };
              return (
                <div key={group.sellerId} className="space-y-3 rounded-lg border bg-muted/10 p-4">
                  <div>
                    <p className="text-sm font-semibold">{group.sellerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.items.map((i) => `${i.productName} × ${i.quantity}`).join(", ")}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        className="accent-primary"
                        name={`delivery-${group.sellerId}`}
                        checked={choice.method === "home_delivery"}
                        onChange={() =>
                          setDeliveryChoices({ ...deliveryChoices, [group.sellerId]: { method: "home_delivery" } })
                        }
                      />
                      Home delivery
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        className="accent-primary"
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
                    <NativeSelect
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
                    </NativeSelect>
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
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-primary" />
              {t("payment")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <RadioGroup
              value={paymentMethod}
              onValueChange={(val) => setPaymentMethod(val as CheckoutInput["paymentMethod"])}
              className="space-y-2"
            >
              {PAYMENT_METHODS.filter((method) => options?.paymentMethods.includes(method.value)).map((method) => (
                <Label
                  key={method.value}
                  htmlFor={`pay-${method.value}`}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 text-sm transition-colors hover:bg-accent/50 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
                >
                  <RadioGroupItem value={method.value} id={`pay-${method.value}`} />
                  <span className="font-medium">{method.label}</span>
                </Label>
              ))}
            </RadioGroup>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("delivery")}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={() => setStep("review")}
                disabled={!options?.paymentMethods.includes(paymentMethod)}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "review" && (
        <Card>
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              {t("review")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2 rounded-lg border bg-muted/20 p-3.5 text-sm">
              {cart.items.map((item) => (
                <div key={`${item.productId}-${item.variantSku}`} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">
                    {item.productName} × {item.quantity}
                  </span>
                  <span className="font-medium">{formatPrice(item.lineTotal, item.currency)}</span>
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
              <FormField
                label={`Redeem club points (you have ${clubPoints.points})`}
                htmlFor="club-points"
                hint={`Minimum ${clubPoints.minConvertPoints} points. Worth ${formatPrice(pointsDiscount, currency)}.`}
              >
                <Input
                  id="club-points"
                  type="number"
                  min={0}
                  max={clubPoints.points}
                  value={pointsToSpend}
                  onChange={(e) => setPointsToSpend(Math.min(clubPoints.points, Math.max(0, Number(e.target.value))))}
                />
              </FormField>
            )}

            <Separator />

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal, currency)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon</span>
                  <span>-{formatPrice(discount, currency)}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Club points</span>
                  <span>-{formatPrice(pointsDiscount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 text-lg font-bold">
                <span>Estimated total</span>
                <span className="text-primary">{formatPrice(estimatedTotal, currency)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Tax and shipping are calculated when you place the order.</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("payment")}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handlePlaceOrder}
                disabled={checkout.isPending || !options?.paymentMethods.includes(paymentMethod)}
              >
                {t("placeOrder")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
