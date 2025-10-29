// UI/BUTTONS.JS — Логика работы с кнопками-ссылками
import { eventBus } from "../core/event-bus.js";
import { storage } from "../core/storage.js";
let globalDraggingButton = null;

// =============================================================================
// ДОБАВИТЬ КНОПКУ
// =============================================================================
export function addNewButton(sectionId) {
  const data = storage.get();
  const page = data.pages[data.currentPageIndex || 0];
  const section = page?.sections?.[sectionId];

  if (!section) {
    eventBus.emit("ui:toast", {
      type: "error",
      message: "Section not found on current page!",
    });
    return;
  }
  if (section.buttons && section.buttons.length >= 500) {
    eventBus.emit("ui:toast", {
      type: "warning",
      message: "Maximum 500 buttons per section!",
    });
    return;
  }

  const newButton = {
    id: `button-${Date.now()}`,
    text: "New button",
    href: "",
  };

  storage.update((d) => {
    const p = d.pages[d.currentPageIndex || 0];
    const s = p.sections[sectionId];
    if (!s.buttons) s.buttons = [];
    s.buttons.push(newButton);
  });

  eventBus.emit("buttons:added", { sectionId, button: newButton });
  eventBus.emit("ui:toast", { type: "success", message: "Button added!" });
}

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

// =============================================================================
// ОТКРЫТЬ МОДАЛКУ РЕДАКТИРОВАНИЯ
// =============================================================================
export function openEditModal(buttonId, sectionId) {
  const data = storage.get();
  const page = data.pages[data.currentPageIndex || 0];
  const section = page?.sections?.[sectionId];
  const button = section?.buttons?.find((b) => b.id === buttonId);

  if (!button) {
    eventBus.emit("ui:toast", { type: "error", message: "Button not found!" });
    return;
  }

  eventBus.emit("modal:edit-button:open", {
    buttonId,
    sectionId,
    text: button.text || "",
    href: button.href || "",
  });
}

// =============================================================================
// СОХРАНИТЬ КНОПКУ
// =============================================================================
export function saveButton({ buttonId, sectionId, text, href }) {
  if (!text.trim()) {
    eventBus.emit("ui:toast", {
      type: "warning",
      message: "Button name cannot be empty!",
    });
    return;
  }

  const data = storage.get();
  const page = data.pages[data.currentPageIndex || 0];
  const section = page?.sections?.[sectionId];
  const button = section?.buttons?.find((b) => b.id === buttonId);

  if (!button) {
    eventBus.emit("ui:toast", { type: "error", message: "Button not found!" });
    return;
  }

  storage.update((d) => {
    const p = d.pages[d.currentPageIndex || 0];
    const s = p.sections[sectionId];
    const btn = s.buttons.find((b) => b.id === buttonId);
    if (btn) {
      btn.text = text.trim();
      btn.href = href.trim();
    }
  });

  eventBus.emit("buttons:updated", { buttonId, sectionId });
  eventBus.emit("modal:edit-button:close");
  eventBus.emit("ui:toast", { type: "success", message: "Button saved!" });
}

// =============================================================================
// УДАЛИТЬ КНОПКУ (+ история)
// =============================================================================
export function deleteButton(buttonId, sectionId) {
  const data = storage.get();
  const page = data.pages[data.currentPageIndex || 0];
  const section = page?.sections?.[sectionId];
  const buttonIndex = section?.buttons?.findIndex((b) => b.id === buttonId);

  if (buttonIndex === -1 || buttonIndex === undefined) {
    eventBus.emit("ui:toast", { type: "error", message: "Button not found!" });
    return;
  }

  const button = section.buttons[buttonIndex];

  storage.update((d) => {
    const p = d.pages[d.currentPageIndex || 0];
    const s = p.sections[sectionId];

    // удалить
    s.buttons.splice(buttonIndex, 1);

    // в историю
    if (!d.deletedItemsHistory) d.deletedItemsHistory = [];
    d.deletedItemsHistory.push({
      type: "button",
      pageId: p.id,
      pageName: p.name,
      sectionId,
      sectionName: s.text,
      pageIndex: d.currentPageIndex || 0,
      sectionIndex: Object.keys(p.sections).indexOf(sectionId),
      buttonIndex,
      name: button.text,
      link: button.href,
      deletedAt: new Date().toISOString(),
    });
  });

  eventBus.emit("buttons:deleted", { buttonId, sectionId });
  eventBus.emit("modal:edit-button:close");
  eventBus.emit("ui:toast", {
    type: "info",
    message: "Button deleted. Check History to restore.",
  });
}

