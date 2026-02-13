export const NepalFlag = ({ className = "w-8 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 120" className={className}>
    <defs>
      <clipPath id="flag-shape">
        <polygon points="0,0 100,40 60,60 100,100 0,120" />
      </clipPath>
    </defs>
    <polygon points="0,0 100,40 60,60 100,100 0,120" fill="#DC143C" stroke="#003893" strokeWidth="4" />
    <circle cx="35" cy="35" r="12" fill="white" />
    <polygon
      points="35,20 37,30 47,30 39,36 42,46 35,40 28,46 31,36 23,30 33,30"
      fill="white"
      transform="translate(0, 30) scale(0.8) translate(8, 0)"
    />
  </svg>
);
