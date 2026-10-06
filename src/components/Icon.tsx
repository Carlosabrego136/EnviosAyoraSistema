import type { ReactNode } from 'react';

export type IconName =
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
  | 'pulse';

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

const SERVICE_ICONS = new Set<IconName>(['plane', 'truck', 'box', 'mail', 'pin', 'shield']);
export function serviceIcon(name: string): IconName {
  return SERVICE_ICONS.has(name as IconName) ? (name as IconName) : 'box';
}
