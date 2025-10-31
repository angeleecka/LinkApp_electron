// =============================================================================
// MAIN.JS — Точка входа приложения -- изменялся!!!
// =============================================================================
// Что здесь:
// - Инициализация всех модулей приложения
// - Загрузка конфигурации и темы
// - Настройка глобальных обработчиков событий
// - Подключение платформенного адаптера (launcher)
// - Горячие клавиши (Alt+T для смены темы)
// =============================================================================

import { eventBus } from "./core/event-bus.js";
import { config } from "./core/config.js";
import { storage } from "./core/storage.js";
import { app } from "./core/app.js";

import { initModalService } from "./ui/modal-service.js";
import { initStatusBar } from "./ui/statusbar.js";

// Модули темы
import {
  initThemeFromStorage,
  getTheme,
  applyTheme,
  enableSystemWatcher,
} from "./core/theme.js";

// UI-модули
import { initUI } from "./ui/skeleton.js";
import { initHeader } from "./ui/header.js";
import { initPages } from "./ui/pages.js";
import { initButtons } from "./ui/buttons.js";
import { initSections } from "./ui/sections.js";
import { initPagination } from "./ui/pagination.js";
import { initHistory } from "./ui/history.js";
import { initToast } from "./ui/toast.js";
import { initStudyPanel } from "./ui/panel-study.js";

// Модули модалок
import { initAboutModal } from "./ui/modal-about.js";
import { initEditButtonModal } from "./ui/modals/modal-edit-button.js";
import { initEditSectionModal } from "./ui/modals/modal-edit-section.js";
import { initHistoryModal } from "./ui/modals/modal-history.js";
import { initConfirmModal } from "./ui/modals/modal-confirm.js";
import { initSettingsModal } from "./ui/modals/modal-settings.js";
//import { initSessionsModal } from "./ui/modal-sessions.js";
import { initSessionsModal } from "./ui/sessions-modal.js";

// Платформенный адаптер (для открытия ссылок)
import { launcher } from "./platform/launcher-web.js";

// =============================================================================
// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Bootstrapping LinkApp v2...");

  // ===== ШАГ 1: ЗАГРУЗКА КОНФИГУРАЦИИ =====
  config.load();
  console.log("✅ Config loaded");

  // ===== ШАГ 2: ИНИЦИАЛИЗАЦИЯ ТЕМЫ =====
  initThemeFromStorage();

  console.log("✅ Theme initialized");

  // ===== ШАГ 3: СОЗДАНИЕ КАРКАСА UI =====
  initUI("#linkapp-root");
  console.log("✅ UI skeleton created");

  // ===== ШАГ 4: ИНИЦИАЛИЗАЦИЯ СИСТЕМНЫХ МОДУЛЕЙ =====
  initToast(); // Система уведомлений
  storage.init(); // Загрузка данных из localStorage
  console.log("✅ Storage initialized");

  // ===== ШАГ 5: ИНИЦИАЛИЗАЦИЯ UI-МОДУЛЕЙ =====
  initModalService();
  initHeader(); // Шапка приложения
  initButtons(); // Логика кнопок-ссылок
  initSections(); // Логика секций
  initPages(); // Рендеринг страниц (запускает первый рендер)
  initPagination(); // Пагинатор страниц
  initHistory(); // Корзина удалений

  // ===== ШАГ 6: ИНИЦИАЛИЗАЦИЯ МОДАЛОК =====
  initAboutModal(); // Модалка "О приложении"
  initEditButtonModal(); // Модалка редактирования кнопки
  initEditSectionModal(); // Модалка редактирования секции
  initHistoryModal(); // Модалка истории удалений
  initConfirmModal(); // Универсальная модалка подтверждения
  initSettingsModal(); // Модалка настроек
  initSessionsModal();

  initStatusBar();
  initStudyPanel();

  // ===== ШАГ 7: ИНИЦИАЛИЗАЦИЯ CORE APP (если есть дополнительная логика) =====
  app.init();

  console.log("✅ LinkApp v2 fully initialized");
});

