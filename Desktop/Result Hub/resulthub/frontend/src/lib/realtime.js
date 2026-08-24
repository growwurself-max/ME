import { useEffect, useRef } from 'react';

// Lightweight real-time sync across tabs and windows on the same origin.
// The backend is API-only (Firestore never runs on the client), so pages can't
// subscribe to Firestore snapshots. Instead every successful mutation broadcasts
// a change event, and pages refresh their data when they hear one. Focus/visibility
// changes and an optional low-frequency poll cover the gaps.

const CHANNEL_NAME = 'resulthub-data';

const localListeners = new Set();
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

if (channel) {
  channel.onmessage = (event) => {
    localListeners.forEach((fn) => fn(event.data));
  };
}

export function notifyDataChanged(payload) {
  const message = { source: Date.now(), ...(payload || {}) };
  localListeners.forEach((fn) => fn(message));
  if (channel) channel.postMessage(message);
}

export function subscribeDataChanged(fn) {
  localListeners.add(fn);
  return () => localListeners.delete(fn);
}

/**
 * Refresh data automatically when:
 *  - any data-change event is broadcast (same tab, other tabs, other windows),
 *  - the window regains focus or becomes visible,
 *  - `interval` (>0) has elapsed while the tab is visible (covers changes made
 *    on other devices that never trigger a local event).
 */
export function useDataSync(refresh, { interval = 0 } = {}) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    const unsubscribe = subscribeDataChanged(() => refreshRef.current());
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshRef.current();
    };
    const onFocus = () => refreshRef.current();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);

    let timer = null;
    if (interval > 0) {
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') refreshRef.current();
      }, interval);
    }

    return () => {
      unsubscribe();
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      if (timer) clearInterval(timer);
    };
  }, [interval]);
}