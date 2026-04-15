import { useEffect } from 'react';

import type { RefObject } from 'react';

/**
 * Calls `onClose` when a mousedown event fires outside the referenced element.
 * Commonly used to dismiss dropdowns and modals.
 */
export function useClickOutside(ref: RefObject<HTMLElement | null>, onClose: () => void): void {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ref, onClose]);
}
