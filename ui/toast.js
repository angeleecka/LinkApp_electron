// =============================================================================
// UI/TOAST.JS — Система всплывающих уведомлений
// =============================================================================
// Что здесь:
// - Показ уведомлений (success, error, warning, info)
// - Автоматическое исчезновение через 3 секунды
// - Возможность закрыть уведомление вручную (клик по крестику)
// - Очередь уведомлений (показываем по одному)
// =============================================================================

import { eventBus } from "../core/event-bus.js";

// Контейнер для уведомлений
let toastContainer = null;

// Очередь уведомлений
const toastQueue = [];
let isShowingToast = false;

// =============================================================================
// ПОКАЗАТЬ УВЕДОМЛЕНИЕ
// =============================================================================
/**
 * Показать всплывающее уведомление
 * @param {Object} data - Параметры уведомления
 * @param {string} data.type - Тип уведомления: 'success' | 'error' | 'warning' | 'info'
 * @param {string} data.message - Текст сообщения
 * @param {number} [data.duration] - Длительность показа в мс (по умолчанию 3000)
 */
function showToast(data) {
  const { type = "info", message = "", duration = 3000, action = null } = data;

  // Добавляем в очередь
  toastQueue.push({ type, message, duration, action });

  // Если уже показываем уведомление — ждём
  if (isShowingToast) return;

  // Показываем следующее уведомление из очереди
  processToastQueue();
}

// =============================================================================
// ОБРАБОТКА ОЧЕРЕДИ УВЕДОМЛЕНИЙ
// =============================================================================
/**
 * Показать следующее уведомление из очереди
 */
function processToastQueue() {
  // Если очередь пуста — выходим
  if (toastQueue.length === 0) {
    isShowingToast = false;
    return;
  }

  isShowingToast = true;

  // Берём первое уведомление из очереди
  const { type, message, duration, action } = toastQueue.shift();
  console.log("[toast] action:", action);

  // Создаём элемент уведомления
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  // Иконка в зависимости от типа
  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };
  const icon = icons[type] || icons.info;

  // HTML-содержимое уведомления
  toast.innerHTML = `
  <span class="toast-icon">${icon}</span>
  <span class="toast-message">${escapeHtml(message)}</span>
  <button class="toast-close" title="Close">✕</button>
`;

  // NEW — опциональная кнопка действия
  if (action && action.label && action.event) {
    const btn = document.createElement("button");
    btn.className = "toast-action";
    btn.textContent = action.label;
    btn.addEventListener("click", () => {
      eventBus.emit(action.event, action.payload);
      // (опционально) сразу скрыть тост:
      // hideToast(toast);
    });
    toast.appendChild(btn);
  }

  // Добавляем в контейнер
  if (!toastContainer) {
    toastContainer = document.getElementById("toast-container");
  }

  if (!toastContainer) {
    console.error("[toast] #toast-container not found");
    isShowingToast = false;
    return;
  }

  toastContainer.appendChild(toast);

  // Анимация появления
  setTimeout(() => {
    toast.classList.add("toast-show");
  }, 10);

  // Обработчик закрытия вручную
  const closeBtn = toast.querySelector(".toast-close");
  closeBtn?.addEventListener("click", () => {
    hideToast(toast);
  });

  // Автоматическое исчезновение через duration мс
  setTimeout(() => {
    hideToast(toast);
  }, duration);
}

// =============================================================================
// СКРЫТЬ УВЕДОМЛЕНИЕ
// =============================================================================
/**
 * Скрыть уведомление с анимацией
 * @param {HTMLElement} toast - DOM-элемент уведомления
 */
function hideToast(toast) {
  // Анимация исчезновения
  toast.classList.remove("toast-show");
  toast.classList.add("toast-hide");

  // Удаляем из DOM после завершения анимации
  setTimeout(() => {
    toast.remove();

    // Показываем следующее уведомление из очереди
    processToastQueue();
  }, 300);
}

// =============================================================================
// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: ЭКРАНИРОВАНИЕ HTML
// =============================================================================
/**
 * Экранировать HTML-символы для безопасного вывода
 * @param {string} str - Строка для экранирования
 * @returns {string} - Экранированная строка
 */
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ensure-toast-root.js (или просто вставь в main.js)
(() => {
  let root = document.getElementById("toast-container");
  if (!root) {
    root = document.createElement("div");
    root.id = "toast-container";
    document.body.appendChild(root);
  } else if (root.parentElement !== document.body) {
    document.body.appendChild(root); // вынести из чужого контейнера/панели
  }
  // safety: фиксированная позиция
  root.style.position = "fixed";
})();

// =============================================================================
// ИНИЦИАЛИЗАЦИЯ МОДУЛЯ
// =============================================================================
/**
 * Инициализировать систему уведомлений
 */
export function initToast() {
  // Проверяем наличие контейнера
  toastContainer = document.getElementById("toast-container");

  if (!toastContainer) {
    console.warn("[toast] #toast-container not found, creating...");
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    document.body.appendChild(toastContainer);
  }

  // Слушаем событие показа уведомления
  eventBus.on("ui:toast", showToast);

  console.log("✅ Toast system initialized");
}
