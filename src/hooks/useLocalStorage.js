import { useState, useEffect } from "react";
import { readStorage, writeStorage } from "../utils/storage";
export function useLocalStorage(key, fallback, validate) {
  const [value, setValue] = useState(() =>
    readStorage(key, fallback, validate),
  );
  const [error, setError] = useState(false);
  useEffect(() => {
    setError(!writeStorage(key, value));
  }, [key, value]);
  return [value, setValue, error];
}
