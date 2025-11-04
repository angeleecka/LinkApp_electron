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
let isDirty = false;
let statusMounted = false;

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

  // Кнопка может отсутствовать (десктоп) — не падаем
  const btn = document.querySelector("#app-status .status-view-btn");
  if (btn) {
    const grid = btn.querySelector(".ico-grid");
    const list = btn.querySelector(".ico-list");
    if (grid && list) {
      grid.style.display = m === "rows" ? "none" : "";
      list.style.display = m === "tiles" ? "none" : "";
    }
    const label = m === "rows" ? "Switch to tiles" : "Switch to list";
    btn.setAttribute("aria-label", label);
    btn.title = label;
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

function bindFlexScrolling(root) {
  const flex = root.querySelector(".status-flex");
  if (!flex) return;

  // wheel: вертикальное колесо → горизонтальный скролл
  flex.addEventListener(
    "wheel",
    (e) => {
      // если есть «горизонтальная» компонента, оставим как есть
      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      flex.scrollLeft += delta;
      e.preventDefault();
    },
    { passive: false }
  );

  // drag-to-scroll (pointer)
  let isDown = false,
    startX = 0,
    startLeft = 0;
  flex.addEventListener("pointerdown", (e) => {
    isDown = true;
    startX = e.clientX;
    startLeft = flex.scrollLeft;
    flex.setPointerCapture(e.pointerId);
    flex.style.cursor = "grabbing";
  });
  flex.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    flex.scrollLeft = startLeft - (e.clientX - startX);
  });
  const stop = (e) => {
    if (!isDown) return;
    isDown = false;
    flex.releasePointerCapture?.(e.pointerId);
    flex.style.cursor = "grab";
  };
  flex.addEventListener("pointerup", stop);
  flex.addEventListener("pointercancel", stop);

  // фейды по краям
  const update = () => {
    const atStart = flex.scrollLeft <= 1;
    const atEnd = flex.scrollLeft + flex.clientWidth >= flex.scrollWidth - 1;
    flex.classList.toggle("at-start", atStart);
    flex.classList.toggle("at-end", atEnd);
  };
  flex.addEventListener("scroll", update);
  window.addEventListener("resize", update);
  // первичный расчёт
  requestAnimationFrame(update);
}

function currentThemeLabel() {
  const t = getTheme() || "system";
  return THEME_LABELS[t] || t;
}

// Хелпер: проводка горизонтального скролла для .status-flex
function wireStatusFlex(rootEl) {
  const flex = rootEl.querySelector(".status-flex");
  if (!flex || flex.dataset.wired) return; // защита от повторной проводки
  flex.dataset.wired = "1";

  // Фейды по краям
  const updateFades = () => {
    const atStart = flex.scrollLeft <= 1;
    const atEnd = flex.scrollWidth - flex.clientWidth - flex.scrollLeft <= 1;
    flex.classList.toggle("at-start", atStart);
    flex.classList.toggle("at-end", atEnd);
  };
  flex.addEventListener("scroll", updateFades, { passive: true });
  updateFades();

  // Колесо мыши => горизонтальный скролл
  flex.addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey && Math.abs(e.deltaY) > 0) {
        e.preventDefault(); // важно: иначе страница будет скроллиться
        flex.scrollLeft += e.deltaY;
      }
    },
    { passive: false }
  );

  // Перетаскивание содержимого (pointer events)
  let dragging = false,
    startX = 0,
    startLeft = 0;
  flex.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = e.clientX;
    startLeft = flex.scrollLeft;
    flex.setPointerCapture(e.pointerId);
    flex.style.cursor = "grabbing";
  });
  flex.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    flex.scrollLeft = startLeft - (e.clientX - startX);
  });
  flex.addEventListener("pointerup", (e) => {
    dragging = false;
    flex.releasePointerCapture(e.pointerId);
    flex.style.cursor = "grab";
  });
}

function updateFlexOverflow() {
  const flex = document.querySelector("#app-status .status-flex");
  if (!flex) return;
  const atStart = flex.scrollLeft <= 1;
  const atEnd = flex.scrollLeft + flex.clientWidth >= flex.scrollWidth - 1;
  flex.classList.toggle("at-start", atStart);
  flex.classList.toggle("at-end", atEnd);
}

