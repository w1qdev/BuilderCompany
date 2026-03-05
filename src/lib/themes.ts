export interface ThemeDefinition {
  id: string;
  name: string;
  /** Internal flag — adds .dark class for Tailwind dark: utilities */
  _needsDarkClass: boolean;
  preview: {
    bg: string;
    primary: string;
    card: string;
    text: string;
  };
}

export const themes: ThemeDefinition[] = [
  // ===== LIGHT THEMES =====
  {
    id: "warm-orange",
    name: "Тёплый апельсин",
    _needsDarkClass: false,
    preview: { bg: "#FFF8F0", primary: "#E87A2E", card: "#FFFFFF", text: "#2D1B0E" },
  },
  {
    id: "ocean",
    name: "Океан",
    _needsDarkClass: false,
    preview: { bg: "#F0F7FF", primary: "#2563EB", card: "#FFFFFF", text: "#0F1729" },
  },
  {
    id: "emerald",
    name: "Изумруд",
    _needsDarkClass: false,
    preview: { bg: "#F0FDF5", primary: "#10B981", card: "#FFFFFF", text: "#0A2918" },
  },
  {
    id: "lavender",
    name: "Лаванда",
    _needsDarkClass: false,
    preview: { bg: "#F8F0FF", primary: "#8B5CF6", card: "#FFFFFF", text: "#1A0A2E" },
  },
  {
    id: "sunset",
    name: "Закат",
    _needsDarkClass: false,
    preview: { bg: "#FFF5F5", primary: "#E11D48", card: "#FFFFFF", text: "#2D0A14" },
  },
  {
    id: "sky",
    name: "Небо",
    _needsDarkClass: false,
    preview: { bg: "#F0F9FF", primary: "#0EA5E9", card: "#FFFFFF", text: "#0C2D48" },
  },
  {
    id: "coral",
    name: "Коралл",
    _needsDarkClass: false,
    preview: { bg: "#FFF7F0", primary: "#F97316", card: "#FFFFFF", text: "#431407" },
  },
  {
    id: "mint",
    name: "Мята",
    _needsDarkClass: false,
    preview: { bg: "#F0FDFA", primary: "#14B8A6", card: "#FFFFFF", text: "#042F2E" },
  },
  {
    id: "rose",
    name: "Роза",
    _needsDarkClass: false,
    preview: { bg: "#FFF1F2", primary: "#F43F5E", card: "#FFFFFF", text: "#4C0519" },
  },
  {
    id: "sand",
    name: "Песок",
    _needsDarkClass: false,
    preview: { bg: "#FEFCE8", primary: "#CA8A04", card: "#FFFFFF", text: "#422006" },
  },
  {
    id: "steel",
    name: "Сталь",
    _needsDarkClass: false,
    preview: { bg: "#F1F5F9", primary: "#6366F1", card: "#FFFFFF", text: "#1E1B4B" },
  },

  // ===== DARK THEMES =====
  {
    id: "dark-chocolate",
    name: "Тёмный шоколад",
    _needsDarkClass: true,
    preview: { bg: "#2D1B0E", primary: "#E87A2E", card: "#3D2B1A", text: "#F5E6D3" },
  },
  {
    id: "deep-ocean",
    name: "Глубокий океан",
    _needsDarkClass: true,
    preview: { bg: "#0F1729", primary: "#3B82F6", card: "#1A2744", text: "#D4E3F5" },
  },
  {
    id: "night-forest",
    name: "Ночной лес",
    _needsDarkClass: true,
    preview: { bg: "#0A2918", primary: "#34D399", card: "#133A26", text: "#D1F5E4" },
  },
  {
    id: "midnight",
    name: "Полночь",
    _needsDarkClass: true,
    preview: { bg: "#1A0A2E", primary: "#A78BFA", card: "#271444", text: "#E0D4F5" },
  },
  {
    id: "graphite",
    name: "Графит",
    _needsDarkClass: true,
    preview: { bg: "#181B20", primary: "#64748B", card: "#1E2228", text: "#CBD5E1" },
  },
  {
    id: "obsidian",
    name: "Обсидиан",
    _needsDarkClass: true,
    preview: { bg: "#0A0A0A", primary: "#F5F5F5", card: "#171717", text: "#E5E5E5" },
  },
  {
    id: "aurora",
    name: "Аврора",
    _needsDarkClass: true,
    preview: { bg: "#0F172A", primary: "#38BDF8", card: "#1E293B", text: "#BAE6FD" },
  },
  {
    id: "crimson-night",
    name: "Рубин",
    _needsDarkClass: true,
    preview: { bg: "#1C0F0F", primary: "#EF4444", card: "#2A1717", text: "#FCA5A5" },
  },
  {
    id: "cyber",
    name: "Неон",
    _needsDarkClass: true,
    preview: { bg: "#0D1117", primary: "#22D3EE", card: "#161B22", text: "#A5F3FC" },
  },
  {
    id: "plum",
    name: "Слива",
    _needsDarkClass: true,
    preview: { bg: "#1A0B2E", primary: "#D946EF", card: "#2E1065", text: "#F0ABFC" },
  },
  {
    id: "mocha",
    name: "Корица",
    _needsDarkClass: true,
    preview: { bg: "#1E1510", primary: "#D4A574", card: "#2C2018", text: "#E8D5C4" },
  },
  {
    id: "nord",
    name: "Арктика",
    _needsDarkClass: true,
    preview: { bg: "#2E3440", primary: "#88C0D0", card: "#3B4252", text: "#D8DEE9" },
  },
];

export const lightThemes = themes.filter((t) => !t._needsDarkClass);
export const darkThemes = themes.filter((t) => t._needsDarkClass);
export const DARK_CLASS_THEMES = darkThemes.map((t) => t.id);
export const DEFAULT_THEME = "warm-orange";

export function getTheme(id: string): ThemeDefinition {
  return themes.find((t) => t.id === id) || themes[0];
}
