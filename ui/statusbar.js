// ui/statusbar.js
import { eventBus } from "../core/event-bus.js";
import { storage } from "../core/storage.js";
import { getTheme, applyTheme } from "../core/theme.js";

/**
 * Statusbar renderer:
 * - flat children inside #app-status (no inner wrappers)
 * - theme button shows only current theme name
 * - middle chunk is .status-flex (shrinks with ellipsis on small screens)
 */

let currentQuery = "";
let lastSavedAt = null;

const THEME_LABELS = {
  light: "Light",
  sea: "Sea",
  dark: "Dark",
  system: "System",
};

function escapeHtml(s = "") {
  return s.replace(
    /[&<>"']/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[ch])
  );
}

function getStats() {
  const d = storage.get() || { pages: [] };
  const curIdx = d.currentPageIndex || 0;
  const page = d.pages[curIdx];

  const pagesTotal = d.pages?.length || 0;
  const sectionsCount = page ? Object.keys(page.sections || {}).length : 0;

  let linksCount = 0;
  if (page && page.sections) {
    for (const id of Object.keys(page.sections)) {
      linksCount += (page.sections[id]?.buttons || []).length;
    }
  }
  return { pagesTotal, curIdx, sectionsCount, linksCount };
}

function formatAgo(ts) {
  if (!ts) return "—";
  const s = Math.floor((Date.now() - ts.getTime()) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function currentThemeLabel() {
  const t = getTheme() || "system";
  return THEME_LABELS[t] || t;
}

export function renderStatusBar() {
  const el = document.getElementById("app-status");
  if (!el) return;

  const { pagesTotal, curIdx, sectionsCount, linksCount } = getStats();
  const savedText = formatAgo(lastSavedAt);

  // ВАЖНО: без внутренних контейнеров — дети напрямую внутри #app-status
  el.innerHTML = `
    <div class="status-flex" title="Counts on current page">
      <span>Page ${pagesTotal ? curIdx + 1 : 0}/${pagesTotal}</span>
      <span class="divider">•</span>
      <span>Sections: ${sectionsCount}</span>
      <span class="divider">•</span>
      <span>Links: ${linksCount}</span>
      ${
        currentQuery
          ? `<span class="divider">•</span><span>Search: “${escapeHtml(
              currentQuery
            )}”</span>`
          : ""
      }
    </div>

    <span class="saved" title="Last local save time">Saved ${savedText}</span>

    <button class="status-theme-btn" type="button" aria-label="Toggle theme (Alt+T)" title="Toggle theme (Alt+T)">
      ${currentThemeLabel()}
    </button>
  `;

  // Переключение темы кликом по кнопке
  el.querySelector(".status-theme-btn")?.addEventListener("click", () => {
    const order = ["system", "light", "sea", "dark"];
    const cur = getTheme() || "system";
    const next = order[(order.indexOf(cur) + 1) % order.length];
    applyTheme(next);
    // на случай, если theme.js не эмитит событие
    eventBus.emit("ui:theme:changed", { mode: next });
  });
}

export function initStatusBar() {
  // гарантируем контейнер
  let el = document.getElementById("app-status");
  if (!el) {
    const root = document.getElementById("linkapp-root") || document.body;
    el = document.createElement("div");
    el.id = "app-status";
    el.className = "app-status";
    root.appendChild(el);
  }

  // первый рендер
  renderStatusBar();

  // подписки → перерисовка
  const rerender = () => renderStatusBar();

  eventBus.on("storage:loaded", rerender);
  eventBus.on("storage:updated", () => {
    lastSavedAt = new Date();
    rerender();
  });

  eventBus.on("pages:switched", rerender);
  eventBus.on("pages:added", rerender);
  eventBus.on("pages:deleted", rerender);

  eventBus.on("search:query", ({ q }) => {
    currentQuery = (q || "").trim();
    rerender();
  });
  eventBus.on("search:clear", () => {
    currentQuery = "";
    rerender();
  });

  // тема
  eventBus.on("ui:theme:changed", rerender);
  eventBus.on("theme:changed", rerender);
}
