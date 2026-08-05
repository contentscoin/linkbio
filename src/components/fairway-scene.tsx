export function FairwayScene() {
  return (
    <div className="scene" aria-hidden="true">
      <div className="scene-sun" />
      <div className="cloud cloud-1" />
      <div className="cloud cloud-2" />

      <svg
        className="scene-trail"
        viewBox="0 0 1000 320"
        preserveAspectRatio="none"
      >
        <path
          d="M-20 260 C 180 210, 320 180, 480 150 S 780 70, 1040 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>

      <div className="flight" />
      <div className="flight flight--2" />

      <div className="floatball floatball-1" />
      <div className="floatball floatball-2" />
      <div className="floatball floatball-3" />

      <svg
        className="scene-hills"
        viewBox="0 0 1440 520"
        preserveAspectRatio="none"
      >
        <path
          className="hill hill--far"
          d="M0 220 C 180 140, 340 160, 520 200 C 700 240, 860 120, 1040 160 C 1220 200, 1340 180, 1440 150 L 1440 520 L 0 520 Z"
        />
        <path
          className="hill hill--mid"
          d="M0 300 C 220 240, 380 280, 560 260 C 760 236, 920 180, 1120 220 C 1280 250, 1380 270, 1440 260 L 1440 520 L 0 520 Z"
        />
        <path
          className="hill hill--near"
          d="M0 380 C 200 340, 360 360, 540 350 C 760 336, 940 300, 1140 330 C 1300 350, 1380 370, 1440 360 L 1440 520 L 0 520 Z"
        />
        <ellipse className="green-pad" cx="1180" cy="350" rx="92" ry="28" />
      </svg>

      <div className="flagstick">
        <span className="flag-pole" />
        <span className="flag-cloth" />
        <span className="flag-cup" />
      </div>

      <div className="blades">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            className="blade"
            key={i}
            style={{ animationDelay: `${i * 0.11}s` }}
          />
        ))}
      </div>
    </div>
  );
}
