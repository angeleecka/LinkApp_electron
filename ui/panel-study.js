// ui/panel-study.js
import { eventBus } from "../core/event-bus.js";

let mounted = false;
let scrimEl = null;

function cssNum(val, fallback) {
  const n = parseInt(String(val).trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

function syncHeaderH() {
  const h = document
    .getElementById("app-header")
    ?.getBoundingClientRect().height;
  if (h) {
    document.documentElement.style.setProperty(
      "--header-h",
      `${Math.round(h)}px`
    );
  }
}

function clearCompacts() {
  document.body.classList.remove("compact-1060", "compact-900");
  document.documentElement.style.removeProperty("--study-w");
}

//function clearCompacts() {
//  document.body.classList.remove("compact-1060", "compact-900");
//}

function updateStudyLayout() {
  syncHeaderH();

  const cs = getComputedStyle(document.documentElement);
  const appMin = cssNum(cs.getPropertyValue("--app-min"), 380);
  const studyMin = cssNum(cs.getPropertyValue("--study-min"), 280);
  const studyMax = cssNum(cs.getPropertyValue("--study-max"), 1600);
  const vw = window.innerWidth;

  const isOpen = document.body.classList.contains("with-study-panel");

  // --- 1) ширина панели и overlay ---
  let chosenW = 0;
  let overlay = false;

  if (isOpen) {
    const desired = vw - appMin; // хотим отдать панели всё, оставив минимум под LinkApp
    overlay = desired < studyMin; // если так нельзя — уходим в оверлей

    if (overlay) {
      chosenW = vw; // панель поверх всего
      document.body.classList.add("study-overlay");
    } else {
      document.body.classList.remove("study-overlay");
      chosenW = Math.max(studyMin, Math.min(studyMax, desired));
    }

    document.documentElement.style.setProperty(
      "--study-w",
      `${Math.round(chosenW)}px`
    );
  } else {
    // панель закрыта — на всякий случай сбросим её следы
    document.body.classList.remove("study-overlay");
    document.documentElement.style.removeProperty("--study-w");
  }

  // --- 2) доступная ширина для LinkApp ---
  const available = overlay
    ? vw // при overlay контент не сдвигаем
    : isOpen
    ? Math.max(0, vw - chosenW)
    : vw;

  // --- 3) compact-классы зависят ТОЛЬКО от available ---
  const was1060 = document.body.classList.contains("compact-1060");
  const was900 = document.body.classList.contains("compact-900");

  document.body.classList.toggle("compact-1060", available <= 1060);
  document.body.classList.toggle("compact-900", available <= 900);

  const now1060 = document.body.classList.contains("compact-1060");
  const now900 = document.body.classList.contains("compact-900");

  // --- 4) сообщим всем, что «режим вьюпорта» обновился (для автопереключения вида)
  eventBus.emit("viewport:updated", { compact900: now900, overlay });

  // Подправим скрим: показывать только при overlay+open
  if (scrimEl) scrimEl.hidden = !(isOpen && overlay);

  // Форсируем рефлоу для хедера, чтобы корректно схватился --header-h
  document.getElementById("app-header")?.getBoundingClientRect();
}

export function initStudyPanel() {
  if (mounted) return;
  const root = document.getElementById("linkapp-root");
  if (!root) return;

  const panel = document.createElement("aside");
  panel.id = "study-panel";
  panel.className = "study-panel";
  panel.innerHTML = `
    <div class="study-panel-header">
      <span class="study-title">Study Planner</span>
      <button class="study-close ui-icon-btn ui-icon-16" title="Close">✕</button>
    </div>
    <div class="study-panel-body">
      <div class="study-monthbar">
        <button class="nav prev" title="Prev month">◀</button>
        <span class="month-label">October 2025</span>
        <button class="nav next" title="Next month">▶</button>
      </div>
      <div class="study-weekgrid"></div>
    </div>
  `;
  root.appendChild(panel);

  // scrim (затемнение под панелью в overlay-режиме)
  scrimEl = document.createElement("div");
  scrimEl.className = "study-scrim";
  scrimEl.hidden = true; // СКРЫТО по умолчанию
  scrimEl.addEventListener("click", closeStudyPanel); // клик по фону закрывает
  root.appendChild(scrimEl);

  panel
    .querySelector(".study-close")
    ?.addEventListener("click", closeStudyPanel);

  // Управление через события

  eventBus.on("study:close", () => {
    closeStudyPanel();
  });

  eventBus.on("study:toggle", () => {
    const opening = !document.body.classList.contains("with-study-panel");
    document.body.classList.toggle("with-study-panel");
    if (opening) updateStudyLayout();
    else closeStudyPanel(); // централизованный сброс
  });

  // Горячая клавиша Alt+K
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.code === "KeyK") {
      eventBus.emit("study:toggle");
    }
  });

  mounted = true;

  // первый расчёт сразу после монтирования
  requestAnimationFrame(() => updateStudyLayout());

  // реагировать на изменение размеров ВСЕГДА, даже когда панель закрыта
  window.addEventListener("resize", updateStudyLayout, { passive: true });

  // (опционально, для мобильных) — после смены ориентации
  window.addEventListener("orientationchange", () => {
    // даём браузеру применить новые размеры
    setTimeout(updateStudyLayout, 0);
  });
}

export function openStudyPanel() {
  document.body.classList.add("with-study-panel");
  updateStudyLayout(); // ← ВАЖНО: сразу посчитать ширину
}
export function closeStudyPanel() {
  document.body.classList.remove("with-study-panel", "study-overlay");
  if (scrimEl) scrimEl.hidden = true;
  clearCompacts();
  syncHeaderH();
  // подсказка всему UI «переоценить» лэйаут
  window.dispatchEvent(new Event("resize"));
  updateStudyLayout();
}
