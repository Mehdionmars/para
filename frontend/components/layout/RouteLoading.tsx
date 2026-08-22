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
        minHeight: "60vh",
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
