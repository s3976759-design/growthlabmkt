import { useEffect, useState, useCallback } from "react";

// ===== Config (mirrors "Thiết lập file") =====
export const PLANNER_CONFIG = {
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
} as const;

// ===== Types =====
export interface PlannerRow {
  id: string;
  title: string;          // TIÊU ĐỀ / NỘI DUNG CHÍNH
  assignee: string;       // NGƯỜI THỰC HIỆN
  status: string;         // TRẠNG THÁI
  contentType: string;    // LOẠI NỘI DUNG
  platform: string;       // NỀN TẢNG
  format: string;         // ĐỊNH DẠNG
  goal: string;           // MỤC TIÊU
  demoDate?: string;      // NGÀY CÓ DEMO (yyyy-mm-dd)
  demoTime?: string;      // GIỜ CÓ DEMO
  postDate?: string;      // NGÀY ĐĂNG
  postTime?: string;      // GIỜ ĐĂNG
  body?: string;          // NỘI DUNG
  hashtag?: string;
  assetLink?: string;
  note?: string;
  views?: number;         // SỐ LƯỢT XEM
  interactions?: number;  // SỐ LƯỢT TƯƠNG TÁC
  shares?: number;
  saves?: number;
  recordedAt?: string;    // NGÀY GHI LẠI
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

export function emptyRow(): PlannerRow {
  return {
    id: pid(),
    title: "",
    assignee: PLANNER_CONFIG.assignees[0],
    status: PLANNER_CONFIG.statuses[0],
    contentType: PLANNER_CONFIG.contentTypes[0],
    platform: PLANNER_CONFIG.platforms[0],
    format: PLANNER_CONFIG.formats[0],
    goal: PLANNER_CONFIG.goals[0],
    createdAt: Date.now(),
  };
}

export function isPosted(r: PlannerRow) {
  return r.status === "✅ Đã đăng";
}
