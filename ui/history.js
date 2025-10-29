// =============================================================================
// UI/HISTORY.JS — Корзина удалённых элементов (кнопок и секций)
// =============================================================================
// Что здесь:
// - Открытие модалки истории (openHistoryModal)
// - Рендеринг списка удалённых элементов (renderHistoryList)
// - Восстановление элемента из истории (restoreItem)
// - Удаление элемента из истории навсегда (deleteFromHistory)
// - Очистка всей истории (clearHistory)
// =============================================================================

import { eventBus } from "../core/event-bus.js";
import { storage } from "../core/storage.js";
import { openModal } from "./modal-service.js"; // NEW

// =============================================================================
// ОТКРЫТИЕ МОДАЛКИ ИСТОРИИ УДАЛЕНИЙ
// =============================================================================
/**
 * Открыть модалку с историей удалённых элементов
 */
export function openHistoryModal() {
  const data = storage.get();
  const history = data.deletedItemsHistory || [];

  // Отправляем событие для открытия модалки с данными истории
  eventBus.emit("modal:history:open", { history });
}

// =============================================================================
// РЕНДЕРИНГ СПИСКА УДАЛЁННЫХ ЭЛЕМЕНТОВ
// =============================================================================
/**
 * Отрендерить список удалённых элементов внутри модалки
 * @param {HTMLElement} container - DOM-контейнер для списка
 */
export function renderHistoryList(container) {
  const data = storage.get();
  const history = data.deletedItemsHistory || [];

  // Очищаем контейнер
  container.innerHTML = "";

  // Если история пустая — показываем сообщение
  if (history.length === 0) {
    container.innerHTML =
      '<p style="color: #666;">Deletion history is empty.</p>';
    return;
  }

  // Разворачиваем массив (последние удалённые — сверху)
  const reversed = [...history].reverse();

  // Рендерим каждый элемент истории
  reversed.forEach((item, idx) => {
    // Вычисляем оригинальный индекс в массиве (для операций restore/delete)
    const originalIndex = history.length - 1 - idx;

    // Создаём контейнер элемента
    const itemDiv = document.createElement("div");
    itemDiv.className = "history-item";

    // Формируем содержимое в зависимости от типа элемента
    let content = "";

    if (item.type === "button") {
      // Удалённая кнопка
      const path = `${item.pageName || "(unknown page)"} / ${
        item.sectionName || "(unknown section)"
      }`;

      content = `
        <p><strong>Button:</strong> ${item.name || "Unnamed"}</p>
        <p><strong>Link:</strong> <a href="${
          item.link || "#"
        }" target="_blank" rel="noopener">${item.link || "No link"}</a></p>
        <p class="origin-path"><small>From: ${path}</small></p>   <!-- NEW -->
      `;
    } else if (item.type === "section") {
      const buttonsCount = Array.isArray(item.buttons)
        ? item.buttons.length
        : 0;
      const label = item.sectionName || item.name || "Unnamed"; // ← добавили fallback на sectionName
      const page = item.pageName || "(unknown page)";
      content = `
        <p><strong>Section:</strong> ${label}</p>
        <p>(Contains ${buttonsCount} button${buttonsCount !== 1 ? "s" : ""})</p>
        <p class="origin-path"><small>From: ${page}</small></p> 
      `;
    }

    // Дата удаления
    const date = item.deletedAt
      ? new Date(item.deletedAt).toLocaleString()
      : "Unknown";
    content += `<p class="deleted-at">Deleted: ${date}</p>`;

    itemDiv.innerHTML = content;

    // ===== КНОПКА "RESTORE" (восстановить) =====
    const restoreBtn = document.createElement("button");
    restoreBtn.textContent = "Restore";
    restoreBtn.className = "restore-button";
    restoreBtn.title = "Restore this item";
    restoreBtn.addEventListener("click", () => {
      restoreItem(originalIndex);
    });

    // ===== ИКОНКА "🗑️" (удалить из истории навсегда) =====
    const deleteIcon = document.createElement("span");
    deleteIcon.textContent = "🗑️";
    deleteIcon.className = "delete-from-history-icon";
    deleteIcon.title = "Delete this item from history permanently";
    deleteIcon.addEventListener("click", () => {
      eventBus.emit("modal:confirm:open", {
        title: "Delete from History?",
        message: "Delete this item from history permanently?",
        confirmText: "Delete",
        cancelText: "Cancel",
        onConfirm: () => deleteFromHistory(originalIndex),
      });
    });

    // Контейнер для кнопок действий
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "history-item-actions";
    actionsDiv.appendChild(restoreBtn);
    actionsDiv.appendChild(deleteIcon);

    itemDiv.appendChild(actionsDiv);
    container.appendChild(itemDiv);
  });

  console.log(`[history] Rendered ${history.length} items`);
}

