/**
 * Mirrors the order workspace exactly: header, articles + sticky summary,
 * customer + shipping, timeline, accordions.
 *
 * A centred spinner would tell the operator nothing and would make the real
 * content appear to jump into place. Matching the final geometry means the
 * page only fills in, it never reflows.
 *
 * `animate-pulse` is dropped under prefers-reduced-motion via the shared
 * `motion-reduce` variant, so the skeleton stays visible but stops moving.
 */
function Block({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div style={style} className={`animate-pulse rounded bg-gray-100 motion-reduce:animate-none ${className}`} />;
}

export default function OrderDetailLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <span className="sr-only" role="status">
        Chargement de la commande…
      </span>

      <header className="flex flex-wrap items-center gap-x-3 gap-y-3" aria-hidden="true">
        <Block className="h-9 w-9 shrink-0" />
        <div className="min-w-0 grow basis-0">
          <Block className="h-5 w-40" />
          <Block className="mt-1.5 h-3 w-64 max-w-full" />
        </div>
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <Block className="h-9 w-28 shrink-0 sm:w-32" />
          <Block className="h-9 w-9 shrink-0 sm:w-24" />
          <Block className="h-9 w-9 shrink-0" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]" aria-hidden="true">
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-2.5">
            <Block className="h-3 w-24" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-0">
              <Block className="h-14 w-14 shrink-0" />
              <div className="min-w-0 flex-1">
                <Block className="h-3.5" style={{ width: `${50 + i * 12}%` }} />
                <Block className="mt-2 h-2.5 w-24" />
              </div>
              <Block className="h-3.5 w-16 shrink-0" />
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white lg:self-start">
          <div className="border-b border-gray-100 px-4 py-2.5">
            <Block className="h-3 w-16" />
          </div>
          <div className="flex flex-col gap-2 p-4">
            <Block className="h-3.5" />
            <Block className="h-3.5" />
            <Block className="h-3.5" />
            <Block className="mt-3 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-hidden="true">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-2.5">
              <Block className="h-3 w-20" />
            </div>
            <div className="flex flex-col gap-2 p-4">
              <Block className="h-3.5 w-2/3" />
              <Block className="h-3.5 w-1/2" />
              <Block className="h-3.5 w-3/5" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white" aria-hidden="true">
        <div className="border-b border-gray-100 px-4 py-2.5">
          <Block className="h-3 w-32" />
        </div>
        <div className="flex items-start justify-between gap-2 p-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <Block className="h-5 w-5 rounded-full" />
              <Block className="h-2.5 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-b border-gray-100 px-4 py-3.5 last:border-0">
            <Block className="h-3.5 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}
