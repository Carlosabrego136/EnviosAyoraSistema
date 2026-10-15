import type { ReactNode } from 'react';

export type IconName =
  | 'edit'
  | 'plane'
  | 'truck'
  | 'box'
  | 'mail'
  | 'pin'
  | 'shield'
  | 'calendar'
  | 'users'
  | 'whatsapp'
  | 'arrow'
  | 'pause'
  | 'play'
  | 'menu'
  | 'close'
  | 'clock'
  | 'check'
  | 'alert'
  | 'megaphone'
  | 'pulse'
  | 'calc'
  | 'search'
  | 'star'
  | 'pallet'
  | 'route'
  | 'store'
  | 'link'
  | 'facebook'
  | 'tiktok'
  | 'copy'
  | 'shieldcheck'
  | 'gift';

const PATHS: Record<IconName, ReactNode> = {
  plane: <path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2l-1.1 1.1 6.4 3.6-3.1 3.1-2.6-.5-.9.9 3 1.7 1.7 3 .9-.9-.5-2.6 3.1-3.1 3.6 6.4z" />,
  truck: (
    <>
      <path d="M3 6.5h11v9H3z" />
      <path d="M14 9.5h4l3 3.2v2.8h-7z" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  box: (
    <>
      <path d="m3.5 7.5 8.5-4 8.5 4v9l-8.5 4-8.5-4z" />
      <path d="m3.5 7.5 8.5 4 8.5-4M12 11.5v9" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.5 7 8.5 6.2L20.5 7" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11.2A7 7 0 0 0 5 9.8C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.8" r="2.4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.2 5 6v5.6c0 4.3 2.9 7.6 7 9.2 4.1-1.6 7-4.9 7-9.2V6z" />
      <path d="m8.8 12.2 2.2 2.2 4.2-4.4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3 19.5c.6-3.3 3-5 6-5s5.4 1.7 6 5" />
      <path d="M16 5.6a3 3 0 0 1 0 5.8M17.5 14.8c2 .5 3.2 2 3.5 4.7" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5 5 16.2a8.5 8.5 0 1 1 15.5-4.6z" />
      <path d="M9.2 8.6c.2-.5.6-.6.9-.5l.7 1.5c.1.3-.1.6-.4.9-.3.3-.2.5.2 1 .5.7 1.2 1.3 2 1.7.4.2.6.1.9-.2.3-.4.5-.5.8-.4l1.5.7c.2.2.2.6-.1 1-.6.8-1.5 1-2.6.7-2.3-.7-4.1-2.4-4.8-4.6-.3-.9-.1-1.5.9-1.6z" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  pause: (
    <>
      <path d="M9 5.5v13M15 5.5v13" />
    </>
  ),
  play: <path d="M8 5.5v13l10-6.5z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  alert: (
    <>
      <path d="M12 4 2.8 19.5h18.4z" />
      <path d="M12 10v4.2M12 17h.01" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 10v4a1 1 0 0 0 1 1h2l8 4V5L7 9H5a1 1 0 0 0-1 1z" />
      <path d="M18.5 9.5a4 4 0 0 1 0 5" />
    </>
  ),
  pulse: <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />,
  calc: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  star: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z" />,
  pallet: (
    <>
      <rect x="5" y="4.5" width="6" height="6" />
      <rect x="13" y="4.5" width="6" height="6" />
      <path d="M3 13.5h18v3H3zM6 16.5v3M12 16.5v3M18 16.5v3" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6" />
    </>
  ),
  store: (
    <>
      <path d="m4 9.5 1.5-5.5h13L20 9.5M4 9.5v10h16v-10" />
      <path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M9.5 19.5v-5h5v5" />
    </>
  ),
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  facebook: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5c0-.3.2-.5.5-.5z" />,
  tiktok: <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.3 2.3 1.9 3.8 4.5 4" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />,
  copy: (
    <>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </>
  ),
  shieldcheck: (
    <>
      <path d="M12 3.2 5 6v5.6c0 4.3 2.9 7.6 7 9.2 4.1-1.6 7-4.9 7-9.2V6z" />
      <path d="m8.8 12.2 2.2 2.2 4.2-4.4" />
    </>
  ),
  gift: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="1.5" />
      <path d="M3 9h18v-2.5H3zM12 6.5V20M12 6.5c-1-3-5-3-4.5-.5.3 1.5 2.5 1 4.5.5zM12 6.5c1-3 5-3 4.5-.5-.3 1.5-2.5 1-4.5.5z" />
    </>
  ),
};

export function Icon({ name, size = 22, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

const SERVICE_ICONS = new Set<IconName>(['plane', 'truck', 'box', 'mail', 'pin', 'shield', 'pallet']);
export function serviceIcon(name: string): IconName {
  return SERVICE_ICONS.has(name as IconName) ? (name as IconName) : 'box';
}
