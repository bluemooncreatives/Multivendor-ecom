import Link from "next/link";
export default function NotFound(){return <main className="not-found"><h1>404</h1><h2>We couldn’t find that page</h2><p>The link may be old, or the item is no longer available.</p><Link className="button button-primary" href="/">Return home</Link></main>}
