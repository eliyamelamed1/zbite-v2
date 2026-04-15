import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  /** Called when the sentinel enters the viewport. */
  onLoadMore: () => void;
  /** Whether there are more pages to load. */
  hasMore: boolean;
  /** Whether a request is currently in flight. */
  isLoading: boolean;
}

/**
 * Returns a ref to attach to a sentinel element at the bottom of a list.
 * When the sentinel enters the viewport and conditions are met, `onLoadMore` fires.
 */
export function useInfiniteScroll({ onLoadMore, hasMore, isLoading }: UseInfiniteScrollOptions): React.RefObject<HTMLDivElement | null> {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onLoadMore);
  callbackRef.current = onLoadMore;

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0]?.isIntersecting && !isLoading && hasMore) {
      callbackRef.current();
    }
  }, [isLoading, hasMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '200px',
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [handleIntersect]);

  return sentinelRef;
}
