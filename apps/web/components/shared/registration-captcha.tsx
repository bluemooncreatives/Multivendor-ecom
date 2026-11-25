"use client";
import { useEffect, useRef, useState } from "react";

interface CaptchaApi {
  render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void }) => number;
  reset: (widget: number) => void;
}
declare global { interface Window { grecaptcha?: CaptchaApi; marketplaceCaptchaReady?: () => void } }
let loading: Promise<CaptchaApi> | null = null;

function loadCaptcha(): Promise<CaptchaApi> {
  if (window.grecaptcha?.render) return Promise.resolve(window.grecaptcha);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    window.marketplaceCaptchaReady = () => {
      if (window.grecaptcha) resolve(window.grecaptcha); else { loading = null; reject(new Error("Verification unavailable")); }
    };
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?onload=marketplaceCaptchaReady&render=explicit";
    script.async = true;
    script.onerror = () => { loading = null; reject(new Error("Verification unavailable")); };
    document.head.appendChild(script);
  });
  return loading;
}

export function RegistrationCaptcha({ siteKey, onChange }: { siteKey: string; onChange: (token: string) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    let widget: number | undefined;
    void loadCaptcha().then((api) => {
      if (!active || !root.current) return;
      widget = api.render(root.current, { sitekey: siteKey, callback: onChange,
        "expired-callback": () => onChange(""), "error-callback": () => { onChange(""); setFailed(true); } });
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; if (widget !== undefined) window.grecaptcha?.reset(widget); };
  }, [siteKey, onChange]);
  return <div><div ref={root} />{failed && <p className="text-sm text-destructive">Verification could not load. Reload to try again.</p>}</div>;
}
