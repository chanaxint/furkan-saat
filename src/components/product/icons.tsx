/** Hairline icons (1px strokes) shared by the nav and product UI. */
const base = { width: 20, height: 20, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1, "aria-hidden": true } as const;

export const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg {...base} fill={filled ? "currentColor" : "none"}>
    <path d="M10 16.5s-6.5-3.9-6.5-8.6A3.4 3.4 0 0 1 10 6a3.4 3.4 0 0 1 6.5 1.9c0 4.7-6.5 8.6-6.5 8.6Z" />
  </svg>
);

export const SearchIcon = () => (
  <svg {...base}>
    <circle cx="8.5" cy="8.5" r="5.5" />
    <path d="m12.6 12.6 4.4 4.4" />
  </svg>
);

export const PersonIcon = () => (
  <svg {...base}>
    <circle cx="10" cy="7" r="3.2" />
    <path d="M3.8 17c.9-3.2 3.3-4.8 6.2-4.8s5.3 1.6 6.2 4.8" />
  </svg>
);

export const BagIcon = () => (
  <svg {...base}>
    <path d="M4 7h12l-1 10H5L4 7Z" />
    <path d="M7.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
  </svg>
);