// =============================================================================
// РЕНДЕРИНГ КНОПОК + DnD
// =============================================================================

export function renderButtons(sectionId, container, opts = {}) {
  const q = (opts.query || "").toLowerCase();

  const data = storage.get();
  const page = data.pages[data.currentPageIndex || 0];
  const section = page?.sections?.[sectionId];
  if (!section || !section.buttons) return;

  // Очистка контейнера
  container.innerHTML = "";

  // === DnD на уровне контейнера (вешаем один раз) ===
  if (!container.dataset.dndBound) {
    container.dataset.dndBound = "1";

    // Создаём маркер-линию для кнопок
    let buttonDropMarker = document.createElement("div");
    buttonDropMarker.className = "button-drop-marker";
    buttonDropMarker.style.cssText = `
      width: 4px;
  height: 60px;
  background: var(--accent);
  border-radius: 2px;
  margin: 0 8px;
  opacity: 1;
  pointer-events: none;
  box-shadow: 0 0 10px var(--accent);
  display: block;
  align-self: center;
    `;

    let buttonDropIndex = null;
    let isDraggingButton = false; // флаг: тянем ли кнопку

    // Вычислить индекс вставки по позиции мыши
    const computeButtonIndex = (wrap, clientX, clientY) => {
      const items = [...wrap.querySelectorAll(".assignment-button")];
      if (items.length === 0) return 0;

      let idx = items.length; // по умолчанию — в конец

      for (let i = 0; i < items.length; i++) {
        const r = items[i].getBoundingClientRect();

        // Сравниваем по вертикали и горизонтали (для grid)
        const middleY = r.top + r.height / 2;
        const middleX = r.left + r.width / 2;

        // Сначала проверяем строку (Y), потом колонку (X)
        if (clientY < middleY) {
          idx = i;
          break;
        } else if (clientY < r.bottom && clientX < middleX) {
          idx = i;
          break;
        }
      }

      return idx;
    };

    // DRAGSTART на ручке кнопки
    container.addEventListener(
      "dragstart",
      (e) => {
        if (e.target.classList.contains("drag-handle")) {
          isDraggingButton = true;
          // globalDraggingButton будет установлен в обработчике ручки
          console.log("[DnD Buttons] Drag started (container level)");
        }
      },
      true
    );

    // DRAGOVER — показываем маркер
    container.addEventListener("dragover", (e) => {
      const types = e.dataTransfer.types;
      if (!types.includes("application/json")) {
        buttonDropMarker.remove();
        return;
      }

      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      // Вычисляем индекс вставки
      const idx = computeButtonIndex(container, e.clientX, e.clientY);
      buttonDropIndex = idx;

      const buttons = [...container.querySelectorAll(".assignment-button")];

      // Вставляем маркер перед нужной кнопкой (или в конец)
      if (idx < buttons.length) {
        container.insertBefore(buttonDropMarker, buttons[idx]);
      } else {
        // Вставляем перед кнопкой "+"
        const addBtn = container.querySelector(".add-button");
        if (addBtn) {
          container.insertBefore(buttonDropMarker, addBtn);
        } else {
          container.appendChild(buttonDropMarker);
        }
      }
    });

    // DRAGLEAVE — убираем маркер
    container.addEventListener("dragleave", (e) => {
      if (!container.contains(e.relatedTarget)) {
        buttonDropMarker.remove();
        buttonDropIndex = null;
      }
    });

    // DROP — применяем изменения
    container.addEventListener("drop", (e) => {
      let payload = null;
      try {
        payload = JSON.parse(
          e.dataTransfer.getData("application/json") || "{}"
        );
      } catch {}

      if (!payload || payload.kind !== "button") {
        console.warn("[DnD Buttons] Invalid payload:", payload);
        return;
      }

      e.preventDefault();

      const toSectionId = sectionId;
      const targetIndex =
        buttonDropIndex ?? computeButtonIndex(container, e.clientX, e.clientY);

      buttonDropMarker.remove();
      buttonDropIndex = null;
      isDraggingButton = false;

      console.log("[DnD Buttons] Dropping at index:", targetIndex);

      storage.update((d) => {
        const p = d.pages[d.currentPageIndex || 0];
        const fromSection = p.sections[payload.sectionId];
        const toSection = p.sections[toSectionId];
        if (!fromSection || !toSection) return;

        const fromIdx = (fromSection.buttons || []).findIndex(
          (b) => b.id === payload.buttonId
        );
        if (fromIdx < 0) return;

        // Удаляем из старого места
        const [moved] = fromSection.buttons.splice(fromIdx, 1);

        if (!toSection.buttons) toSection.buttons = [];

        // Корректируем индекс если перемещаем внутри той же секции вниз
        let insertAt = targetIndex;
        if (payload.sectionId === toSectionId && fromIdx < targetIndex) {
          insertAt = Math.max(0, targetIndex - 1);
        }
        insertAt = Math.min(Math.max(insertAt, 0), toSection.buttons.length);

        // Вставляем в новое место
        toSection.buttons.splice(insertAt, 0, moved);
      });

      eventBus.emit("ui:toast", {
        type: "info",
        message:
          payload.sectionId === toSectionId
            ? "Button reordered"
            : "Button moved to another section",
      });
    });

    // DRAGEND — сбрасываем всё
    container.addEventListener(
      "dragend",
      () => {
        buttonDropMarker.remove();
        buttonDropIndex = null;
        isDraggingButton = false;
        console.log("[DnD Buttons] Drag ended (cleanup)");
      },
      true
    );
  }

  // === Рендер кнопок ===
  // === Рендер кнопок ===
  section.buttons.forEach((button) => {
    // Фильтр поиска (оставляем как было)
    if (q) {
      const t = (button.text || "").toLowerCase();
      const u = (button.href || "").toLowerCase();
      if (!t.includes(q) && !u.includes(q)) return;
    }

    // Сам элемент плитки
    const btnElement = document.createElement("a");
    btnElement.className = "assignment-button";
    btnElement.dataset.id = button.id;
    btnElement.href = button.href || "#";
    // запрет нативного drag у ссылки и её детей
    btnElement.setAttribute("draggable", "false");

    // Ручка DnD слева
    const handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.title = "Drag to reorder";
    handle.textContent = "⋮⋮";
    btnElement.appendChild(handle);

    // Лейбл (с подсветкой)
    const label = document.createElement("span");
    label.className = "assignment-label";
    if (opts?.query) {
      label.innerHTML = highlightText(button.text || "New button", opts.query);
    } else {
      label.textContent = button.text || "New button";
    }
    btnElement.appendChild(label);

    // Иконка редактирования (справа сверху)
    const editIcon = document.createElement("span");
    editIcon.className = "edit-link";
    editIcon.textContent = "↻";
    editIcon.title = "Edit button";
    editIcon.setAttribute("draggable", "false");
    btnElement.appendChild(editIcon);

    // Блокируем ненужный drag у всей плитки
    btnElement.addEventListener("dragstart", (e) => {
      if (!e.target.classList.contains("drag-handle")) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    // DnD — начинаем перетаскивание по ручке
    handle.draggable = !q; // перетаскиваем только когда поиск выключен
    handle.addEventListener("dragstart", (e) => {
      const dataNow = storage.get();
      const pageNow = dataNow.pages[dataNow.currentPageIndex || 0];
      const secNow = pageNow?.sections?.[sectionId];
      const fromIndex = (secNow?.buttons || []).findIndex(
        (b) => b.id === button.id
      );

      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({
          kind: "button",
          sectionId,
          buttonId: button.id,
          fromIndex,
        })
      );

      btnElement.classList.add("dragging");
      globalDraggingButton = { buttonId: button.id, sectionId };
      console.log("[DnD Buttons] Button drag started:", button.text);
    });
    handle.addEventListener("dragend", () => {
      btnElement.classList.remove("dragging");
      globalDraggingButton = null;
    });

    // Клик по иконке редактирования
    editIcon.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openEditModal(button.id, sectionId);
    });

    // Клик по самой кнопке — открыть ссылку
    btnElement.addEventListener("click", (e) => {
      if (e.target.classList.contains("edit-link")) {
        e.preventDefault();
        return;
      }
      if (!button.href || button.href === "#") {
        e.preventDefault();
        eventBus.emit("ui:toast", {
          type: "info",
          message: "No link set. Click edit to add one.",
        });
        return;
      }
      e.preventDefault();
      eventBus.emit("link:open", { url: button.href });
    });

    container.appendChild(btnElement);
  });

  // Кнопка "+"
  const addBtn = document.createElement("button");
  addBtn.className = "add-button";
  addBtn.textContent = "+";
  addBtn.title = "Add new button";
  addBtn.addEventListener("click", () => addNewButton(sectionId));
  container.appendChild(addBtn);
}

