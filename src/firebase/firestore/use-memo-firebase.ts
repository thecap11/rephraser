
"use client";

import { useMemo, type DependencyList } from "react";

type MemoFirebase<T> = T & { __memo?: boolean };

// A hook to memoize Firebase queries and references.
// This is a workaround for the fact that Firebase queries are objects, and
// creating them in a component will cause them to be re-created on every
// render, which will cause an infinite loop in `useEffect` hooks.
export function useMemoFirebase<T>(
  factory: () => T,
  deps: DependencyList | undefined
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);

  if (typeof memoized === "object" && memoized !== null) {
    // This is the critical part that was missing/incorrect.
    // We are now correctly assigning the __memo flag to the memoized object.
    (memoized as MemoFirebase<T>).__memo = true;
  }

  return memoized;
}
