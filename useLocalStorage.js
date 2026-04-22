import { useEffect, useState } from 'react';

function isCompatibleStorageValue(value, initialValue) {
  if (Array.isArray(initialValue)) {
    return Array.isArray(value);
  }

  if (initialValue && typeof initialValue === 'object') {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  return typeof value === typeof initialValue;
}

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const rawValue = window.localStorage.getItem(key);
      if (!rawValue) {
        return initialValue;
      }

      const parsedValue = JSON.parse(rawValue);
      return isCompatibleStorageValue(parsedValue, initialValue) ? parsedValue : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Ignore storage write failures so the UI remains usable.
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
