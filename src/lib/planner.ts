import { useEffect, useState, useCallback } from "react";

// ===== Default config (mirrors "Thiết lập file") =====
export const DEFAULT_CONFIG = {
  contentTypes: [
    "Giới thiệu sản phẩm",
    "Hướng dẫn sử dụng sản phẩm",
    "Khuyến mãi",
    "Video Demo",
    "Tips",
    "Giáo dục/ awareness",
    "Case lâm sàng",
    "Tăng trust",
    "Quy trình/ credibility",
    "So sánh/ trust",
    "So sánh/ Personal",
  ],
  platforms: [
    "🟢 Facebook",
    "🟡 TikTok",
    "🟠 Instagram",
    "🌎 Website",
    "🎬 YouTube",
    "💌 Email",
    "🟧 Shopee",
    "🟪 Lazada",
    "🟫 Tiki",
    "🟦 Zalo",
  ],
  statuses: [
    "💡 Lên ý tưởng",
    "✍️ Đang soạn thảo",
    "📝 Chờ phê duyệt",
    "🟢 Đã phê duyệt",
    "🛠️ Cần chỉnh sửa",
    "🗓️ Đã lên lịch",
    "✅ Đã đăng",
    "❌ Huỷ bỏ",
  ],
  formats: ["Bài viết", "Video dài", "Video ngắn", "Ảnh", "Email"],
  goals: ["Lượt xem", "Lượt yêu thích", "Lượt lưu lại", "Website visit"],
  assignees: ["Phạm Mai Anh"],
  weekStart: "Thứ hai",
};

export type PlannerConfig = typeof DEFAULT_CONFIG;
export type ConfigListKey = "contentTypes" | "platforms" | "statuses" | "formats" | "goals" | "assignees";

// Backwards-compat: a static reference that mirrors defaults. Components should
// prefer usePlannerConfig() so edits in Settings propagate everywhere.
export const PLANNER_CONFIG = DEFAULT_CONFIG;

// ===== Types =====
export interface PlannerRow {
  id: string;
  title: string;
  assignee: string;
  status: string;
  contentType: string;
  platform: string;
  format: string;
  goal: string;
  demoDate?: string;
  demoTime?: string;
  postDate?: string;
  postTime?: string;
  body?: string;
  hashtag?: string;
  assetLink?: string;
  note?: string;
  views?: number;
  interactions?: number;
  shares?: number;
  saves?: number;
  recordedAt?: string;
  createdAt: number;
}

export interface PlannerIdea {
  id: string;
  idea: string;
  contentType: string;
  platform: string;
  format: string;
  goal: string;
  inspiration?: string;
  note?: string;
  used: boolean;
  createdAt: number;
}

export interface PlannerPillar {
  id: string;
  pillar: string;
  goal: string;
  examples: string;
}

const KEYS = {
  rows: "gl_planner_rows",
  ideas: "gl_planner_ideas",
  pillars: "gl_planner_pillars",
  sample: "gl_planner_sample",
  config: "gl_planner_config_v1",
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
  window.dispatchEvent(new CustomEvent("gl-planner", { detail: { key } }));
}

function useStored<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  useEffect(() => {
    setState(read<T>(key, initial));
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ key: string }>;
      if (ce.detail?.key === key) setState(read<T>(key, initial));
    };
    window.addEventListener("gl-planner", handler);
    return () => window.removeEventListener("gl-planner", handler);
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

export const pid = () => Math.random().toString(36).slice(2, 10);

export function usePlannerRows() {
  return useStored<PlannerRow[]>(KEYS.rows, []);
}
export function usePlannerIdeas() {
  return useStored<PlannerIdea[]>(KEYS.ideas, []);
}
export function usePlannerPillars() {
  return useStored<PlannerPillar[]>(KEYS.pillars, []);
}
export function usePlannerSample() {
  return useStored<string>(KEYS.sample, "");
}

export function usePlannerConfig() {
  const [cfg, setCfg] = useStored<PlannerConfig>(KEYS.config, DEFAULT_CONFIG);
  // ensure all keys exist (forward-compat with future fields)
  const merged: PlannerConfig = { ...DEFAULT_CONFIG, ...cfg };
  const addOption = (k: ConfigListKey, value: string) => {
    const v = value.trim();
    if (!v) return;
    setCfg((p) => {
      const list = (p[k] ?? DEFAULT_CONFIG[k]) as string[];
      if (list.includes(v)) return p;
      return { ...p, [k]: [...list, v] };
    });
  };
  const updateOption = (k: ConfigListKey, idx: number, value: string) => {
    const v = value.trim();
    if (!v) return;
    setCfg((p) => {
      const list = [...((p[k] ?? DEFAULT_CONFIG[k]) as string[])];
      list[idx] = v;
      return { ...p, [k]: list };
    });
  };
  const removeOption = (k: ConfigListKey, idx: number) => {
    setCfg((p) => {
      const list = [...((p[k] ?? DEFAULT_CONFIG[k]) as string[])];
      list.splice(idx, 1);
      return { ...p, [k]: list };
    });
  };
  const setWeekStart = (v: string) => setCfg((p) => ({ ...p, weekStart: v }));
  const reset = () => setCfg(DEFAULT_CONFIG);
  return { config: merged, addOption, updateOption, removeOption, setWeekStart, reset };
}

export function emptyRow(cfg: PlannerConfig = DEFAULT_CONFIG): PlannerRow {
  return {
    id: pid(),
    title: "",
    assignee: cfg.assignees[0] ?? "",
    status: cfg.statuses[0] ?? "",
    contentType: cfg.contentTypes[0] ?? "",
    platform: cfg.platforms[0] ?? "",
    format: cfg.formats[0] ?? "",
    goal: cfg.goals[0] ?? "",
    createdAt: Date.now(),
  };
}

export function isPosted(r: PlannerRow) {
  return r.status === "✅ Đã đăng";
}
