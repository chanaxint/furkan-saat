"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny persisted store: state in memory, mirrored to localStorage, shared by
 * every component through useSyncExternalStore. A `null` key keeps it in memory only. Used for the wishlist and the
 * cart until customer accounts exist — then `load`/`save` can talk to an API
 * and the hooks keep the same shape.
 */
export function createLocalStore<T>(key: string | null, initial: T) {
  let state = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  const load = () => {
    if (loaded || !key || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) state = JSON.parse(raw) as T;
    } catch {
      /* private mode or corrupted value: start empty */
    }
  };

  const set = (next: T) => {
    state = next;
    if (key)
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage unavailable: keep the in-memory state */
      }
    listeners.forEach((l) => l());
  };

  const subscribe = (l: () => void) => {
    listeners.add(l);
    // Keep tabs in sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      loaded = false;
      load();
      l();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  };

  const get = () => {
    load();
    return state;
  };

  /** Server render and first client render see `initial`, so hydration matches. */
  const useStore = () => useSyncExternalStore(subscribe, get, () => initial);

  return { get, set, useStore };
}
