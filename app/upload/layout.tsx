/**
 * Topic extraction runs in a server action and can take a while on a long PDF,
 * so the segment needs a raised function timeout.
 *
 * This lives here rather than in `actions.ts` because a `"use server"` module may
 * only export async functions - exporting the constant `maxDuration` from one
 * made the compiler discard every export in the file, so `uploadDocument`
 * appeared not to exist and `next build` failed.
 */
export const maxDuration = 300;

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