// =============================================================================
// ИНИЦИАЛИЗАЦИЯ МОДУЛЯ
// =============================================================================
export function initButtons() {
  eventBus.on("button:save", saveButton);
  eventBus.on("button:delete", ({ buttonId, sectionId }) =>
    deleteButton(buttonId, sectionId)
  );

  // QUICK ADD: добавляет на целевую страницу в секцию Inbox (создаёт при отсутствии)
  eventBus.on("button:quickAdd", (payload = {}) => {
    const {
      text = "New button",
      href = "",
      targetPageIndex,
      targetPageId,
    } = payload;

    // 1) нормализация URL (если похоже на урл и нет схемы — добавим https://)
    const normalizeUrl = (raw) => {
      const s = (raw || "").trim();
      if (!s) return "";
      try {
        const u = new URL(s, s.startsWith("http") ? undefined : "https://");
        return u.href;
      } catch {
        return s; // не урл — пусть останется как есть
      }
    };

    const data = storage.get();

    // 2) находим страницу-назначение
    let pageIdx =
      typeof targetPageIndex === "number"
        ? targetPageIndex
        : data.currentPageIndex || 0;
    if (targetPageId) {
      const found = (data.pages || []).findIndex((p) => p.id === targetPageId);
      if (found >= 0) pageIdx = found;
    }
    const page = data.pages?.[pageIdx];
    if (!page) {
      eventBus.emit("ui:toast", {
        type: "error",
        message: "Target page not found!",
      });
      return;
    }

    // 3) находим/создаём Inbox
    let inboxId = Object.keys(page.sections || {}).find(
      (id) => (page.sections[id]?.text || "").toLowerCase() === "inbox"
    );
    if (!inboxId) {
      inboxId = `section-${Date.now()}`;
      storage.update((d) => {
        const p = d.pages[pageIdx];
        if (!p.sections) p.sections = {};
        p.sections[inboxId] = { text: "Inbox", buttons: [] };
        if (!Array.isArray(p.sectionsOrder)) p.sectionsOrder = [];
        p.sectionsOrder.unshift(inboxId); // показывать Inbox первым
      });
    }

    const finalHref = normalizeUrl(href);
    const newId = `button-${Date.now()}`;

    // 4) вставляем в начало и избегаем дублей по href
    let added = false;
    storage.update((d) => {
      const p = d.pages[pageIdx];
      const s = p.sections[inboxId];
      if (!s.buttons) s.buttons = [];

      if (finalHref) {
        const dup = s.buttons.find(
          (b) => (b.href || "").toLowerCase() === finalHref.toLowerCase()
        );
        if (dup) return; // дубликат — не добавляем
      }

      const btn = { id: newId, text, href: finalHref };
      s.buttons.unshift(btn); // в начало Inbox
      added = true;
    });

    if (!added) {
      eventBus.emit("ui:toast", { type: "info", message: "Already in Inbox" });
      return;
    }

    // 5) подсказка + прокрутка к новой кнопке
    const secName =
      storage.get().pages[pageIdx].sections[inboxId]?.text || "Inbox";
    const host = new URL(finalHref || "about:blank").hostname || "";
    eventBus.emit("ui:toast", {
      type: "success",
      message: `Added to ${secName}${host ? ` — ${host}` : ""}`,
    });

    // аккуратно подсветим и докрутим
    requestAnimationFrame(() => {
      const el = document.querySelector(
        `.assignment-button[data-id="${newId}"]`
      );
      el?.classList.add("just-added");
      el?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
      setTimeout(() => el?.classList.remove("just-added"), 900);
    });
  });

  console.log("✅ Buttons module initialized");
}
