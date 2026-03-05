# 10 Color Themes + Profile Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace light/dark toggle with 10 self-contained color themes, add theme picker on a redesigned social-network-style profile page.

**Architecture:** Each theme defines CSS variables via `[data-theme="name"]` selectors in globals.css. Dark themes also add `.dark` class so all existing `dark:` Tailwind utilities keep working. ThemeProvider manages theme name in localStorage + applies data-attribute and class. Profile page gets hero card + tabs (Profile / Appearance / Security).

**Tech Stack:** CSS variables, Tailwind `dark:` prefix, React context, localStorage

---

### Task 1: Theme CSS variables in globals.css
- Replace `:root` / `.dark` with `[data-theme]` selectors for 10 themes
- Keep gradient utilities, update to use CSS variables where possible

### Task 2: Rewrite ThemeProvider
- Replace light/dark toggle with named theme system
- Export `setTheme(name)`, `theme` (current name), `themes` (list)
- Apply `data-theme` on `<html>`, toggle `.dark` class for dark themes

### Task 3: Update layout.tsx header
- Replace sun/moon toggle with theme-aware icon or keep simple toggle cycling light↔dark variant

### Task 4: Update root layout inline script
- Prevent flash: read theme from localStorage, apply `data-theme` + `dark` class before paint

### Task 5: Redesign profile page
- Hero card with gradient banner + avatar initials
- Tabs: Личные данные / Оформление / Безопасность
- Theme picker grid with live preview cards in Оформление tab
- Move existing forms into tab content
