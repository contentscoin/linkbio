export function FairwayScene() {
  return (
    <div className="scene" aria-hidden="true">
      <div className="scene-sun" />
      <div className="cloud cloud-1" />
      <div className="cloud cloud-2" />
      <div className="scene-trail" />
      <div className="flight" />
      <div className="flight flight--2" />
      <div className="floatball floatball-1" />
      <div className="floatball floatball-2" />
      <div className="floatball floatball-3" />
      <div className="scene-hills" />
      <div className="flagstick">
        <div className="flag-cloth" />
      </div>
      <div className="blades">
        {Array.from({ length: 12 }).map((_, i) => (
          <span className="blade" key={i} style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>
    </div>
  );
}
