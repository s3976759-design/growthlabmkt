import { useEffect, useState, useCallback } from "react";

export type Lang = "vi" | "en" | "zh";

const KEY = "gl_lang";

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

  // Common
  "common.save": { vi: "Lưu", en: "Save", zh: "保存" },
  "common.cancel": { vi: "Hủy", en: "Cancel", zh: "取消" },
  "common.delete": { vi: "Xoá", en: "Delete", zh: "删除" },
  "common.edit": { vi: "Sửa", en: "Edit", zh: "编辑" },
  "common.rename": { vi: "Đổi tên", en: "Rename", zh: "重命名" },
  "common.add": { vi: "Thêm", en: "Add", zh: "添加" },
  "common.search": { vi: "Tìm...", en: "Search...", zh: "搜索..." },
  "common.open": { vi: "Mở", en: "Open", zh: "打开" },
  "common.close": { vi: "Đóng", en: "Close", zh: "关闭" },
  "common.confirm": { vi: "Xác nhận", en: "Confirm", zh: "确认" },
  "common.unlock": { vi: "Mở khoá", en: "Unlock", zh: "解锁" },
  "common.password": { vi: "Mật khẩu", en: "Password", zh: "密码" },

  // Greeting
  "greeting.hello": { vi: "Xin chào", en: "Hello", zh: "你好" },
  "dash.today": { vi: "Hôm nay", en: "Today", zh: "今天" },

  // Settings
  "settings.title": { vi: "Settings", en: "Settings", zh: "设置" },
  "settings.account": { vi: "Tài khoản", en: "Account", zh: "账户" },
  "settings.share": { vi: "Chia sẻ workflow", en: "Share workflow", zh: "共享" },
  "settings.sound": { vi: "Âm thanh tập trung", en: "Focus sound", zh: "专注音效" },
  "settings.hub": { vi: "Hub", en: "Hub", zh: "资料库" },
  "settings.displayName": { vi: "Tên hiển thị", en: "Display name", zh: "显示名" },
  "settings.email": { vi: "Email", en: "Email", zh: "邮箱" },

  // Hub
  "hub.title": { vi: "Mọi tài liệu, một nơi.", en: "Everything in one place.", zh: "所有资料，一处管理。" },
  "hub.upload": { vi: "Tải file lên", en: "Upload file", zh: "上传文件" },
  "hub.newFolder": { vi: "Thư mục mới", en: "New folder", zh: "新建文件夹" },
  "hub.addLink": { vi: "Thêm link", en: "Add link", zh: "添加链接" },
  "hub.dropzone": { vi: "Kéo thả file vào đây hoặc bấm Tải lên", en: "Drop files here or click Upload", zh: "拖放文件或点击上传" },
  "hub.locked": { vi: "Hub đang được bảo vệ bằng mật khẩu", en: "Hub is password protected", zh: "资料库已加密保护" },
  "hub.empty": { vi: "Chưa có gì ở đây.", en: "Nothing here yet.", zh: "暂无内容。" },

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
  "sidebar.tagline": { vi: "Đừng làm content mù mờ. Đo, học, lặp lại.", en: "No blind content. Measure, learn, iterate.", zh: "不做盲目内容。测量、学习、迭代。" },

  // Dashboard
  "dash.eyebrow": { vi: "Tuần này", en: "This week", zh: "本周" },
  "dash.title": { vi: "Lab của bạn hôm nay.", en: "Your lab today.", zh: "今天的实验室。" },
  "dash.desc": { vi: "Theo dõi nhịp content, biến số liệu thành quyết định.", en: "Track your content cadence — turn data into decisions.", zh: "把握内容节奏，让数据成为决策。" },
  "dash.write": { vi: "Viết bài mới", en: "Write new post", zh: "撰写新内容" },
  "dash.addIdea": { vi: "Thêm ý tưởng", en: "Add idea", zh: "添加灵感" },
  "dash.quickLinks": { vi: "Quick links", en: "Quick links", zh: "快捷入口" },
  "dash.weeklyGoal": { vi: "Weekly Goal", en: "Weekly Goal", zh: "周目标" },
  "dash.posts": { vi: "bài", en: "posts", zh: "篇" },
  "dash.topPerforming": { vi: "Top performing", en: "Top performing", zh: "表现最佳" },
  "dash.viewAll": { vi: "Xem tất cả", en: "View all", zh: "查看全部" },

  // Settings tabs/sections
  "settings.eyebrow": { vi: "Cấu hình", en: "Configuration", zh: "配置" },
  "settings.desc": { vi: "Tài khoản, âm thanh tập trung, mật khẩu Hub.", en: "Account, focus sound, Hub password.", zh: "账户、专注音效、资料库密码。" },
  "settings.account.desc": { vi: "Tên hiển thị này sẽ xuất hiện ở dashboard.", en: "This display name appears on the dashboard.", zh: "此显示名将出现在仪表盘。" },
  "settings.sound.title": { vi: "Focus sound", en: "Focus sound", zh: "专注音效" },
  "settings.hub.title": { vi: "Mật khẩu Hub", en: "Hub password", zh: "资料库密码" },

  // Page headers (eyebrow/title/desc per route)
  "brain.eyebrow": { vi: "Content Brain", en: "Content Brain", zh: "内容灵感" },
  "brain.title": { vi: "Idea database, không phải note.", en: "Idea database, not notes.", zh: "灵感数据库，而非笔记。" },
  "brain.desc": { vi: "Mọi insight, trend, ý tưởng đều có chỗ. Tag rõ ngành & format để biến thành content có chủ đích.", en: "Every insight, trend, and idea has a place. Tag by industry & format to turn them into intentional content.", zh: "每个洞察、趋势与灵感都有归处。按行业与形式打标签，让内容更有目的。" },

  "plan.eyebrow": { vi: "Content Planner", en: "Content Planner", zh: "内容计划" },
  "plan.title": { vi: "Toàn bộ workflow content, một file duy nhất.", en: "Your full content workflow in one file.", zh: "完整内容工作流，集中一处。" },
  "plan.desc": { vi: "Kế hoạch · Lịch · Công việc · Tổng quan · Sample · Thiết lập.", en: "Plan · Calendar · Tasks · Overview · Sample · Settings.", zh: "计划 · 日历 · 任务 · 概览 · 样例 · 设置。" },

  "execute.eyebrow": { vi: "Content Execution", en: "Content Execution", zh: "内容执行" },
  "execute.title.new": { vi: "Viết bài mới.", en: "Write a new post.", zh: "撰写新内容。" },
  "execute.title.edit": { vi: "Tinh chỉnh bài viết.", en: "Refine the post.", zh: "润色内容。" },
  "execute.desc": { vi: "Caption, mục tiêu, version. Sạch sẽ. Không phân tâm.", en: "Caption, goal, version. Clean. Distraction-free.", zh: "文案、目标、版本。整洁，无干扰。" },

  "aiwriter.eyebrow": { vi: "AI Draft Writer", en: "AI Draft Writer", zh: "AI 草稿" },
  "aiwriter.title": { vi: "Ý tưởng → Bản nháp, trong 10 giây.", en: "Idea → Draft in 10 seconds.", zh: "灵感 → 草稿，10 秒生成。" },
  "aiwriter.desc": { vi: "Điền brief, AI viết hook, caption hoặc script, đề xuất CTA & hashtag. Lưu thẳng vào Content Planner.", en: "Fill the brief — AI writes hooks, captions or scripts and suggests CTAs & hashtags. Save straight to the Planner.", zh: "填写简报，AI 生成钩子、文案或脚本，并推荐 CTA 与话题标签。" },

  "track.eyebrow": { vi: "Performance Tracker", en: "Performance Tracker", zh: "数据追踪" },
  "track.title": { vi: "Số liệu là sự thật.", en: "Numbers tell the truth.", zh: "数据即真相。" },
  "track.desc": { vi: "Nhập reach, engagement, saves, shares. Lab tự tính ER và tìm bài top.", en: "Log reach, engagement, saves, shares. The lab computes ER and finds your top posts.", zh: "记录触达、互动、收藏、分享。Lab 自动计算 ER 并挑出 TOP。" },

  "review.eyebrow": { vi: "Weekly Review", en: "Weekly Review", zh: "周复盘" },
  "review.title": { vi: "Nhìn lại để đi xa hơn.", en: "Reflect to go further.", zh: "复盘以行远。" },
  "review.desc": { vi: "Lab đọc số liệu của bé và rút ra điều quan trọng nhất.", en: "The lab reads your numbers and surfaces what matters most.", zh: "Lab 解读你的数据，并提炼最关键的洞察。" },

  "hub.eyebrow": { vi: "Document Hub", en: "Document Hub", zh: "资料库" },
  "hub.titlePage": { vi: "Mọi tài liệu, một nơi.", en: "Everything in one place.", zh: "所有资料，一处管理。" },
  "hub.desc": { vi: "File, link, và folder có thể đổi tên. Bật mật khẩu trong Settings → Hub.", en: "Files, links and folders — all renamable. Enable password in Settings → Hub.", zh: "文件、链接、文件夹皆可重命名。在 设置 → 资料库 中启用密码。" },
} as const;

export type DictKey = keyof typeof dict;

function readLang(): Lang {
  if (typeof window === "undefined") return "vi";
  const v = localStorage.getItem(KEY);
  return v === "en" || v === "zh" || v === "vi" ? v : "vi";
}

export function useLanguage() {
  const [lang, setLang] = useState<Lang>("vi");
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
  return useCallback((k: DictKey) => dict[k]?.[lang] ?? dict[k]?.vi ?? k, [lang]);
}
