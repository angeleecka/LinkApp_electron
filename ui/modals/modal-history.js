// =============================================================================
// UI/MODALS/MODAL-HISTORY.JS — Модалка истории удалённых элементов
// =============================================================================
// Что здесь:
// - Открытие модалки с историей удалений
// - Отображение списка удалённых кнопок и секций
// - Кнопки: Restore (для каждого элемента), Clear History, Cancel
// - Обновление списка после восстановления/удаления элемента
// =============================================================================

import { eventBus } from "../../core/event-bus.js";
import { openModal } from "../modal-service.js";
import { renderHistoryList } from "../history.js";

let currentModal = null;

// =============================================================================
// ОТКРЫТИЕ МОДАЛКИ ИСТОРИИ
// =============================================================================
/**
 * Открыть модалку с историей удалённых элементов
 * @param {Object} data - Данные истории
 * @param {Array} data.history - Массив удалённых элементов
 */
function openHistoryModal(data) {
  // Создаём HTML-содержимое модалки
  const bodyHTML = `
    <div id="historyListContainer" class="history-list-container">
      <!-- Список будет отрендерен через renderHistoryList() -->
    </div>
    
    <div class="modal-actions">
      <button class="btn delete" id="clearHistoryBtn">Clear History</button>
      <button class="btn cancel" id="cancelHistoryBtn">Close</button>
    </div>
  `;

  // Открываем модалку через modal-service
  currentModal = openModal({
    title: "Deletion History",
    bodyHTML,
    onClose: () => {
      currentModal = null;
    },
  });

  // Рендерим список истории
  const container = document.getElementById("historyListContainer");
  if (container) {
    renderHistoryList(container);
  }

  // ===== ОБРАБОТЧИКИ СОБЫТИЙ ВНУТРИ МОДАЛКИ =====

  // Кнопка "Clear History"
  const clearBtn = document.getElementById("clearHistoryBtn");
  clearBtn?.addEventListener("click", () => {
    eventBus.emit("history:clear");
  });

  // Кнопка "Close"
  const cancelBtn = document.getElementById("cancelHistoryBtn");
  cancelBtn?.addEventListener("click", () => {
    currentModal?.close();
  });

  // Слушаем событие закрытия модалки через события
  eventBus.once("modal:history:close", () => {
    currentModal?.close();
  });

  // Слушаем событие удаления элемента из истории — обновляем список
  eventBus.on("history:item-deleted", () => {
    if (container) {
      renderHistoryList(container);
    }
  });

  // Слушаем событие обновления данных — обновляем список
  eventBus.on("storage:updated", () => {
    if (container && currentModal) {
      renderHistoryList(container);
    }
  });
}

// =============================================================================
// ИНИЦИАЛИЗАЦИЯ МОДУЛЯ
// =============================================================================
/**
 * Инициализировать обработчики событий для модалки истории
 */
export function initHistoryModal() {
  // Слушаем событие открытия модалки
  eventBus.on("modal:history:open", openHistoryModal);

  console.log("✅ History Modal initialized");
}
