import { useCallback, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export type AlertView = 'portfolio' | 'opportunities';

// Owned by navigation, so unmounting the alerts screen cannot reset it.
// MainTabs is keyed by user ID: preferences never cross account boundaries.
export function useAlertView(userId: string): [AlertView, (view: AlertView) => void] {
  const key = `allocia.alert-view.v1.${userId}`;
  const [view, setView] = useState<AlertView>('portfolio');
  const revision = useRef(0);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    const startedAt = revision.current;
    void SecureStore.getItemAsync(key).then(saved => {
      // A tap or push received during restoration takes precedence.
      if (active && revision.current === startedAt && (saved === 'portfolio' || saved === 'opportunities')) setView(saved);
    }).catch(() => { /* Storage failure must not prevent navigation. */ });
    return () => { active = false; };
  }, [key]);
  const select = useCallback((next: AlertView) => {
    revision.current += 1;
    setView(next);
    // Preserve tap order even if native writes complete at different speeds.
    writes.current = writes.current.then(() => SecureStore.setItemAsync(key, next)).catch(() => {});
  }, [key]);
  return [view, select];
}
