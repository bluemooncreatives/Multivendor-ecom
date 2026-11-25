import { StaticPage } from "./static-page";
import { unstable_rethrow } from "next/navigation";

export async function PolicyPage({ type, title }: { type: string; title: string }) {
  let body = "";
  let available = true;
  try {
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    const response = await fetch(`${api}/cms/policies/${type}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error("Policy unavailable");
    const policy = await response.json() as { body?: string };
    body = policy.body ?? "";
  } catch (error) { unstable_rethrow(error); available = false; }
  return <StaticPage title={title}>
    {body ? <div className="prose max-w-none whitespace-pre-line dark:prose-invert" dangerouslySetInnerHTML={{ __html: body }} />
      : <p>{available ? "This policy has not been published yet." : "Policy content is temporarily unavailable. Please try again later."}</p>}
  </StaticPage>;
}
