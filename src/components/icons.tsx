import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, children, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const MenuIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);
export const TicketIcon = (p: P) => (
  <Icon {...p}>
    <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" />
    <path d="M14 6v12" strokeDasharray="2 2.4" />
  </Icon>
);
export const BookIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z" />
    <path d="M12 6.5v13" />
  </Icon>
);
export const RulesIcon = (p: P) => (
  <Icon {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" />
  </Icon>
);
export const ShieldIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 3l7 3v6c0 4.2-3 7.6-7 9-4-1.4-7-4.8-7-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
);
export const LimitsIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 17a8 8 0 1 1 16 0" />
    <path d="M12 17l4-5" />
    <path d="M4 17h2M18 17h2M12 9V8" />
  </Icon>
);
export const PrevIcon = (p: P) => (
  <Icon {...p}>
    <path d="M14.5 6l-6 6 6 6" />
  </Icon>
);
export const NextIcon = (p: P) => (
  <Icon {...p}>
    <path d="M9.5 6l6 6-6 6" />
  </Icon>
);
export const SoundIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M16 9a4 4 0 0 1 0 6" />
    <path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" />
  </Icon>
);
export const MuteIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  </Icon>
);
export const HelpIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5v.7" />
    <path d="M12 17h.01" />
  </Icon>
);
export const AutoIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5" />
    <path d="M20 4v4.5h-4.5" />
    <path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5" />
    <path d="M4 20v-4.5h4.5" />
  </Icon>
);
export const CloseIcon = (p: P) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);
export const CashOutIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 15V3M7 8l5-5 5 5" />
    <path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
  </Icon>
);
export const CrosshairIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M12 1v5M12 18v5M1 12h5M18 12h5" />
  </Icon>
);
