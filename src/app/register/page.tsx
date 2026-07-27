import { AuthForm } from "@/components/auth-form";
import { connectMongo } from "@/lib/mongodb";
import { SettingModel } from "@/models";

export default async function Register(){
  const providers: ("google" | "facebook")[] = [];
  try {
    await connectMongo();
    const settings = Object.fromEntries((await SettingModel.find({ key: { $in: ["business.google_login", "business.facebook_login"] } }).select("key value").lean()).map((setting) => [setting.key, String(setting.value) === "1"]));
    if (settings["business.google_login"] && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) providers.push("google");
    if (settings["business.facebook_login"] && process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) providers.push("facebook");
  } catch {}
  return <main className="auth-shell"><AuthForm mode="register" socialProviders={providers}/></main>;
}
