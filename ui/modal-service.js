// =============================================================================
// UI/MODAL-SERVICE.JS — Единый сервис для создания модальных окон --- изменялся!!!
// =============================================================================
// Что здесь:
// - Универсальная функция openModal() для создания модалок
// - Поддержка заголовка, тела, footer (опционально)
// - Закрытие по клику на overlay, крестик или Escape
// - Callback onClose при закрытии
// =============================================================================

/**
 * Открыть модальное окно
 * @param {Object} options - Параметры модалки
 * @param {string} options.title - Заголовок модалки
 * @param {string} options.bodyHTML - HTML-содержимое тела модалки
 * @param {Function} [options.onClose] - Callback при закрытии
 * @param {boolean} [options.showFooter=false] - Показывать ли footer с кнопкой OK
 * @returns {Object} - Объект с методом close()
 */
export function openModal({
  title = "",
  bodyHTML = "",
  onClose,
  showFooter = false,
} = {}) {
  const host = document.getElementById("modals-root");
  if (!host) {
    console.error("openModal: #modals-root not found");
    return { close() {} };
  }

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  // Формируем footer только если showFooter = true (только для модалки "О приложении")
  const footerHTML = showFooter
    ? `<div class="modal-footer">
         <button class="btn" data-role="ok">OK</button>
       </div>`
    : "";

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">${title}</h2>
        <button class="modal-close" title="Close">✕</button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
      ${footerHTML}
    </div>
  `;
  host.appendChild(overlay);

  // Функция закрытия модалки
  const close = () => {
    overlay.remove();
    onClose?.();
  };

  // Закрытие по клику на крестик
  overlay.querySelector(".modal-close")?.addEventListener("click", close);

  // Закрытие по клику вне модалки (на overlay)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  // Если есть кнопка OK в footer — вешаем обработчик
  if (showFooter) {
    overlay.querySelector('[data-role="ok"]')?.addEventListener("click", close);
  }

  // Закрытие по Escape
  const onKey = (e) => {
    if (e.key === "Escape") {
      window.removeEventListener("keydown", onKey);
      close();
    }
  };
  window.addEventListener("keydown", onKey);

  return { close };
}
