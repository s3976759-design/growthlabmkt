import { useEffect, useState, useCallback } from "react";

export type Platform = "Facebook" | "Instagram" | "TikTok" | "LinkedIn" | "Threads" | "YouTube";
export type Format = "Reel" | "Post" | "Story" | "Carousel" | "Video" | "Article" | "Live";
export type Industry = "Food" | "Healthcare" | "Beauty" | "Tech" | "Education" | "Lifestyle" | "Finance" | "Other";
export type Goal = "Reach" | "Engagement" | "Conversion" | "Awareness" | "Retention";
export type Status = "idea" | "draft" | "scheduled" | "posted";

export interface Idea {
  id: string;
  title: string;
  note: string;
  type: "insight" | "idea" | "trend";
  industry: Industry;
  format: Format;
  createdAt: number;
}

export interface ContentItem {
  id: string;
  title: string;
  caption: string;
  hashtags?: string;
  versions: { id: string; caption: string; createdAt: number }[];
  status: string;
  platform: string;
  format: string;
  goal: string;
  contentType?: string;
  assignee?: string;
  demoDate?: string;
  demoTime?: string;
  postDate?: string;
  postTime?: string;
  scheduledAt?: number;
  postedAt?: number;
  ideaId?: string;
  score?: number; // 1..5
  metrics?: {
    reach: number;
    engagement: number; // likes+comments
    saves: number;
    shares: number;
  };
  createdAt: number;
}

export interface SwipeFile {
  id: string;
  text: string;
  source: string;
  tag: string;
  createdAt: number;
}

export interface Experiment {
  id: string;
  name: string;
  variantA: string;
  variantB: string;
  result?: "A" | "B" | "tie";
  notes?: string;
  createdAt: number;
}

const KEYS = {
  ideas: "gl_ideas",
  contents: "gl_contents",
  swipes: "gl_swipes",
  experiments: "gl_experiments",
  goal: "gl_weekly_goal",
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

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("gl-storage", { detail: { key } }));
}

function useStored<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  useEffect(() => {
    setState(read<T>(key, initial));
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ key: string }>;
      if (ce.detail?.key === key) setState(read<T>(key, initial));
    };
    window.addEventListener("gl-storage", handler);
    return () => window.removeEventListener("gl-storage", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setState((prev) => {
        const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        write(key, value);
        return value;
      });
    },
    [key]
  );

  return [state, update] as const;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function useIdeas() {
  return useStored<Idea[]>(KEYS.ideas, []);
}
export function useContents() {
  return useStored<ContentItem[]>(KEYS.contents, []);
}
export function useSwipes() {
  return useStored<SwipeFile[]>(KEYS.swipes, []);
}
export function useExperiments() {
  return useStored<Experiment[]>(KEYS.experiments, []);
}
export function useWeeklyGoal() {
  return useStored<number>(KEYS.goal, 5);
}

export function engagementRate(item: ContentItem): number {
  const m = item.metrics;
  if (!m || !m.reach) return 0;
  return ((m.engagement + m.saves + m.shares) / m.reach) * 100;
}
