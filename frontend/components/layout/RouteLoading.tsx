import Image from "next/image";

/**
 * The storefront's route-level loading skeleton.
 *
 * Deliberately NOT wired up as a group-wide `app/(site)/loading.tsx`: a
 * loading.tsx applies to its segment *and every nested segment*, and the
 * Suspense boundary it creates makes Next flush the response shell (and
 * therefore commit HTTP 200) before the page's data resolves. Any descendant
 * route that calls notFound() or redirect() then renders the right page with
 * the wrong status — a soft 404, which search engines index.
 *
 * So it is opted into per-route instead, only where no descendant needs a
 * real status code. See app/(site)/(home)/loading.tsx and
 * app/(site)/catalogue/loading.tsx.
 */
export function RouteLoading() {
  return (
    <div
      role="status"
      aria-label="Chargement"
      style={{
        /* A full viewport, not 60vh, and the padding below is what keeps the
           logo where it always was.
           60vh reserved 540px of a 900px viewport; with the header above it
           the footer landed at y=711 — on screen. The moment the real page
           streamed in, the footer was pushed thousands of pixels down, and
           that single jump measured CLS 0.21, twice the 0.1 "good" threshold,
           on every cold load of the home page. It is in production, not just
           dev: the preprod HTML ships this same `min-height:60vh` shell.

           Reserving 100vh puts the footer past the fold on any viewport, so
           the shift happens where nobody can see it and stops counting.

           The padding-bottom then buys back the optics. With border-box, the
           content area becomes 100vh − 40vh = 60vh, and centring inside it
           puts the logo at 30vh — the exact position the old 60vh box gave
           it. The reservation grows; the spinner does not move. */
        minHeight: "100vh",
        paddingBottom: "40vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 96,
          height: 96,
          animation: "logo-pulse 1.1s ease-in-out infinite alternate",
        }}
      >
        <Image src="/assets/logo.png" alt="Para d'Hiver" fill sizes="96px" style={{ objectFit: "contain" }} priority />
      </div>
    </div>
  );
}
