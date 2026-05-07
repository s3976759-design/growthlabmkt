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
