import { getDecryptedGroup } from "./settings.service.js";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/errorHandler.js";
import { phoneAuthOptions } from "./otp.service.js";

export async function socialProviderConfig() {
  const config = await getDecryptedGroup("socialLogin");
  const fields = [
    { id: "google", enabled: "googleEnabled", client: "googleClientId", secret: "googleClientSecret", envClient: "GOOGLE_CLIENT_ID", envSecret: "GOOGLE_CLIENT_SECRET" },
    { id: "facebook", enabled: "facebookEnabled", client: "facebookAppId", secret: "facebookAppSecret", envClient: "FACEBOOK_CLIENT_ID", envSecret: "FACEBOOK_CLIENT_SECRET" },
    { id: "twitter", enabled: "twitterEnabled", client: "twitterClientId", secret: "twitterClientSecret", envClient: "TWITTER_CLIENT_ID", envSecret: "TWITTER_CLIENT_SECRET" },
  ] as const;
  return fields.flatMap((provider) => {
    const clientId = String(config[provider.client] || process.env[provider.envClient] || "");
    const clientSecret = String(config[provider.secret] || process.env[provider.envSecret] || "");
    const enabled = config[provider.enabled] ?? Boolean(clientId && clientSecret);
    return enabled && clientId && clientSecret ? [{ id: provider.id, clientId, clientSecret }] : [];
  });
}

export async function publicAuthOptions() {
  const providers = await socialProviderConfig();
  const config = await getDecryptedGroup("recaptcha");
  return { providers: providers.map((provider) => provider.id), phone: await phoneAuthOptions(), recaptcha: {
    enabled: config.enabled === true, siteKey: config.enabled === true ? String(config.siteKey ?? "") : "",
  } };
}

/** Legacy registration CAPTCHA, verified server-side before creating an account. */
export async function verifyRegistrationCaptcha(token?: string) {
  const config = await getDecryptedGroup("recaptcha");
  if (config.enabled !== true) return false;
  if (!config.secretKey || !config.siteKey) throw new ApiError(503, "Registration verification is not configured");
  if (!token) throw new ApiError(422, "Complete the registration verification");
  let result: { success?: boolean; hostname?: string };
  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST", body: new URLSearchParams({ secret: String(config.secretKey), response: token }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Verification unavailable");
    result = await response.json() as typeof result;
  } catch { throw new ApiError(503, "Registration verification is temporarily unavailable"); }
  if (!result.success || result.hostname !== new URL(env.NEXT_PUBLIC_APP_URL).hostname) {
    throw new ApiError(422, "Verification expired or was invalid; please try again");
  }
  return true;
}
