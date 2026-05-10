import { useEffect, useState, useCallback } from "react";

export type Lang = "vi" | "en" | "zh";

const KEY = "gl_lang";

// All Vietnamese entries are intentionally English too — the product UI is
// English-only by request. The switcher remains for zh; vi falls back to en.
const dict = {
  // Sidebar / nav
  "nav.dashboard": { vi: "Dashboard", en: "Dashboard", zh: "仪表盘" },
  "nav.brain": { vi: "Brain", en: "Brain", zh: "灵感库" },
  "nav.plan": { vi: "Plan", en: "Plan", zh: "计划" },
  "nav.execute": { vi: "Execute", en: "Execute", zh: "执行" },
  "nav.aiwriter": { vi: "AI Writer", en: "AI Writer", zh: "AI 写作" },
  "nav.track": { vi: "Track", en: "Track", zh: "追踪" },
  "nav.review": { vi: "Review", en: "Review", zh: "复盘" },
  "nav.hub": { vi: "Hub", en: "Hub", zh: "资料库" },
  "nav.settings": { vi: "Settings", en: "Settings", zh: "设置" },
  "nav.pipeline": { vi: "Pipeline", en: "Pipeline", zh: "流水线" },

  // Common
  "common.save": { vi: "Save", en: "Save", zh: "保存" },
  "common.cancel": { vi: "Cancel", en: "Cancel", zh: "取消" },
  "common.delete": { vi: "Delete", en: "Delete", zh: "删除" },
  "common.edit": { vi: "Edit", en: "Edit", zh: "编辑" },
  "common.rename": { vi: "Rename", en: "Rename", zh: "重命名" },
  "common.add": { vi: "Add", en: "Add", zh: "添加" },
  "common.search": { vi: "Search...", en: "Search...", zh: "搜索..." },
  "common.open": { vi: "Open", en: "Open", zh: "打开" },
  "common.close": { vi: "Close", en: "Close", zh: "关闭" },
  "common.confirm": { vi: "Confirm", en: "Confirm", zh: "确认" },
  "common.unlock": { vi: "Unlock", en: "Unlock", zh: "解锁" },
  "common.password": { vi: "Password", en: "Password", zh: "密码" },

  // Greeting
  "greeting.hello": { vi: "Hello", en: "Hello", zh: "你好" },
  "dash.today": { vi: "Today", en: "Today", zh: "今天" },

  // Settings
  "settings.title": { vi: "Settings", en: "Settings", zh: "设置" },
  "settings.account": { vi: "Account", en: "Account", zh: "账户" },
  "settings.share": { vi: "Share workflow", en: "Share workflow", zh: "共享" },
  "settings.sound": { vi: "Focus sound", en: "Focus sound", zh: "专注音效" },
  "settings.hub": { vi: "Hub", en: "Hub", zh: "资料库" },
  "settings.displayName": { vi: "Display name", en: "Display name", zh: "显示名" },
  "settings.email": { vi: "Email", en: "Email", zh: "邮箱" },

  // Hub
  "hub.title": { vi: "Everything in one place.", en: "Everything in one place.", zh: "所有资料，一处管理。" },
  "hub.upload": { vi: "Upload file", en: "Upload file", zh: "上传文件" },
  "hub.newFolder": { vi: "New folder", en: "New folder", zh: "新建文件夹" },
  "hub.addLink": { vi: "Add link", en: "Add link", zh: "添加链接" },
  "hub.dropzone": { vi: "Drop files here or click Upload", en: "Drop files here or click Upload", zh: "拖放文件或点击上传" },
  "hub.locked": { vi: "Hub is password protected", en: "Hub is password protected", zh: "资料库已加密保护" },
  "hub.empty": { vi: "Nothing here yet.", en: "Nothing here yet.", zh: "暂无内容。" },

  // Top bar / page labels
  "page.dashboard": { vi: "Dashboard", en: "Dashboard", zh: "仪表盘" },
  "page.brain": { vi: "Content Brain", en: "Content Brain", zh: "内容灵感" },
  "page.plan": { vi: "Content Planner", en: "Content Planner", zh: "内容计划" },
  "page.execute": { vi: "Content Execution", en: "Content Execution", zh: "内容执行" },
  "page.aiwriter": { vi: "AI Draft Writer", en: "AI Draft Writer", zh: "AI 草稿" },
  "page.track": { vi: "Performance Tracker", en: "Performance Tracker", zh: "数据追踪" },
  "page.review": { vi: "Weekly Review", en: "Weekly Review", zh: "周复盘" },
  "page.hub": { vi: "Document Hub", en: "Document Hub", zh: "资料库" },
  "page.settings": { vi: "Settings", en: "Settings", zh: "设置" },

  // Sidebar
  "sidebar.workflow": { vi: "Workflow", en: "Workflow", zh: "工作流" },
  "sidebar.tagline": { vi: "No blind content. Measure, learn, iterate.", en: "No blind content. Measure, learn, iterate.", zh: "不做盲目内容。测量、学习、迭代。" },

  // Dashboard
  "dash.eyebrow": { vi: "This week", en: "This week", zh: "本周" },
  "dash.title": { vi: "Your lab today.", en: "Your lab today.", zh: "今天的实验室。" },
  "dash.desc": { vi: "Track your content cadence — turn data into decisions.", en: "Track your content cadence — turn data into decisions.", zh: "把握内容节奏，让数据成为决策。" },
  "dash.write": { vi: "Write new post", en: "Write new post", zh: "撰写新内容" },
  "dash.addIdea": { vi: "Add idea", en: "Add idea", zh: "添加灵感" },
  "dash.quickLinks": { vi: "Quick links", en: "Quick links", zh: "快捷入口" },
  "dash.weeklyGoal": { vi: "Weekly Goal", en: "Weekly Goal", zh: "周目标" },
  "dash.posts": { vi: "posts", en: "posts", zh: "篇" },
  "dash.topPerforming": { vi: "Top performing", en: "Top performing", zh: "表现最佳" },
  "dash.viewAll": { vi: "View all", en: "View all", zh: "查看全部" },

  // Settings tabs/sections
  "settings.eyebrow": { vi: "Configuration", en: "Configuration", zh: "配置" },
  "settings.desc": { vi: "Account, focus sound, Hub password.", en: "Account, focus sound, Hub password.", zh: "账户、专注音效、资料库密码。" },
  "settings.account.desc": { vi: "This display name appears on the dashboard.", en: "This display name appears on the dashboard.", zh: "此显示名将出现在仪表盘。" },
  "settings.sound.title": { vi: "Focus sound", en: "Focus sound", zh: "专注音效" },
  "settings.hub.title": { vi: "Hub password", en: "Hub password", zh: "资料库密码" },

  // Page headers
  "brain.eyebrow": { vi: "Content Brain", en: "Content Brain", zh: "内容灵感" },
  "brain.title": { vi: "Idea database, not notes.", en: "Idea database, not notes.", zh: "灵感数据库，而非笔记。" },
  "brain.desc": { vi: "Every insight, trend, and idea has a place. Tag by industry & format to turn them into intentional content.", en: "Every insight, trend, and idea has a place. Tag by industry & format to turn them into intentional content.", zh: "每个洞察、趋势与灵感都有归处。按行业与形式打标签，让内容更有目的。" },

  "plan.eyebrow": { vi: "Content Planner", en: "Content Planner", zh: "内容计划" },
  "plan.title": { vi: "Your full content workflow in one file.", en: "Your full content workflow in one file.", zh: "完整内容工作流，集中一处。" },
  "plan.desc": { vi: "Plan · Calendar · Tasks · Overview · Settings.", en: "Plan · Calendar · Tasks · Overview · Settings.", zh: "计划 · 日历 · 任务 · 概览 · 设置。" },

  "execute.eyebrow": { vi: "Content Execution", en: "Content Execution", zh: "内容执行" },
  "execute.title.new": { vi: "Write a new post.", en: "Write a new post.", zh: "撰写新内容。" },
  "execute.title.edit": { vi: "Refine the post.", en: "Refine the post.", zh: "润色内容。" },
  "execute.desc": { vi: "Caption, goal, version. Clean. Distraction-free.", en: "Caption, goal, version. Clean. Distraction-free.", zh: "文案、目标、版本。整洁，无干扰。" },

  "aiwriter.eyebrow": { vi: "AI Draft Writer", en: "AI Draft Writer", zh: "AI 草稿" },
  "aiwriter.title": { vi: "Idea → Draft in 10 seconds.", en: "Idea → Draft in 10 seconds.", zh: "灵感 → 草稿，10 秒生成。" },
  "aiwriter.desc": { vi: "Fill the brief — AI writes hooks, captions or scripts and suggests CTAs & hashtags. Save straight to the Planner.", en: "Fill the brief — AI writes hooks, captions or scripts and suggests CTAs & hashtags. Save straight to the Planner.", zh: "填写简报，AI 生成钩子、文案或脚本，并推荐 CTA 与话题标签。" },

  "track.eyebrow": { vi: "Performance Tracker", en: "Performance Tracker", zh: "数据追踪" },
  "track.title": { vi: "Numbers tell the truth.", en: "Numbers tell the truth.", zh: "数据即真相。" },
  "track.desc": { vi: "Log reach, engagement, saves, shares. The lab computes ER and finds your top posts.", en: "Log reach, engagement, saves, shares. The lab computes ER and finds your top posts.", zh: "记录触达、互动、收藏、分享。Lab 自动计算 ER 并挑出 TOP。" },

  "review.eyebrow": { vi: "Weekly Review", en: "Weekly Review", zh: "周复盘" },
  "review.title": { vi: "Reflect to go further.", en: "Reflect to go further.", zh: "复盘以行远。" },
  "review.desc": { vi: "The lab reads your numbers and surfaces what matters most.", en: "The lab reads your numbers and surfaces what matters most.", zh: "Lab 解读你的数据，并提炼最关键的洞察。" },

  "hub.eyebrow": { vi: "Document Hub", en: "Document Hub", zh: "资料库" },
  "hub.titlePage": { vi: "Everything in one place.", en: "Everything in one place.", zh: "所有资料，一处管理。" },
  "hub.desc": { vi: "Files, links and folders — all renamable. Enable password in Settings → Hub.", en: "Files, links and folders — all renamable. Enable password in Settings → Hub.", zh: "文件、链接、文件夹皆可重命名。在 设置 → 资料库 中启用密码。" },
} as const;

export type DictKey = keyof typeof dict;

function readLang(): Lang {
  if (typeof window === "undefined") return "en";
  const v = localStorage.getItem(KEY);
  return v === "en" || v === "zh" || v === "vi" ? v : "en";
}

export function useLanguage() {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    setLang(readLang());
    const h = () => setLang(readLang());
    window.addEventListener("gl-lang", h);
    return () => window.removeEventListener("gl-lang", h);
  }, []);
  const update = useCallback((next: Lang) => {
    localStorage.setItem(KEY, next);
    window.dispatchEvent(new CustomEvent("gl-lang"));
    setLang(next);
  }, []);
  return [lang, update] as const;
}

export function useT() {
  const [lang] = useLanguage();
  return useCallback((k: DictKey) => dict[k]?.[lang] ?? dict[k]?.en ?? k, [lang]);
}
