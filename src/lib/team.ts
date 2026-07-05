export type TeamMember = {
  username: string;
  displayName: string;
  role: string;
  isOwner?: boolean;
  sortOrder: number;
};

export const TEAM_ROSTER: TeamMember[] = [
  { username: "ViRus32_Org", displayName: "ویروس ۳۲", role: "مالک و بنیان‌گذار مجموعه", isOwner: true, sortOrder: 1 },
  { username: "Habibian_00", displayName: "محمد مهدی", role: "مسئول نظارت و مدیریت محتوای کانال‌ها", sortOrder: 10 },
  { username: "ArcoMion", displayName: "آرتین", role: "مسئول توسعه API و ربات‌های تلگرام", sortOrder: 20 },
  { username: "port10808", displayName: "محمدحسین", role: "مدیر و مسئول روابط عمومی", sortOrder: 30 },
  { username: "pound_iran", displayName: "ارشیا", role: "مسئول مدیریت سرورها، زیرساخت و سورس‌ها", sortOrder: 40 },
  { username: "MichaelOfficial273", displayName: "اوستا", role: "مسئول کانال پایگاه‌داده‌ها (Databases)", sortOrder: 50 },
  { username: "Singeleshah", displayName: "محمد", role: "مسئول مدیریت و توسعه پروژه‌های مجموعه", sortOrder: 60 },
  { username: "MMDtnt_m", displayName: "محمد", role: "مسئول مدیریت تارگت‌های مجموعه و کانال کانفیگ‌ها", sortOrder: 70 },
  { username: "SATANTOM", displayName: "دانیال", role: "مسئول ربات‌ها و سامانه‌های آپلود", sortOrder: 80 },
];

export const CYBER32_CHANNELS = [
  { name: "@Cyber32_config", label: "کانفیگ‌ها" },
  { name: "@Cyber32_DB", label: "دیتابیس‌ها" },
  { name: "@Cyber32_SRC", label: "سورس‌ کدها" },
  { name: "@IranWar_N", label: "اخبار جنگی" },
  { name: "@Cyber32_Gap", label: "گروه چت" },
];