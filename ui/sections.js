// =============================================================================
// UI/SECTIONS.JS — Логика работы с секциями
// =============================================================================
// Что здесь:
// - Добавление новой секции (addNewSection)
// - Открытие модалки редактирования секции (openEditModal)
// - Сохранение изменений секции (saveSection)
// - Удаление секции с записью в историю (deleteSection)
// - Рендеринг секций на странице (renderSections)
// =============================================================================

import { eventBus } from "../core/event-bus.js";
import { storage } from "../core/storage.js";
import { renderButtons } from "./buttons.js";

// =============================================================================
// ДОБАВЛЕНИЕ НОВОЙ СЕКЦИИ
// =============================================================================
/**
 * Добавить новую секцию на текущую страницу
 */
export function addNewSection() {
  const data = storage.get();
  const page = data.pages[data.currentPageIndex || 0];

  // Проверка: страница существует?
  if (!page) {
    eventBus.emit("ui:toast", {
      type: "error",
      message: "Please create a page first!",
    });
    return;
  }

  // Создаём новую секцию с уникальным ID
  const newSectionId = `section-${Date.now()}`;
  const newSection = {
    text: "New Section",
    buttons: [],
  };

  // Обновляем данные через storage
  storage.update((data) => {
    const page = data.pages[data.currentPageIndex || 0];
    if (!page.sections) page.sections = {};

    // Инициализируем порядок из уже существующих секций (до добавления новой)
    if (!Array.isArray(page.sectionsOrder)) {
      page.sectionsOrder = Object.keys(page.sections);
    }

    page.sections[newSectionId] = newSection;
    page.sectionsOrder.push(newSectionId);
  });

  // Уведомляем систему о добавлении секции
  eventBus.emit("sections:added", { sectionId: newSectionId });

  // Показываем уведомление пользователю
  eventBus.emit("ui:toast", {
    type: "success",
    message: "Section added!",
  });
}

// =============================================================================
// ОТКРЫТИЕ МОДАЛКИ РЕДАКТИРОВАНИЯ СЕКЦИИ
// =============================================================================
/**
 * Открыть модалку для редактирования секции
 * @param {string} sectionId - ID секции для редактирования
 */
export function openEditModal(sectionId) {
  const data = storage.get();
  const page = data.pages[data.currentPageIndex || 0];
  const section = page?.sections?.[sectionId];

  if (!section) {
    eventBus.emit("ui:toast", {
      type: "error",
      message: "Section not found!",
    });
    return;
  }

  // Отправляем событие для открытия модалки с данными секции
  eventBus.emit("modal:edit-section:open", {
    sectionId,
    text: section.text || "",
  });
}

// =============================================================================
// СОХРАНЕНИЕ ИЗМЕНЕНИЙ СЕКЦИИ
// =============================================================================
/**
 * Сохранить изменения секции (название)
 * @param {Object} params - Параметры сохранения
 * @param {string} params.sectionId - ID секции
 * @param {string} params.text - Новое название секции
 */
export function saveSection({ sectionId, text }) {
  // Проверка: заполнено ли название
  if (!text.trim()) {
    eventBus.emit("ui:toast", {
      type: "warning",
      message: "Section name cannot be empty!",
    });
    return;
  }

  const data = storage.get();
  const page = data.pages[data.currentPageIndex || 0];
  const section = page?.sections?.[sectionId];

  if (!section) {
    eventBus.emit("ui:toast", {
      type: "error",
      message: "Section not found!",
    });
    return;
  }

  // Обновляем название секции
  storage.update((data) => {
    const page = data.pages[data.currentPageIndex || 0];
    const section = page.sections[sectionId];
    if (section) {
      section.text = text.trim();
    }
  });

  // Уведомляем систему об изменениях
  eventBus.emit("sections:updated", { sectionId });

  // Закрываем модалку
  eventBus.emit("modal:edit-section:close");

  // Показываем уведомление
  eventBus.emit("ui:toast", {
    type: "success",
    message: "Section saved!",
  });
}

// =============================================================================
// УДАЛЕНИЕ СЕКЦИИ (с записью в историю)
// =============================================================================
/**
 * Удалить секцию и добавить её в историю удалений
 * @param {string} sectionId - ID секции для удаления
 */