export function renderStatusBar() {
  const el = document.getElementById("app-status");
  if (!el) return;

  const { pagesTotal, curIdx, sectionsCount, linksCount } = getStats();
  const savedText = lastSavedAt ? formatAgo(lastSavedAt) : "—";
  const activeName = (storage.saves?.getActiveName?.() || "").trim();
  const mode = getViewMode(); // "tiles" | "rows"

  el.innerHTML = `
    <div class="status-flex" title="Scroll for more">
      ${
        activeName
          ? `<span class="ws-name" title="Workspace">${escapeHtml(
              activeName
            )}</span>
             <span class="vsep" aria-hidden="true"></span>`
          : ""
      }
      <span>Page ${pagesTotal ? curIdx + 1 : 0}/${pagesTotal}</span>
      <span class="vsep" aria-hidden="true"></span>
      <span>Sections: ${sectionsCount}</span>
      <span class="vsep" aria-hidden="true"></span>
      <span>Links: ${linksCount}</span>
      ${
        currentQuery
          ? `<span class="vsep" aria-hidden="true"></span>
             <span>Search: “${escapeHtml(currentQuery)}”</span>`
          : ""
      }
    </div>

    <span class="save-indicator" data-state="${isDirty ? "dirty" : "saved"}"
      title="${
        isDirty
          ? "Unsaved changes"
          : lastSavedAt
          ? `Saved ${formatAgo(lastSavedAt)}`
          : "Saved"
      }">
  <i class="dot" aria-hidden="true"></i>
</span>

    <button class="status-view-btn" type="button" aria-label="Toggle view">
      <svg class="ico-grid" viewBox="0 0 24 24" width="16" height="16" style="${
        mode === "rows" ? "display:none" : ""
      }">
        <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" fill="none" stroke="currentColor" stroke-width="2"/>
      </svg>
      <svg class="ico-list" viewBox="0 0 24 24" width="16" height="16" style="${
        mode === "tiles" ? "display:none" : ""
      }">
        <path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>

    <button class="status-theme-btn" type="button" aria-label="Toggle theme (Alt+T)" title="Toggle theme (Alt+T)">
      ${currentThemeLabel()}
    </button>
  `;

  // применим сохранённый режим и настроим скролл только середины
  applyViewMode(mode);
  wireStatusFlex(el);
}

// принять внешнее «установи вид»
eventBus.on("ui:view:set", ({ mode }) => {
  if (mode === "tiles" || mode === "rows") applyViewMode(mode);
});

// авто-правило: если мы НЕ compact и НЕ overlay, rows → tiles
eventBus.on("viewport:updated", ({ compact900, overlay }) => {
  if (!compact900 && !overlay && getViewMode() === "rows") {
    applyViewMode("tiles");
  }
});

export function initStatusBar() {
  if (statusMounted) return; // 🔒 защита от повторной инициализации
  statusMounted = true;
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

  // Поддерживаем фейды при скролле и ресайзе
  el.addEventListener(
    "scroll",
    (e) => {
      if (e.target.classList?.contains("status-flex")) updateFlexOverflow();
    },
    true
  );
  window.addEventListener("resize", updateFlexOverflow);

  // Делегирование кликов по кнопкам бара
  el.addEventListener("click", (e) => {
    if (e.target.closest(".status-view-btn")) {
      const next = getViewMode() === "tiles" ? "rows" : "tiles";
      applyViewMode(next);
      // Переключим иконки без перерендера
      const grid = el.querySelector(".status-view-btn .ico-grid");
      const list = el.querySelector(".status-view-btn .ico-list");
      if (grid && list) {
        grid.style.display = next === "rows" ? "none" : "";
        list.style.display = next === "tiles" ? "none" : "";
      }
    }

    if (e.target.closest(".status-theme-btn")) {
      const order = ["system", "light", "sea", "dark"];
      const cur = getTheme?.() || "system";
      const next = order[(order.indexOf(cur) + 1) % order.length];
      applyTheme?.(next);
      eventBus.emit("ui:theme:changed", { mode: next });
    }
  });

  // подписки → перерисовка
  const rerender = () => renderStatusBar();

  // Позволяем крутить колёсиком по горизонтали и тянуть «за контент» (трекпад/мышь)
  const mid = el.querySelector(".status-flex");
  if (mid) {
    // wheel: вертикальное колёсико -> горизонтальный скролл
    mid.addEventListener(
      "wheel",
      (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          mid.scrollLeft += e.deltaY;
        }
      },
      { passive: true }
    );

    // drag-to-scroll (простой «хэндлер» без выделения текста)
    let drag = false,
      startX = 0,
      startLeft = 0;
    mid.addEventListener("pointerdown", (e) => {
      drag = true;
      startX = e.clientX;
      startLeft = mid.scrollLeft;
      mid.setPointerCapture(e.pointerId);
    });
    mid.addEventListener("pointermove", (e) => {
      if (!drag) return;
      mid.scrollLeft = startLeft - (e.clientX - startX);
    });
    mid.addEventListener("pointerup", () => (drag = false));
    mid.addEventListener("pointercancel", () => (drag = false));
  }

  eventBus.on("storage:loaded", () => {
    isDirty = false;
    lastSavedAt = null;
    renderStatusBar();
  });

  eventBus.on("storage:updated", () => {
    isDirty = true;
    renderStatusBar();
  });

  eventBus.on("storage:saved", (payload = {}) => {
    lastSavedAt = new Date(payload.at || Date.now());
    isDirty = false;
    renderStatusBar();
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
