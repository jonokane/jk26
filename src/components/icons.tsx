import type { SVGProps } from "react";

/**
 * Inlined Lucide icons (ISC-licensed), so the site pulls in no icon runtime for
 * a handful of glyphs. Each is a 24×24 stroke icon that inherits `currentColor`
 * and sizes from the `size` prop (default 20). Decorative by default
 * (`aria-hidden`): the control that carries an icon owns the accessible name.
 */
function Icon({
  size = 20,
  children,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function MoonStarIcon(props: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Icon {...props}>
      <path d="M18 5h4" />
      <path d="M20 3v4" />
      <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
    </Icon>
  );
}

export function SunIcon(props: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </Icon>
  );
}

export function CircleArrowDownIcon(props: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8" />
      <path d="m8 12 4 4 4-4" />
    </Icon>
  );
}

export function CircleArrowUpIcon(props: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="m16 12-4-4-4 4" />
      <path d="M12 16V8" />
    </Icon>
  );
}