export function deleteSection(sectionId) {
  const data = storage.get();
  const page = data.pages[data.currentPageIndex || 0];
  const section = page?.sections?.[sectionId];

  if (!section) {
    eventBus.emit("ui:toast", {
      type: "error",
      message: "Section not found!",
    });
    return;
  }

  // Обновляем данные: удаляем секцию и добавляем в историю
  storage.update((data) => {
    const page = data.pages[data.currentPageIndex || 0];
    const section = page.sections[sectionId];

    // Добавляем в историю удалений (сохраняем все кнопки внутри)
    if (!data.deletedItemsHistory) data.deletedItemsHistory = [];
    data.deletedItemsHistory.push({
      type: "section",
      // — контекст страницы/секции
      pageId: page.id, // NEW
      pageName: page.name, // NEW
      sectionId: sectionId, // NEW
      sectionName: section.text, // NEW
      pageIndex: data.currentPageIndex || 0, // NEW
      sectionIndex: Object.keys(page.sections).indexOf(sectionId), // NEW
      // — состав секции на момент удаления
      buttons: section.buttons || [],
      deletedAt: new Date().toISOString(),
    });

    // Удаляем секцию со страницы
    delete page.sections[sectionId];
    const i = page.sectionsOrder?.indexOf(sectionId);
    if (i >= 0) page.sectionsOrder.splice(i, 1);
  });

  // Уведомляем систему об удалении
  eventBus.emit("sections:deleted", { sectionId });

  // Закрываем модалку
  eventBus.emit("modal:edit-section:close");

  // Показываем уведомление
  eventBus.emit("ui:toast", {
    type: "info",
    message: "Section deleted. Check History to restore.",
  });
}
// =============================================================================
// РЕНДЕРИНГ СЕКЦИЙ (создание DOM-элементов)
// =============================================================================
/**
 * Отрендерить все секции текущей страницы
 * @param {HTMLElement} container - DOM-контейнер для секций
 */
// Фрагмент для замены в sections.js (строки ~130-220)
// Вставь этот блок вместо старого обработчика DnD

