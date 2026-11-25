import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

// Loads `path` and gives back { data, error, loading, reload }.
// reload() refetches without flashing the loading state.
export function useFetch(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  const load = useCallback(
    async (silent) => {
      if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await api(path);
        setState({ data, error: null, loading: false });
      } catch (err) {
        setState({ data: null, error: err, loading: false });
      }
    },
    [path]
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const reload = useCallback(() => load(true), [load]);
  return { ...state, reload };
}
