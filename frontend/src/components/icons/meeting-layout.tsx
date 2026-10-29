/** Small diagrams of the actual stage arrangements, optically aligned on a 24px grid. */
export function MeetingLayoutIcon({ focus = false }: { focus?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      {focus ? (
        <>
          <rect
            x="3"
            y="3.5"
            width="18"
            height="11.5"
            rx="2"
            fill="currentColor"
            fillOpacity="0.08"
          />
          <rect x="3" y="18" width="4.5" height="3.5" rx="1" />
          <rect x="9.75" y="18" width="4.5" height="3.5" rx="1" />
          <rect x="16.5" y="18" width="4.5" height="3.5" rx="1" />
        </>
      ) : (
        <>
          <rect
            x="3"
            y="3.5"
            width="7.5"
            height="7.5"
            rx="1.75"
            fill="currentColor"
            fillOpacity="0.08"
          />
          <rect x="13.5" y="3.5" width="7.5" height="7.5" rx="1.75" />
          <rect x="3" y="14" width="7.5" height="7.5" rx="1.75" />
          <rect
            x="13.5"
            y="14"
            width="7.5"
            height="7.5"
            rx="1.75"
            fill="currentColor"
            fillOpacity="0.08"
          />
        </>
      )}
    </svg>
  );
}
