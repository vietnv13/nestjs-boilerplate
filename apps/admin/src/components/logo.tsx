/** @deprecated — kept for legacy nav.tsx import; use AdminLogo directly */
export { AdminLogo as Logo }

interface AdminLogoProps {
  /** Icon + wordmark size scale. Default 1 (32 px icon). */
  scale?: number
  /** Show "ADMIN" wordmark next to the icon. Default true. */
  showText?: boolean
}

/**
 * AdminLogo
 *
 * SVG shield-mark + "ADMIN" wordmark.
 * Designed for the dark #002140 navigation bar — white text/icon.
 */
export function AdminLogo({ scale = 1, showText = true }: AdminLogoProps) {
  const iconSize = Math.round(32 * scale)

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: Math.round(10 * scale),
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* Shield mark */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="ag-outer"
            x1="16"
            y1="2"
            x2="16"
            y2="28"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#2e8bc7" />
            <stop offset="100%" stopColor="#1a5f8e" />
          </linearGradient>
          <linearGradient
            id="ag-gloss"
            x1="16"
            y1="4"
            x2="16"
            y2="16"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="white" stopOpacity="0.22" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Shield body */}
        <path
          d="M16 2.5L4.5 7.5V16C4.5 22.903 9.71 28.5 16 28.5C22.29 28.5 27.5 22.903 27.5 16V7.5L16 2.5Z"
          fill="url(#ag-outer)"
        />

        {/* Gloss layer */}
        <path
          d="M16 4.5L7 9V16C7 21.523 11.03 26 16 26C16 26 16 4.5 16 4.5Z"
          fill="url(#ag-gloss)"
        />

        {/* Shield border */}
        <path
          d="M16 2.5L4.5 7.5V16C4.5 22.903 9.71 28.5 16 28.5C22.29 28.5 27.5 22.903 27.5 16V7.5L16 2.5Z"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.75"
          fill="none"
        />

        {/* "A" lettermark — bold, white */}
        <path
          d="M16 8.5L10.5 22H12.9L14.15 18.8H17.85L19.1 22H21.5L16 8.5ZM14.9 17L16 13.9L17.1 17H14.9Z"
          fill="white"
        />
      </svg>

      {/* Wordmark */}
      {showText && (
        <span
          style={{
            color: '#ffffff',
            fontSize: Math.round(14 * scale),
            fontWeight: 700,
            letterSpacing: Math.round(2.5 * scale),
            fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
            lineHeight: 1,
          }}
        >
          ADMIN
        </span>
      )}
    </span>
  )
}