function escHtml(s = "") {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function highlightText(text = "", query = "") {
  if (!query) return escHtml(text);
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(safe, "gi");
  let i = 0,
    out = "",
    m;
  while ((m = re.exec(text))) {
    out += escHtml(text.slice(i, m.index));
    out += `<mark class="search-hl">${escHtml(m[0])}</mark>`;
    i = re.lastIndex;
  }
  out += escHtml(text.slice(i));
  return out;
}

export function renderSections(container, opts = {}) {
  const rawQuery = opts.query || "";
  const query = rawQuery.toLowerCase();

  const data = storage.get();
  const page = data.pages[data.currentPageIndex || 0];
  if (!page || !page.sections) return;

  // === DnD на уровне контейнера секций (вешаем один раз) ===
  if (!container.dataset.dndSectionsBound) {
    container.dataset.dndSectionsBound = "1";

    // Создаём маркер-линию
    let dropMarker = document.createElement("div");
    dropMarker.className = "section-drop-marker";
    dropMarker.style.cssText = `
      height: 4px;
      background: var(--accent);
      border-radius: 2px;
      margin: 10px 0;
      opacity: 1;
      pointer-events: none;
      box-shadow: 0 0 12px var(--accent);
      width: 100%;
      display: block;
    `;

    let sectionDropIndex = null;
    let isDraggingSection = false; // флаг: тянем ли секцию

    // Вычислить индекс вставки по позиции мыши
    const computeIndex = (wrap, clientY) => {
      const items = [...wrap.querySelectorAll(".section")];
      if (items.length === 0) return 0;

      let idx = items.length; // по умолчанию — в конец

      for (let i = 0; i < items.length; i++) {
        const r = items[i].getBoundingClientRect();
        const middle = r.top + r.height / 2;

        if (clientY < middle) {
          idx = i;
          break;
        }
      }

      return idx;
    };

    // DRAGSTART на ручке секции (устанавливаем флаг)
    container.addEventListener(
      "dragstart",
      (e) => {
        if (e.target.classList.contains("section-handle")) {
          isDraggingSection = true;
          console.log("[DnD Sections] Drag started (container level)");
        }
      },
      true
    ); // true = capture phase

    // DRAGOVER — показываем маркер
    container.addEventListener("dragover", (e) => {
      // Проверяем флаг вместо чтения данных
      if (!isDraggingSection) {
        dropMarker.remove();
        return;
      }

      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      // Вычисляем индекс вставки
      const idx = computeIndex(container, e.clientY);
      sectionDropIndex = idx;

      const sections = [...container.querySelectorAll(".section")];

      // Вставляем маркер перед нужной секцией (или в конец)
      if (idx < sections.length) {
        container.insertBefore(dropMarker, sections[idx]);
      } else {
        const addBtn = container.querySelector(".add-section");
        if (addBtn) {
          container.insertBefore(dropMarker, addBtn);
        } else {
          container.appendChild(dropMarker);
        }
      }
    });

    // DRAGLEAVE — убираем маркер если вышли за контейнер
    container.addEventListener("dragleave", (e) => {
      if (!container.contains(e.relatedTarget)) {
        dropMarker.remove();
        sectionDropIndex = null;
      }
    });

    // DROP — применяем изменения
    container.addEventListener("drop", (e) => {
      if (!isDraggingSection) return;

      let payload = null;
      try {
        payload = JSON.parse(
          e.dataTransfer.getData("application/json") || "{}"
        );
      } catch {}

      if (!payload || payload.kind !== "section") {
        console.warn("[DnD Sections] Invalid payload:", payload);
        return;
      }

      e.preventDefault();

      const targetIndex =
        sectionDropIndex ?? computeIndex(container, e.clientY);
      dropMarker.remove();
      sectionDropIndex = null;
      isDraggingSection = false;

      console.log("[DnD Sections] Dropping at index:", targetIndex);

      storage.update((d) => {
        const p = d.pages[d.currentPageIndex || 0];
        if (!Array.isArray(p.sectionsOrder))
          p.sectionsOrder = Object.keys(p.sections || {});

        const order = p.sectionsOrder;
        const fromIdx = order.indexOf(payload.sectionId);
        if (fromIdx < 0) {
          console.warn(
            "[DnD Sections] Section not found in order:",
            payload.sectionId
          );
          return;
        }

        // Удаляем из старой позиции
        const [movedId] = order.splice(fromIdx, 1);

        // Корректируем индекс вставки если тянем вниз
        let insertAt = targetIndex;
        if (fromIdx < targetIndex) {
          insertAt = Math.max(0, targetIndex - 1);
        }
        insertAt = Math.min(Math.max(insertAt, 0), order.length);

        // Вставляем в новую позицию
        order.splice(insertAt, 0, movedId);

        console.log("[DnD Sections] New order:", order);
      });

      eventBus.emit("ui:toast", { type: "info", message: "Section reordered" });
    });

    // DRAGEND — сбрасываем всё
    container.addEventListener(
      "dragend",
      () => {
        dropMarker.remove();
        sectionDropIndex = null;
        isDraggingSection = false;
        console.log("[DnD Sections] Drag ended (cleanup)");
      },
      true
    );
  }

  // --- helper: toggle collapsed flag and persist ---
  const toggleCollapsed = (sid) => {
    storage.update((d) => {
      const p = d.pages[d.currentPageIndex || 0];
      const s = p?.sections?.[sid];
      if (!s) return;
      s.collapsed = !s.collapsed;
    });
  };

  // Порядок секций
  const sectionIds = Array.isArray(page.sectionsOrder)
    ? page.sectionsOrder
    : Object.keys(page.sections);

  // === Рендер каждой секции ===
  sectionIds.forEach((sectionId) => {
    const section = page.sections[sectionId];
    if (!section) return;

    // Контейнер секции
    const sectionDiv = document.createElement("div");
    sectionDiv.className = "section";
    sectionDiv.dataset.id = sectionId;

    // Заголовок секции
    const titleDiv = document.createElement("div");
    titleDiv.className = "section-title";
    titleDiv.dataset.id = sectionId;

    if (section.collapsed) sectionDiv.classList.add("collapsed");

    // ✅ Ручка секции (тянем ТОЛЬКО за неё)
    const sectionHandle = document.createElement("span");
    sectionHandle.className = "section-handle";
    sectionHandle.title = "Drag section";
    sectionHandle.textContent = "⋮⋮";
    titleDiv.prepend(sectionHandle);

    // Кнопка сворачивания/разворачивания
    const chevron = document.createElement("button");
    chevron.type = "button";
    chevron.className = "section-chevron ui-icon-btn ui-icon-16";
    chevron.title = "Collapse/expand";
    chevron.textContent = section.collapsed ? "▸" : "▾";
    // ставим после ручки и ПЕРЕД текстом
    titleDiv.appendChild(chevron);

    chevron.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleCollapsed(sectionId);
    });

    // Alt+клик по заголовку секции — тоже переключает
    titleDiv.addEventListener("click", (e) => {
      if (e.altKey) {
        e.stopPropagation();
        toggleCollapsed(sectionId);
      }
    });

    if (!query) {
      sectionHandle.draggable = true;

      sectionHandle.addEventListener("dragstart", (e) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData(
          "application/json",
          JSON.stringify({
            kind: "section",
            sectionId,
          })
        );
        sectionDiv.classList.add("dragging");
        console.log("[DnD Sections] Section drag started:", sectionId);
      });

      sectionHandle.addEventListener("dragend", () => {
        sectionDiv.classList.remove("dragging");
      });
    }

    // Название секции
    const titleText = document.createElement("span");
    titleText.className = "section-title-text";
    if (rawQuery) {
      titleText.innerHTML = highlightText(section.text || "Section", rawQuery);
    } else {
      titleText.textContent = section.text || "Section";
    }
    titleDiv.appendChild(titleText);

    // Иконка редактирования секции
    const editIcon = document.createElement("button");
    editIcon.type = "button";
    editIcon.className = "section-edit-icon ui-icon-btn ui-icon-16";
    editIcon.setAttribute("aria-label", "Edit section");
    editIcon.textContent = "↻";
    editIcon.title = "Edit section";
    editIcon.dataset.sectionId = sectionId;
    titleDiv.appendChild(editIcon);

    editIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditModal(sectionId);
    });

    sectionDiv.appendChild(titleDiv);

    // Контейнер для кнопок
    const buttonsGrid = document.createElement("div");
    buttonsGrid.className = "assignments-grid";
    buttonsGrid.id = `assignments-grid-${sectionId}`;
    sectionDiv.appendChild(buttonsGrid);

    // Рендерим кнопки (с учётом поиска)
    renderButtons(sectionId, buttonsGrid, { query });

    // При активном поиске не показываем пустые секции
    const hasButtons = !!buttonsGrid.querySelector(".assignment-button");
    if (!query || hasButtons) {
      container.appendChild(sectionDiv);
    }
  });
}

