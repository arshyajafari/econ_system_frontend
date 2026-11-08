import { useEffect, useState } from "react";

/** Returns the latest value after it has remained unchanged for the delay. */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}
