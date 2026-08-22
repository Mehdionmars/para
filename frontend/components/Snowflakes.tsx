import { Snowflake } from "lucide-react";

const FLAKES = [
  { left: "6%", top: "12%", size: 24, dur: "7s", delay: "0s" },
  { left: "18%", top: "70%", size: 15, dur: "9s", delay: ".8s" },
  { left: "46%", top: "16%", size: 19, dur: "8s", delay: "1.6s" },
  { left: "72%", top: "64%", size: 13, dur: "10s", delay: ".4s" },
  { left: "88%", top: "22%", size: 21, dur: "7.5s", delay: "1.2s" },
  { left: "60%", top: "84%", size: 17, dur: "9.5s", delay: "2s" },
];

/** Purely decorative floating snowflakes used on dark hero/banner sections. */
export function Snowflakes({ opacity = 0.3, scale = 1 }: { opacity?: number; scale?: number }) {
  return (
    <div aria-hidden="true">
      {FLAKES.map((f, i) => (
        <Snowflake
          key={i}
          size={f.size * scale}
          color={`rgba(247,238,229,${opacity})`}
          strokeWidth={1}
          style={{
            position: "absolute",
            left: f.left,
            top: f.top,
            animation: `flake ${f.dur} ease-in-out infinite alternate`,
            animationDelay: f.delay,
          }}
        />
      ))}
    </div>
  );
}
