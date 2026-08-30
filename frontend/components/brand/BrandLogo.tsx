import { CloudinaryImage } from "@/components/CloudinaryImage";
import { BRAND_LOGO_FILES, wordmarkMeasure, wordmarkSpec } from "@/lib/brandWordmarks";

/**
 * A brand's mark.
 *
 * Real logo first, always: the CMS upload, then a mark committed under
 * `public/assets/brands/`. Only when neither exists does the brand get a
 * composed logotype — its name set in its own typographic register.
 *
 * The two-letter circle this replaced ("LR", "AV", "BI") was the whole page's
 * problem: twenty-seven laboratories reduced to twenty-seven identical grey
 * discs, none of them recognisable, none of them naming anything. A logotype
 * is not a logo, but it is the brand's name in the brand's voice, and it
 * steps aside the moment a real file arrives — which is the only reason it is
 * acceptable as a fallback rather than as an answer.
 */

const FAMILY_VAR = {
  alta: "var(--font-alta)",
  poppins: "var(--font-poppins)",
} as const;

type Size = "sm" | "md" | "lg";

/** Plate height, and the ceiling a logotype may grow to, per size. The
 *  width it is actually fitted to comes from the tile itself, in CSS. */
const METRICS: Record<Size, { plate: number; max: number }> = {
  sm: { plate: 40, max: 15 },
  md: { plate: 52, max: 17 },
  lg: { plate: 64, max: 24 },
};

export function BrandLogo({
  logo,
  name,
  slug,
  size = "md",
  muted = false,
}: {
  logo: string | null;
  name: string;
  /** Needed to resolve the repo-committed mark and the brand's own logotype. */
  slug?: string;
  /** "sm" for the catalogue rail, "md" for the /marques grid, "lg" for a brand header. */
  size?: Size;
  /** A brand with nothing published yet: the mark stays legible but recedes. */
  muted?: boolean;
}) {
  const { plate, max } = METRICS[size];
  const file = slug ? BRAND_LOGO_FILES[slug] : undefined;
  const src = logo || file || null;

  if (src) {
    return (
      <span className="brand-mark" style={{ height: plate, opacity: muted ? 0.5 : 1 }}>
        {/* contain, never fill: brand logos arrive in every aspect ratio, and
            cropping one is worse than leaving air around it. */}
        <CloudinaryImage
          alt={`Logo ${name}`}
          crop="limit"
          height={plate}
          sizes={`${plate * 4}px`}
          src={src}
          style={{ height: "100%", maxWidth: "100%", objectFit: "contain", width: "auto" }}
          width={plate * 4}
        />
      </span>
    );
  }

  const spec = wordmarkSpec(slug);

  return (
    <span className="brand-mark" style={{ height: plate }}>
      <span
        className={muted ? "brand-wordmark brand-wordmark--muted" : "brand-wordmark"}
        style={{
          fontFamily: FAMILY_VAR[spec.family],
          fontWeight: spec.weight,
          // The tile is the container: CSS divides its width by this measure,
          // so the mark stays optically the same width from a 240px desktop
          // tile down to a 150px one on a phone.
          ["--wm-measure" as string]: wordmarkMeasure(name, spec),
          ["--wm-max" as string]: `${max}px`,
          fontSize: spec.size,
          letterSpacing: `${spec.tracking}em`,
          textTransform: spec.transform,
          // The tracking is applied to the right of the last glyph too, which
          // pushes a centred wordmark visibly off-axis. Pulling it back is the
          // difference between a mark that sits in its plate and one that leans.
          marginRight: `-${spec.tracking}em`,
        }}
      >
        {name}
      </span>
    </span>
  );
}
