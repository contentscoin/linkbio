"use client";

import { useState } from "react";
import { ACCENT_PRESETS } from "@/lib/design-templates";

export function AccentField({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="field">
      <label htmlFor="accent">포인트 컬러</label>
      <div className="accents" style={{ marginBottom: 10 }}>
        {ACCENT_PRESETS.map((color) => (
          <button
            key={color}
            className="accent-btn"
            type="button"
            aria-label={`액센트 ${color}`}
            aria-pressed={color.toLowerCase() === value.toLowerCase()}
            style={{ background: color }}
            onClick={() => setValue(color)}
          />
        ))}
      </div>
      <input
        id="accent"
        name="accent"
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="#2d6a4f"
      />
    </div>
  );
}
