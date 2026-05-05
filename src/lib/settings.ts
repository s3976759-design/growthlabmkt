import { useEffect, useState, useCallback } from "react";

export interface AccountSettings {
  displayName: string;
  email: string;
}

export interface BackgroundSettings {
  id: string;
  overlay: "light" | "dark" | "cream" | "none";
  overlayStrength: number; // 0..100
  blur: number; // 0..20 px
}

export interface SoundSettings {
  selectedId: string | null;
  volume: number; // 0..100
  loopForever: boolean;
}

export interface DataPrefs {
  reduceMotion: boolean;
  language: "vi" | "en";
}

const KEYS = {
  account: "gl_settings_account",
  bg: "gl_settings_bg",
  sound: "gl_settings_sound",
  data: "gl_settings_data",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
  window.dispatchEvent(new CustomEvent("gl-settings", { detail: { key } }));
}

function useStored<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  useEffect(() => {
    setState(read<T>(key, initial));
    const h = (e: Event) => {
      const ce = e as CustomEvent<{ key: string }>;
      if (ce.detail?.key === key) setState(read<T>(key, initial));
    };
    window.addEventListener("gl-settings", h);
    return () => window.removeEventListener("gl-settings", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setState((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        write(key, v);
        return v;
      });
    },
    [key],
  );
  return [state, update] as const;
}

export const useAccount = () =>
  useStored<AccountSettings>(KEYS.account, { displayName: "Anh", email: "" });

export const useBackground = () =>
  useStored<BackgroundSettings>(KEYS.bg, {
    id: "none",
    overlay: "cream",
    overlayStrength: 50,
    blur: 0,
  });

export const useSoundSettings = () =>
  useStored<SoundSettings>(KEYS.sound, { selectedId: null, volume: 50, loopForever: true });

export const useDataPrefs = () =>
  useStored<DataPrefs>(KEYS.data, { reduceMotion: false, language: "vi" });
