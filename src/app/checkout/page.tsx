import { CheckoutForm } from "@/components/checkout-form";
import { CheckoutSummary } from "@/components/checkout-summary";
import { getSession } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { SettingModel } from "@/models";

function enabled(value: unknown): boolean { return value === true || String(value) === "1"; }

export default async function CheckoutPage() {
  const user = await getSession();
  await connectMongo();
  const settings = Object.fromEntries((await SettingModel.find({ key: { $in: ["business.wallet_system", "business.coupon_system"] } }).select("key value").lean()).map((setting) => [setting.key, setting.value]));
  return <main className="page-shell"><div className="page-heading"><div><span className="eyebrow">Secure checkout</span><h1>Complete your order</h1><p>Review your delivery and payment details.</p></div></div><div className="checkout-grid"><CheckoutForm defaultName={user?.name} defaultEmail={user?.email} walletEnabled={enabled(settings["business.wallet_system"])} couponsEnabled={enabled(settings["business.coupon_system"])}/><CheckoutSummary/></div></main>;
}
