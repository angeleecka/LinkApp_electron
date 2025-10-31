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

const VIEW_KEY = "linkapp-view-mode";
function getViewMode() {
  return localStorage.getItem(VIEW_KEY) === "rows" ? "rows" : "tiles";
}
function applyViewMode(mode = "tiles") {
  const m = mode === "rows" ? "rows" : "tiles";
  document.documentElement.dataset.view = m;
  localStorage.setItem(VIEW_KEY, m);

  // Подпись и иконка на кнопке в статус-баре (если уже отрендерена)
  const btn = document.querySelector("#app-status .status-view-btn");
  if (btn) {
    btn.querySelector(".label").textContent = m === "rows" ? "List" : "Tiles";
  }
}

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
  const activeName = (storage.saves?.getActiveName?.() || "").trim();
  const themeLabel = (typeof getTheme === "function" && getTheme()) || "system";

  el.innerHTML = `
    <div class="status-flex" title="Counts on current page">
      <span>Page ${pagesTotal ? curIdx + 1 : 0}/${pagesTotal}</span>
      <span class="divider">•</span>
      <span>Sections: ${sectionsCount}</span>
      <span class="divider">•</span>
      <span>Links: ${linksCount}</span>
      ${
        activeName
          ? `<span class="divider">•</span><span class="active-name" title="Active workspace"> ${escapeHtml(
              activeName
            )}</span>`
          : ""
      }
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
      ${escapeHtml(themeLabel)}
    </button>
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

  <!-- NEW: переключатель вида -->
  <button class="status-view-btn" type="button" aria-label="Toggle view (Tiles/List)" title="Toggle view (Tiles/List)">
    <span class="label">Tiles</span>
    <span class="mi" aria-hidden="true" style="display:inline-flex;gap:6px;margin-left:6px;">
      <!-- Иконки не переключаем JS-ом, просто текст меняем; так проще -->
      <svg class="ico-grid" viewBox="0 0 24 24" width="16" height="16">
        <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" fill="none" stroke="currentColor" stroke-width="2"/>
      </svg>
      <svg class="ico-list" viewBox="0 0 24 24" width="16" height="16">
        <path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </span>
  </button>

  <button class="status-theme-btn" type="button" aria-label="Toggle theme (Alt+T)" title="Toggle theme (Alt+T)">
    ${currentThemeLabel()}
  </button>
  `;

  // Применим сохранённый режим и подпись
  applyViewMode(getViewMode());

  // Кнопка переключения вида
  el.querySelector(".status-view-btn")?.addEventListener("click", () => {
    const next = getViewMode() === "tiles" ? "rows" : "tiles";
    applyViewMode(next);
  });

  // Переключение темы кликом по кнопке
  el.querySelector(".status-theme-btn")?.addEventListener("click", () => {
    const order = ["system", "light", "sea", "dark"];
    const cur = (typeof getTheme === "function" && getTheme()) || "system";
    const next = order[(order.indexOf(cur) + 1) % order.length];
    if (typeof applyTheme === "function") applyTheme(next);
    eventBus.emit("ui:theme:changed", { mode: next }); // страховка
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
