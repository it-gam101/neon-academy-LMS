import { useEffect, useRef } from 'react';

/**
 * Dispatch 6: the latest value, read through a ref whose identity never changes.
 * Data loaders read the dictionary this way, so switching the language changes the words on screen without re-running
 * the load — which used to send Admin and HR Analytics back to their first tab behind a loading skeleton.
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
