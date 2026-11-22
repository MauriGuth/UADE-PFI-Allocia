import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/** Reload shared account data while visible and when returning from another device. */
export function useForegroundRefresh(refresh: () => Promise<unknown>, intervalMs = 30_000) {
  const latest = useRef(refresh);
  latest.current = refresh;
  useEffect(() => {
    let pending = false;
    const update = async () => {
      if (pending || AppState.currentState !== 'active') return;
      pending = true;
      try { await latest.current(); }
      catch { /* The screen owns its error message and retry state. */ }
      finally { pending = false; }
    };
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void update();
    });
    const timer = setInterval(() => { void update(); }, intervalMs);
    return () => { subscription.remove(); clearInterval(timer); };
  }, [intervalMs]);
}