// =============================================================================
// ВОССТАНОВЛЕНИЕ ЭЛЕМЕНТА ИЗ ИСТОРИИ
// =============================================================================
/**
 * Восстановить удалённый элемент (кнопку или секцию)
 * @param {number} historyIndex - Индекс элемента в массиве deletedItemsHistory
 */
export function restoreItem(historyIndex) {
  const data = storage.get();
  const history = data.deletedItemsHistory || [];

  // Проверка индекса
  if (historyIndex < 0 || historyIndex >= history.length) {
    console.error("[history] Invalid restore index:", historyIndex);
    eventBus.emit("ui:toast", {
      type: "error",
      message: "Item not found in history!",
    });
    return;
  }

  const item = history[historyIndex];

  // ====== ХЕЛПЕРЫ (локальные) ======
  const findPageIndexById = (id) =>
    id ? storage.get().pages.findIndex((p) => p.id === id) : -1;

  const ensureRestoredPageIndex = () => {
    let idx = storage
      .get()
      .pages.findIndex((p) => (p.name || "").toLowerCase() === "restored");
    if (idx !== -1) return idx;
    storage.update((d) => {
      d.pages.push({
        id: `page-restored-${Date.now()}`,
        name: "Restored",
        sections: {},
      });
    });
    return storage.get().pages.length - 1;
  };

  const ensureSectionOnPage = (pageIndex, titleHint = "Restored") => {
    let createdId = null;
    storage.update((d) => {
      const page = d.pages[pageIndex];
      if (!page.sections) page.sections = {};
      // Ищем секцию с названием, начинающимся на "Restored"
      const existingId = Object.keys(page.sections).find((id) =>
        (page.sections[id]?.text || "").toLowerCase().startsWith("restored")
      );
      if (existingId) {
        createdId = existingId;
        return;
      }
      createdId = `section-restored-${Date.now()}`;
      page.sections[createdId] = { text: titleHint, buttons: [] };
    });
    return createdId;
  };

  const closeHistoryModal = () => eventBus.emit("modal:history:close");

  // ====== ВОССТАНОВЛЕНИЕ КНОПКИ ======
  if (item.type === "button") {
    const pageIdx = findPageIndexById(item.pageId);
    const hasPage = pageIdx !== -1;
    const curData = storage.get();
    const hasSection =
      hasPage &&
      curData.pages[pageIdx].sections &&
      curData.pages[pageIdx].sections[item.sectionId];

    // (A) Тихий возврат "как было"
    if (hasPage && hasSection) {
      let restoredBtn = null;
      storage.update((d) => {
        const page = d.pages[pageIdx];
        const section = page.sections[item.sectionId];
        const btn = {
          id: `button-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
          text: item.name || "Restored button",
          href: item.link || "",
        };
        restoredBtn = btn; // понадобится для Undo
        const at = Number.isInteger(item.buttonIndex)
          ? Math.min(Math.max(item.buttonIndex, 0), section.buttons.length)
          : section.buttons.length;
        section.buttons.splice(at, 0, btn);
        d.deletedItemsHistory.splice(historyIndex, 1);
      });

      closeHistoryModal();

      eventBus.emit("ui:toast", {
        type: "success",
        message: `Button "${item.name || ""}" → ${item.pageName || "Page"} / ${
          item.sectionName || "Section"
        }`,
        action: {
          // ← ВНЕ message, отдельным полем!
          label: "Undo",
          event: "history:undo",
          payload: {
            type: "button", // ← это кнопка
            pageIdx,
            sectionId: item.sectionId,
            buttonId: restoredBtn.id, // ← ID только что восстановленной кнопки
            historyItem: JSON.parse(JSON.stringify(item)),
          },
        },
      });

      return;
    }

    // (B) Предков нет — спрашиваем и отправляем в Restored
    const modal = openModal({
      title: "Restore Button",
      bodyHTML: `
        <p>Parent container not found. What would you like to do?</p>
        <div class="modal-actions">
          <button class="btn" id="btnRecreate">Recreate missing parent(s)</button>
          <button class="btn" id="btnToRestored">To “Restored”</button>
          <button class="btn cancel" id="btnCancel">Cancel</button>
        </div>
      `,
    });

    // (A) Recreate missing page/section по сохранённым данным
    document.getElementById("btnRecreate")?.addEventListener("click", () => {
      // 1) страница по сохранённым данным
      let targetPageIndex = findPageIndexById(item.pageId);
      if (targetPageIndex === -1) {
        storage.update((d) => {
          d.pages.push({
            id: item.pageId || `page-${Date.now()}`,
            name: item.pageName || "Restored",
            sections: {},
          });
        });
        targetPageIndex = storage.get().pages.length - 1;
      }

      // 2) секция на этой странице
      const ensureSection = () => {
        const d = storage.get();
        const page = d.pages[targetPageIndex];
        if (!page.sections) page.sections = {};
        let sid = item.sectionId || `section-${Date.now()}`;
        if (page.sections[sid])
          sid = `${sid}-restored-${Math.floor(Math.random() * 1e3)}`;
        storage.update((dd) => {
          const p = dd.pages[targetPageIndex];
          if (!p.sections[sid]) {
            p.sections[sid] = {
              text: item.sectionName || item.name || "Restored",
              buttons: [],
            };
          }
        });
        return sid;
      };
      const targetSectionId = ensureSection();

      // 3) вставляем кнопку + удаляем из истории
      let restoredBtn = null; // ← NEW
      storage.update((d) => {
        const page = d.pages[targetPageIndex];
        const section = page.sections[targetSectionId];
        const btn = {
          id: `button-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
          text: item.name || "Restored button",
          href: item.link || "",
        };
        restoredBtn = btn; // ← NEW
        const at = Number.isInteger(item.buttonIndex)
          ? Math.min(Math.max(item.buttonIndex, 0), section.buttons.length)
          : section.buttons.length;
        section.buttons.splice(at, 0, btn);
        d.deletedItemsHistory.splice(historyIndex, 1);
      });

      modal?.close?.();
      closeHistoryModal();

      eventBus.emit("ui:toast", {
        type: "success",
        message: `Button "${item.name || ""}" restored (recreated parents)`,
        action: {
          // ← NEW — Undo
          label: "Undo",
          event: "history:undo",
          payload: {
            type: "button",
            pageIdx: targetPageIndex,
            sectionId: targetSectionId,
            buttonId: restoredBtn.id,
            historyItem: JSON.parse(JSON.stringify(item)),
          },
        },
      });
    });

    // (B) To “Restored” — оставить как было у тебя
    document.getElementById("btnToRestored")?.addEventListener("click", () => {
      const targetPageIdx = ensureRestoredPageIndex();
      const targetSectionId = ensureSectionOnPage(targetPageIdx, "Restored");

      let restoredBtn = null; // NEW
      storage.update((d) => {
        const page = d.pages[targetPageIdx];
        const section = page.sections[targetSectionId];
        const btn = {
          id: `button-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
          text: item.name || "Restored button",
          href: item.link || "",
        };
        restoredBtn = btn; // NEW
        section.buttons.push(btn);
        d.deletedItemsHistory.splice(historyIndex, 1);
      });

      modal?.close?.();
      closeHistoryModal();

      eventBus.emit("ui:toast", {
        type: "success",
        message: `Button "${item.name || ""}" restored to “Restored”`,
        action: {
          // NEW — Undo
          label: "Undo",
          event: "history:undo",
          payload: {
            type: "button",
            pageIdx: targetPageIdx,
            sectionId: targetSectionId,
            buttonId: restoredBtn.id,
            historyItem: JSON.parse(JSON.stringify(item)),
          },
        },
      });
    });

    document
      .getElementById("btnCancel")
      ?.addEventListener("click", () => modal?.close?.());

    return;
  }

  // ====== ВОССТАНОВЛЕНИЕ СЕКЦИИ ======
  if (item.type === "section") {
    const pageIdx = findPageIndexById(item.pageId);
    const hasPage = pageIdx !== -1;

    // (A) Тихий возврат "как было"
    if (hasPage) {
      let createdSectionId = null; // ← NEW
      storage.update((d) => {
        const page = d.pages[pageIdx];
        if (!page.sections) page.sections = {};

        let newId =
          item.sectionId && !page.sections[item.sectionId]
            ? item.sectionId
            : `section-${Date.now()}`;
        while (page.sections[newId])
          newId = `${newId}-${Math.floor(Math.random() * 1e3)}`;

        const buttons = (item.buttons || []).map((b) => ({
          id:
            b?.id || `button-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
          text: b?.text || b?.name || "Restored button",
          href: b?.href || b?.link || "",
        }));

        page.sections[newId] = {
          text: item.sectionName || item.name || "Restored section",
          buttons,
        };
        createdSectionId = newId; // ← NEW
        d.deletedItemsHistory.splice(historyIndex, 1);
      });

      closeHistoryModal();

      eventBus.emit("ui:toast", {
        type: "success",
        message: `Section "${
          item.sectionName || item.name || ""
        }" restored to page: ${item.pageName || "Page"}`,
        action: {
          // ← NEW — Undo
          label: "Undo",
          event: "history:undo",
          payload: {
            type: "section",
            pageIdx,
            sectionNewId: createdSectionId,
            historyItem: JSON.parse(JSON.stringify(item)),
          },
        },
      });
      return;
    }

    // (B) Страницы нет — спрашиваем и отправляем в Restored
    const modal = openModal({
      title: "Restore Section",
      bodyHTML: `
        <p>Parent page not found. What would you like to do?</p>
        <div class="modal-actions">
          <button class="btn" id="secRecreate">Recreate missing page</button>
          <button class="btn" id="secToRestored">To “Restored” page</button>
          <button class="btn cancel" id="secCancel">Cancel</button>
        </div>
      `,
    });

    // (A) Recreate missing page и вернуть секцию туда
    document.getElementById("secRecreate")?.addEventListener("click", () => {
      // 1) создаём (или берём) страницу по сохранённым данным
      let targetPageIndex = findPageIndexById(item.pageId);
      if (targetPageIndex === -1) {
        storage.update((d) => {
          d.pages.push({
            id: item.pageId || `page-${Date.now()}`,
            name: item.pageName || item.name || "Restored",
            sections: {},
          });
        });
        targetPageIndex = storage.get().pages.length - 1;
      }

      // 2) создаём секцию (пытаемся использовать исходный sectionId/sectionName)
      let createdSectionId = null; // ← NEW
      storage.update((d) => {
        const page = d.pages[targetPageIndex];
        if (!page.sections) page.sections = {};
        let newId = item.sectionId || `section-${Date.now()}`;
        if (page.sections[newId]) {
          newId = `${newId}-restored-${Math.floor(Math.random() * 1e3)}`;
        }

        const buttons = (item.buttons || []).map((b) => ({
          id:
            b?.id || `button-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
          text: b?.text || b?.name || "Restored button",
          href: b?.href || b?.link || "",
        }));

        page.sections[newId] = {
          text: item.sectionName || item.name || "Restored section",
          buttons,
        };
        createdSectionId = newId; // ← NEW
        d.deletedItemsHistory.splice(historyIndex, 1);
      });

      modal?.close?.();
      closeHistoryModal();

      eventBus.emit("ui:toast", {
        type: "success",
        message: `Section "${
          item.sectionName || item.name || ""
        }" restored to page: ${item.pageName || "Page"}`,
        action: {
          // ← кнопка Undo
          label: "Undo",
          event: "history:undo",
          payload: {
            type: "section",
            pageIdx: targetPageIndex, // ← был pageIdx, нужно targetPageIndex
            sectionNewId: createdSectionId,
            historyItem: JSON.parse(JSON.stringify(item)),
          },
        },
      });
    });

    // (B) To “Restored” page — оставить как было
    document.getElementById("secToRestored")?.addEventListener("click", () => {
      const targetPageIdx = ensureRestoredPageIndex();

      let createdSectionId = null; // NEW
      storage.update((d) => {
        const page = d.pages[targetPageIdx];
        if (!page.sections) page.sections = {};
        let newId = `section-${Date.now()}`;
        while (page.sections[newId])
          newId = `${newId}-${Math.floor(Math.random() * 1e3)}`;

        const buttons = (item.buttons || []).map((b) => ({
          id:
            b?.id || `button-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
          text: b?.text || b?.name || "Restored button",
          href: b?.href || b?.link || "",
        }));

        page.sections[newId] = {
          text: item.sectionName || item.name || "Restored section",
          buttons,
        };
        createdSectionId = newId; // NEW
        d.deletedItemsHistory.splice(historyIndex, 1);
      });

      modal?.close?.();
      closeHistoryModal();

      eventBus.emit("ui:toast", {
        type: "success",
        message: `Section "${
          item.sectionName || item.name || ""
        }" restored to “Restored”`,
        action: {
          // NEW — Undo
          label: "Undo",
          event: "history:undo",
          payload: {
            type: "section",
            pageIdx: targetPageIdx,
            sectionNewId: createdSectionId,
            historyItem: JSON.parse(JSON.stringify(item)),
          },
        },
      });
    });

    document
      .getElementById("secCancel")
      ?.addEventListener("click", () => modal?.close?.());
  }
}

// =============================================================================
// УДАЛЕНИЕ ЭЛЕМЕНТА ИЗ ИСТОРИИ НАВСЕГДА
// =============================================================================
/**
 * Удалить элемент из истории навсегда (без восстановления)
 * @param {number} historyIndex - Индекс элемента в массиве deletedItemsHistory
 */
export function deleteFromHistory(historyIndex) {
  const data = storage.get();
  const history = data.deletedItemsHistory || [];

  // Проверка: валидный ли индекс?
  if (historyIndex < 0 || historyIndex >= history.length) {
    console.error("[history] Invalid delete index:", historyIndex);
    return;
  }

  // Удаляем элемент из истории
  storage.update((data) => {
    data.deletedItemsHistory.splice(historyIndex, 1);
  });

  // Обновляем список в модалке (если она открыта)
  eventBus.emit("history:item-deleted", { historyIndex });

  console.log(`[history] Item deleted from history at index ${historyIndex}`);
}

// =============================================================================
// ОЧИСТКА ВСЕЙ ИСТОРИИ
// =============================================================================
/**
 * Очистить всю историю удалений (после подтверждения)
 */
export function clearHistory() {
  // Запрашиваем подтверждение через модалку
  eventBus.emit("modal:confirm:open", {
    title: "Clear History?",
    message:
      "Are you sure you want to clear the deletion history? This action cannot be undone.",
    onConfirm: () => {
      // Очищаем историю
      storage.update((data) => {
        data.deletedItemsHistory = [];
      });

      // Закрываем модалку истории
      eventBus.emit("modal:history:close");

      // Показываем уведомление
      eventBus.emit("ui:toast", {
        type: "info",
        message: "History cleared",
      });

      console.log("[history] History cleared");
    },
  });
}

eventBus.on(
  "history:undo",
  ({ type, pageIdx, sectionId, buttonId, sectionNewId, historyItem }) => {
    const d0 = storage.get();
    if (!d0 || !Array.isArray(d0.pages)) return;

    storage.update((d) => {
      const pages = d.pages;

      if (type === "button") {
        const page = pages[pageIdx];
        const section = page?.sections?.[sectionId];
        if (!section) return;
        const idx = section.buttons.findIndex((b) => b.id === buttonId);
        if (idx !== -1) section.buttons.splice(idx, 1);
        // вернуть запись в историю (в конец)
        d.deletedItemsHistory.push(historyItem);
      }

      if (type === "section") {
        const page = pages[pageIdx];
        if (page?.sections?.[sectionNewId]) {
          delete page.sections[sectionNewId];
        }
        d.deletedItemsHistory.push(historyItem);
      }
    });

    eventBus.emit("ui:toast", { type: "info", message: "Undone" });
  }
);

// =============================================================================
// ИНИЦИАЛИЗАЦИЯ МОДУЛЯ
// =============================================================================
/**
 * Инициализировать обработчики событий для работы с историей
 */
export function initHistory() {
  // Слушаем событие открытия истории (кнопка "History" в шапке)
  eventBus.on("history:open", openHistoryModal);

  // Слушаем событие очистки истории (кнопка "Clear History" в модалке)
  eventBus.on("history:clear", clearHistory);

  console.log("✅ History module initialized");
}