// =============================================================================
// ИНИЦИАЛИЗАЦИЯ МОДУЛЯ
// =============================================================================
/**
 * Инициализировать обработчики событий для работы с секциями
 */
export function initSections() {
  const getCurrentPage = () => {
    const data = storage.get();
    return data.pages[data.currentPageIndex || 0] || null;
  };

  // Сохранение секции из модалки
  eventBus.on("section:save", saveSection);

  // Удаление секции
  eventBus.on("section:delete", ({ sectionId }) => {
    storage.update((d) => {
      const page = d.pages[d.currentPageIndex || 0];
      if (!page?.sections?.[sectionId]) return;

      delete page.sections[sectionId];

      if (Array.isArray(page.sectionsOrder)) {
        const i = page.sectionsOrder.indexOf(sectionId);
        if (i >= 0) page.sectionsOrder.splice(i, 1);
      }
    });

    // ✅ Закрываем модалку редактирования секции, если она открыта
    eventBus.emit("modal:edit-section:close");
    eventBus.emit("ui:toast", { type: "info", message: "Section deleted." });
  });

  // Добавление новой секции (“+ Add section”)
  eventBus.on("section:add", () => {
    storage.update((d) => {
      const page = d.pages[d.currentPageIndex || 0];
      if (!page.sections) page.sections = {};

      // 1) Перед добавлением — зафиксировать текущий порядок существующих секций
      if (!Array.isArray(page.sectionsOrder)) {
        page.sectionsOrder = Object.keys(page.sections);
      } else {
        // (опционально) ремонт порядка: добавить пропущенные ids
        for (const sid of Object.keys(page.sections)) {
          if (!page.sectionsOrder.includes(sid)) page.sectionsOrder.push(sid);
        }
      }

      // 2) Добавить новую секцию + вписать в порядок
      const newId = `section-${Date.now()}`;
      page.sections[newId] = { text: "New Section", buttons: [] };
      page.sectionsOrder.push(newId);
    });

    // (опционально) тост — если хочешь видеть подтверждение добавления
    // eventBus.emit("ui:toast", { type: "success", message: "Section added!" });
  });

  console.log("✅ Sections module initialized");
}

/*
перестраховаться от крайне редкого совпадения Date.now() (например, при множественных авто-созданиях в один и тот же миллисекундный тик), можно генерировать id так:

const newId = `section-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

Но для ручных кликов это избыточно.
*/
