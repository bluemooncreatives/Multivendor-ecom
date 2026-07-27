import type { SVGProps } from "react";

const paths: Record<string, React.ReactNode> = {
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
  bag: <><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  heart: <path d="M20.8 5.7a5.5 5.5 0 0 0-7.8 0L12 6.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z"/>,
  store: <><path d="M4 10v11h16V10"/><path d="M3 4h18l-2 6a3 3 0 0 1-5 1 3 3 0 0 1-4 0 3 3 0 0 1-5-1L3 4Z"/></>,
  grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  box: <><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="m4 7 1 11 7 3 7-3 1-11M12 11v10"/></>,
  star: <path d="m12 2 3 6 7 .9-5 4.8 1.3 7-6.3-3.3-6.3 3.3 1.3-7-5-4.8L9 8l3-6Z"/>,
  wallet: <><path d="M3 6h16v15H3z"/><path d="M3 6c0-2 1-3 3-3h11v3M15 12h6v5h-6a2.5 2.5 0 0 1 0-5Z"/></>,
  chat: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.5-5A8 8 0 1 1 21 15Z"/>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.7-.6-1.5.9-1.9-2.1-2.1-1.9.9-1.5-.6L11 2H8l-.7 2.1-1.5.6-1.9-.9-2.1 2.1.9 1.9-.6 1.5L0 10v3l2.1.7.6 1.5-.9 1.9 2.1 2.1 1.9-.9 1.5.6L8 21h3l.7-2.1 1.5-.6 1.9.9 2.1-2.1-.9-1.9.6-1.5L19 13.5Z" transform="translate(2 .5) scale(.9)"/></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
  tag: <><path d="M3 12V4h8l10 10-8 8L3 12Z"/><circle cx="8" cy="8" r="1"/></>,
  download: <><path d="M12 3v13m-5-5 5 5 5-5"/><path d="M4 21h16"/></>,
  support: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 1 1 4 2.4c-1 .5-1.5 1.1-1.5 2.1M12 17h.01"/></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 4 5"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7"/></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m3 17 5-5 4 4 3-3 6 6"/></>,
  file: <><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/></>,
  globe: <><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></>,
  shield: <path d="M12 2 4 5v6c0 5 3 9 8 11 5-2 8-6 8-11V5l-8-3Z"/>,
  truck: <><path d="M2 5h13v12H2zM15 9h4l3 4v4h-7z"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></>,
  pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/></>,
  bolt: <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/>,
  ticket: <path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V6Z"/>,
  upload: <><path d="M12 21V8m-5 5 5-5 5 5"/><path d="M4 4h16"/></>,
  sliders: <><path d="M4 6h16M4 18h16M4 12h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="8" cy="18" r="2"/></>,
  toggle: <><rect x="2" y="7" width="20" height="10" rx="5"/><circle cx="16" cy="12" r="3"/></>,
  money: <><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8M12 5v14"/></>,
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: string }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.box}</svg>;
}
