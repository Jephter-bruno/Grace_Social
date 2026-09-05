import { useCallback, useRef, useState } from 'react';

type RefreshAction = () => void | Promise<void>;

/**
 * Shared pull-to-refresh state for screens backed by FlatList or ScrollView.
 * The short minimum duration keeps the gesture feedback visible even when a
 * screen only needs to re-render local state.
 */
export function usePullToRefresh(action?: RefreshAction) {
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);

  const onRefresh = useCallback(async () => {
    if (refreshingRef.current) return;

    refreshingRef.current = true;
    setRefreshing(true);
    const startedAt = Date.now();

    try {
      await action?.();
    } finally {
      const remaining = Math.max(0, 500 - (Date.now() - startedAt));
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }, [action]);

  return { refreshing, onRefresh };
}