export function FairwayScene() {
  return (
    <div className="scene" aria-hidden="true">
      <div className="scene-sky" />
      <div className="scene-sun" />
      <div className="scene-haze" />

      <div className="cloud cloud-1" />
      <div className="cloud cloud-2" />
      <div className="cloud cloud-3" />

      <svg
        className="scene-trail"
        viewBox="0 0 1000 320"
        preserveAspectRatio="none"
      >
        <path
          d="M-40 270 C 160 220, 300 190, 470 155 S 760 70, 1060 28"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        />
      </svg>

      <div className="flight" />
      <div className="flight flight--2" />
      <div className="flight flight--3" />

      <div className="floatball floatball-1" />
      <div className="floatball floatball-2" />
      <div className="floatball floatball-3" />

      <svg
        className="scene-hills"
        viewBox="0 0 1440 560"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b7d8bf" />
            <stop offset="100%" stopColor="#8fbf9c" />
          </linearGradient>
          <linearGradient id="hillMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7fb48e" />
            <stop offset="100%" stopColor="#4f8f66" />
          </linearGradient>
          <linearGradient id="hillNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4d8a61" />
            <stop offset="100%" stopColor="#2d5f42" />
          </linearGradient>
        </defs>
        <path
          className="hill hill--far"
          fill="url(#hillFar)"
          d="M0 240 C 180 150, 340 170, 520 210 C 700 250, 860 130, 1040 170 C 1220 210, 1340 190, 1440 160 L 1440 560 L 0 560 Z"
        />
        <path
          className="hill hill--mid"
          fill="url(#hillMid)"
          d="M0 320 C 220 255, 380 295, 560 275 C 760 250, 920 195, 1120 235 C 1280 265, 1380 285, 1440 275 L 1440 560 L 0 560 Z"
        />
        <ellipse
          className="bunker"
          cx="360"
          cy="390"
          rx="70"
          ry="18"
          fill="#d8c39a"
          opacity="0.55"
        />
        <path
          className="hill hill--near"
          fill="url(#hillNear)"
          d="M0 400 C 200 355, 360 375, 540 365 C 760 350, 940 315, 1140 345 C 1300 365, 1380 385, 1440 375 L 1440 560 L 0 560 Z"
        />
        <ellipse
          className="green-pad"
          cx="1185"
          cy="360"
          rx="98"
          ry="30"
          fill="#245c3f"
        />
        <ellipse
          cx="1185"
          cy="360"
          rx="38"
          ry="12"
          fill="#1c4a32"
          opacity="0.55"
        />
      </svg>

      <div className="flagstick">
        <span className="flag-pole" />
        <span className="flag-cloth" />
        <span className="flag-cup" />
      </div>

      <div className="blades">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            className="blade"
            key={i}
            style={{
              animationDelay: `${i * 0.09}s`,
              height: `${58 + ((i * 17) % 42)}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
