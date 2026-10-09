/**
 * Skeleton rather than a centred spinner.
 *
 * A spinner tells you the page is busy but not what is arriving, and it
 * collapses the layout the moment it disappears. These blocks mirror the
 * dashboard's real shape, so nothing jumps when the data lands. Motion is
 * disabled under prefers-reduced-motion via the global rule in globals.css.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-background" aria-busy="true" aria-label="Loading">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="h-8 w-40 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
          <div className="h-10 w-40 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
        </div>

        <div className="mt-4 flex flex-wrap gap-5 border-b border-border pb-5">
          <div className="h-1 w-28 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
          <div className="h-1 w-28 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
          <div className="h-3 w-48 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
        </div>

        <div className="mt-6 rounded-lg border bg-card p-5">
          <div className="h-5 w-2/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="mt-3 h-3 w-40 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="mt-4 flex gap-2">
            <div className="h-11 w-32 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
            <div className="h-11 w-32 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {[0, 1].map((section) => (
            <div key={section}>
              <div className="mb-3 h-4 w-28 animate-pulse rounded bg-muted motion-reduce:animate-none" />
              <div className="divide-y divide-border border-y border-border">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="flex items-center gap-3 py-3">
                    <div className="flex-1">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                      <div className="mt-2 h-3 w-32 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                    </div>
                    <div className="h-11 w-24 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