// =============================================================================
// ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ СОБЫТИЙ
// =============================================================================

// ===== ОТКРЫТИЕ ССЫЛОК ЧЕРЕЗ ПЛАТФОРМЕННЫЙ ЛАУНЧЕР =====
eventBus.on("link:open", ({ url, browser }) => {
  const choice = browser || config.get("defaultBrowser") || "system";
  launcher.openUrl(url, choice);
  console.log(`[main] Opening link: ${url} (browser: ${choice})`);
});

// ===== ЭКСПОРТ ДАННЫХ В JSON =====
eventBus.on("storage:exportJSON", () => {
  try {
    const jsonData = storage.exportJSON();
    if (!jsonData) return;

    // Создаём Blob и скачиваем файл
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `linkapp-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    eventBus.emit("ui:toast", {
      type: "success",
      message: "Data exported to JSON!",
    });

    console.log("[main] Data exported to JSON");
  } catch (err) {
    console.error("[main] Export failed:", err);
    eventBus.emit("ui:toast", {
      type: "error",
      message: "Export failed",
    });
  }
});

// ===== ИМПОРТ ДАННЫХ ИЗ JSON =====
eventBus.on("storage:importJSON", ({ fileContent }) => {
  const success = storage.importJSON(fileContent);
  if (success) {
    console.log("[main] Data imported from JSON");
  }
});

// ===== ЭКСПОРТ ДАННЫХ (кнопка "Save" в шапке) =====
eventBus.on("file:export", () => {
  eventBus.emit("storage:exportJSON");
});

// ===== ИМПОРТ ДАННЫХ (кнопка "Open" в шапке) =====
eventBus.on("file:import", () => {
  // Создаём input для выбора файла
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target.result;
      eventBus.emit("storage:importJSON", { fileContent });
    };
    reader.readAsText(file);
  });

  input.click();
});

// =============================================================================
// ГОРЯЧИЕ КЛАВИШИ
// =============================================================================

// ===== ALT+T — ПЕРЕКЛЮЧЕНИЕ ТЕМЫ =====
if (!window.__linkapp_themeHotkeyBound) {
  window.__linkapp_themeHotkeyBound = true;

  window.addEventListener("keydown", (e) => {
    // Alt+T — переключение темы (system → light → dark)
    if (e.altKey && (e.key === "t" || e.key === "T")) {
      e.preventDefault();

      const order = ["system", "light", "sea", "dark"];
      const cur = getTheme();
      const next = order[(order.indexOf(cur) + 1) % order.length];

      applyTheme(next);

      eventBus.emit("ui:toast", {
        type: "info",
        message: `Theme: ${next}`,
      });

      console.log(`[main] Theme switched to: ${next}`);
    }
  });

  console.log("✅ Hotkeys initialized (Alt+T for theme toggle)");
}
// хоткей Alt+P — открыть/закрыть панель
window.addEventListener("keydown", (e) => {
  if (
    e.altKey &&
    !e.ctrlKey &&
    !e.metaKey &&
    !e.shiftKey &&
    (e.key === "p" || e.key === "P")
  ) {
    e.preventDefault();
    eventBus.emit("study:toggle");
  }
});
// =============================================================================
// ОБНОВЛЕНИЕ СТАТУС-БАРА (тема)
// =============================================================================

/**
 * Обновить текст в статус-баре (показываем текущую тему)
 * @param {string} text - Текст для отображения
 */
function setStatus(text) {
  const statusBar = document.getElementById("app-status");
  if (statusBar) {
    statusBar.textContent = text;
  }
}

/**
 * Переключить тему по клику на статус-бар
 */
function cycleTheme() {
  const order = ["system", "light", "sea", "dark"];
  const cur = getTheme();
  const next = order[(order.indexOf(cur) + 1) % order.length];

  applyTheme(next);

  eventBus.emit("ui:toast", {
    type: "info",
    message: `Theme: ${next}`,
  });

  console.log(`[main] Theme cycled to: ${next}`);
}
