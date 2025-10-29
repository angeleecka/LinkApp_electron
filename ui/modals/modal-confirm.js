// =============================================================================
// UI/MODALS/MODAL-CONFIRM.JS — Универсальная модалка подтверждения действия
// =============================================================================
// Что здесь:
// - Универсальная модалка для подтверждения опасных действий
// - Настраиваемый заголовок и текст сообщения
// - Кнопки: Yes/Confirm, Cancel
// - Callback-функция onConfirm() при подтверждении
// =============================================================================

import { eventBus } from "../../core/event-bus.js";
import { openModal } from "../modal-service.js";

// =============================================================================
// ОТКРЫТИЕ МОДАЛКИ ПОДТВЕРЖДЕНИЯ
// =============================================================================
/**
 * Открыть модалку подтверждения действия
 * @param {Object} data - Параметры модалки
 * @param {string} data.title - Заголовок модалки
 * @param {string} data.message - Текст сообщения
 * @param {Function} data.onConfirm - Callback при подтверждении
 * @param {string} [data.confirmText] - Текст кнопки подтверждения (по умолчанию "Yes")
 * @param {string} [data.cancelText] - Текст кнопки отмены (по умолчанию "Cancel")
 */
function openConfirmModal(data) {
  const {
    title = "Confirm Action",
    message = "Are you sure?",
    onConfirm = () => {},
    confirmText = "Yes",
    cancelText = "Cancel",
  } = data;

  // Создаём HTML-содержимое модалки
  const bodyHTML = `
    <div class="confirm-message">
      <p>${escapeHtml(message)}</p>
    </div>
    
    <div class="modal-buttons-group">
      <button class="btn save" id="confirmYesBtn">${escapeHtml(
        confirmText
      )}</button>
      <button class="btn cancel" id="confirmCancelBtn">${escapeHtml(
        cancelText
      )}</button>
    </div>
  `;

  // Открываем модалку через modal-service
  const modal = openModal({
    title,
    bodyHTML,
    onClose: () => {
      // При закрытии без подтверждения — ничего не делаем
    },
  });

  // ===== ОБРАБОТЧИКИ СОБЫТИЙ ВНУТРИ МОДАЛКИ =====

  // Кнопка "Yes" / "Confirm"
  const yesBtn = document.getElementById("confirmYesBtn");
  yesBtn?.addEventListener("click", () => {
    // Вызываем callback-функцию
    onConfirm();
    // Закрываем модалку
    modal.close();
  });

  // Кнопка "Cancel"
  const cancelBtn = document.getElementById("confirmCancelBtn");
  cancelBtn?.addEventListener("click", () => {
    modal.close();
  });

  // Подтверждение по Enter
  window.addEventListener("keydown", function handleEnter(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      onConfirm();
      modal.close();
      window.removeEventListener("keydown", handleEnter);
    }
  });

  // Фокус на кнопку "Yes" при открытии
  yesBtn?.focus();
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

// =============================================================================
// ИНИЦИАЛИЗАЦИЯ МОДУЛЯ
// =============================================================================
/**
 * Инициализировать обработчики событий для модалки подтверждения
 */
export function initConfirmModal() {
  // Слушаем событие открытия модалки подтверждения
  eventBus.on("modal:confirm:open", openConfirmModal);

  console.log("✅ Confirm Modal initialized");
}
