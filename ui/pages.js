// =============================================================================
// UI/PAGES.JS — Рендеринг текущей страницы
// =============================================================================
// Что здесь:
// - Рендеринг текущей страницы (renderCurrentPage)
// - Переключение между страницами (switchPage)
// - Добавление новой страницы (addNewPage)
// - Инициализация модуля (initPages)
// =============================================================================

import { eventBus } from "../core/event-bus.js";
import { storage } from "../core/storage.js";
import { renderSections } from "./sections.js";

let currentSearchQuery = "";

function mountPageTitleBar(container, page) {
  const bar = document.createElement("div");
  bar.className = "page-titlebar";

  // --- компактный "комбобокс": input + datalist ---
  const d = storage.get();

  const jumperWrap = document.createElement("div");
  jumperWrap.className = "page-jumper-wrap";

  const jumperInput = document.createElement("input");
  jumperInput.type = "text";
  jumperInput.id = "page-jumper"; // важно: тот же id для хоткея Ctrl/Cmd+P
  jumperInput.className = "page-jumper-input";
  jumperInput.placeholder = "Go to… (№ or name)";
  jumperInput.autocomplete = "off";

  const dl = document.createElement("datalist");
  dl.id = "pages-datalist";

  // подсказки: "1: Work", "2: Personal", ...
  (d.pages || []).forEach((p, i) => {
    const opt = document.createElement("option");
    const full =
      typeof p.name === "string" && p.name.trim()
        ? p.name.trim()
        : `Page ${i + 1}`;
    opt.value = `${i + 1}: ${full}`;
    dl.appendChild(opt);
  });

  jumperInput.setAttribute("list", "pages-datalist");

  // парсер "номер/название"
  const resolvePageIndex = (q) => {
    const s = (q || "").trim();
    if (!s) return null;

    // чистое число (1-based)
    if (/^\d+$/.test(s)) {
      const idx = Math.max(
        0,
        Math.min((d.pages?.length || 1) - 1, parseInt(s, 10) - 1)
      );
      return idx;
    }
    // паттерн "12: ..."
    const m = s.match(/^(\d+)\s*:/);
    if (m) {
      const idx = Math.max(
        0,
        Math.min((d.pages?.length || 1) - 1, parseInt(m[1], 10) - 1)
      );
      return idx;
    }
    // поиск по имени (contains, case-insensitive)
    const lower = s.toLowerCase();
    const found = (d.pages || []).findIndex((pp, ii) => {
      const nm =
        typeof pp.name === "string" && pp.name.trim()
          ? pp.name.trim()
          : `Page ${ii + 1}`;
      return nm.toLowerCase().includes(lower);
    });
    return found >= 0 ? found : null;
  };

  const jumpTo = (idx) => {
    if (idx == null) {
      eventBus.emit("ui:toast", { type: "warning", message: "Page not found" });
      return;
    }
    eventBus.emit("page:switch", { pageIndex: idx });
    eventBus.emit("pagination:scrollTo", { pageIndex: idx });
    jumperInput.blur();
  };

  // === КАСТОМНОЕ ВЫПАДАЮЩЕЕ МЕНЮ (вместо datalist) ===
  // ВАЖНО: у wrapper в CSS будет position: relative;
  const pop = document.createElement("div");
  pop.className = "page-jumper-popover";
  pop.hidden = true;

  // Список страниц (имя + индекс)
  const pages = (d.pages || []).map((p, i) => ({
    index: i,
    name:
      typeof p.name === "string" && p.name.trim()
        ? p.name.trim()
        : `Page ${i + 1}`,
  }));

  let activeIdx = -1; // индекс подсвеченного пункта в поповере

  const openPopover = () => {
    pop.hidden = false;
    setActive(-1);
  };
  const closePopover = () => {
    pop.hidden = true;
    activeIdx = -1;
  };
  const setActive = (newIdx) => {
    const items = pop.querySelectorAll(".page-jumper-item");
    items.forEach((el, idx) => el.classList.toggle("active", idx === newIdx));
    activeIdx = newIdx;
    if (activeIdx >= 0 && items[activeIdx]) {
      items[activeIdx].scrollIntoView({ block: "nearest" });
    }
  };

  const buildList = (q) => {
    const s = (q || "").trim().toLowerCase();
    let list = pages;

    if (s) {
      if (/^\d+$/.test(s)) {
        const want = parseInt(s, 10) - 1; // 1-based → 0-based
        list = pages.filter((p) => p.index === want);
      } else {
        list = pages.filter((p) => p.name.toLowerCase().includes(s));
      }
    }

    pop.innerHTML = "";
    list.forEach((p) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "page-jumper-item";
      btn.dataset.index = String(p.index);
      btn.innerHTML = `<span class="num">${
        p.index + 1
      }</span><span class="name">${p.name}</span>`;
      // mousedown — чтобы успеть выбрать до blur инпута
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        jumpTo(p.index);
        closePopover();
      });
      pop.appendChild(btn);
    });

    openPopover();
  };

  // Показываем/фильтруем меню
  jumperInput.addEventListener("focus", () => buildList(jumperInput.value));
  jumperInput.addEventListener("input", () => buildList(jumperInput.value));
  // Закрыть, если ушли фокусом (даём время клику по пункту)
  jumperInput.addEventListener("blur", () => setTimeout(closePopover, 120));

  // Клавиатура: ↑/↓, Enter, Esc
  jumperInput.addEventListener("keydown", (e) => {
    const items = pop.querySelectorAll(".page-jumper-item");

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (pop.hidden) buildList(jumperInput.value);
      else setActive(Math.min(items.length - 1, activeIdx + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(-1, activeIdx - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (!pop.hidden && activeIdx >= 0 && items[activeIdx]) {
        const idx = parseInt(items[activeIdx].dataset.index, 10);
        jumpTo(idx);
        closePopover();
      } else {
        const idx = resolvePageIndex(jumperInput.value);
        jumpTo(idx);
        closePopover();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      closePopover();
      return;
    }
  });

  jumperWrap.appendChild(jumperInput);
  jumperWrap.appendChild(pop);
  bar.appendChild(jumperWrap);

  // --- Заголовок страницы + иконка редактирования ---
  const title = document.createElement("span");
  title.className = "page-title-text";
  title.textContent = page.name || `Page ${page.index + 1}`;

  const edit = document.createElement("button");
  edit.className = "page-edit-icon ui-icon-btn ui-icon-16";
  edit.title = "Rename page";
  edit.type = "button";
  edit.textContent = "↻";

  const enterEdit = () => {
    const wrap = document.createElement("div");
    wrap.className = "page-title-edit";

    const input = document.createElement("input");
    input.className = "page-title-input";
    input.value = page.name || "";
    input.placeholder = "Page name";
    wrap.appendChild(input);

    const commit = () => {
      const next = (input.value || "").trim();
      if (!next) {
        eventBus.emit("ui:toast", {
          type: "warning",
          message: "Page name cannot be empty!",
        });
        input.focus();
        return;
      }
      storage.update((d) => {
        const idx = d.currentPageIndex || 0;
        if (d.pages[idx]) d.pages[idx].name = next;
      });
      // перерендер придёт по storage:updated
    };
    const cancel = () => {
      renderCurrentPage();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") cancel();
    });
    input.addEventListener("blur", commit);

    bar.innerHTML = "";
    bar.appendChild(wrap);
    input.focus();
    input.select();
  };

  edit.addEventListener("click", (e) => {
    e.preventDefault();
    enterEdit();
  });
  title.addEventListener("dblclick", enterEdit);

  //bar.appendChild(title);
  //bar.appendChild(edit);

  // --- Collapse/Expand ALL sections on this page ---
  const computeAllCollapsed = () => {
    const dnow = storage.get();
    const p = dnow.pages[dnow.currentPageIndex || 0];
    const list = Object.values(p.sections || {});
    if (list.length === 0) return false;
    return list.every((s) => !!s.collapsed);
  };

  const setAllCollapsed = (next) => {
    storage.update((d) => {
      const p = d.pages[d.currentPageIndex || 0];
      Object.values(p.sections || {}).forEach((s) => (s.collapsed = !!next));
    });
    // Ререндер придёт через storage:updated → mountPageTitleBar вызовется снова
  };

  const allToggle = document.createElement("button");
  allToggle.type = "button";
  allToggle.className = "page-collapse-all ui-icon-btn ui-icon-16";
  const refreshAllToggle = () => {
    const all = computeAllCollapsed();
    allToggle.textContent = all ? "▸▸" : "▾▾";
    allToggle.title = all ? "Expand all sections" : "Collapse all sections";
  };
  refreshAllToggle();

  allToggle.addEventListener("click", (e) => {
    e.preventDefault();
    const next = !computeAllCollapsed();
    setAllCollapsed(next);
  });
  // Кнопка "свернуть/развернуть все" — сразу после джампера
  bar.appendChild(allToggle);
  // порядок в баре: [jumper]  [title] [edit] [allToggle]
  bar.appendChild(title);
  bar.appendChild(edit);
  //bar.appendChild(allToggle);

  container.appendChild(bar);
}

// =============================================================================
// РЕНДЕРИНГ ТЕКУЩЕЙ СТРАНИЦЫ
// =============================================================================
/**
 * Отрендерить содержимое текущей страницы (секции + кнопки)
 * Эта функция перерисовывает весь контент внутри #app-body
 */
export function renderCurrentPage() {
  const container = document.getElementById("app-body");
  if (!container) {
    console.error("[pages] #app-body not found");
    return;
  }

  // Очищаем контейнер
  container.innerHTML = "";

  const data = storage.get();
  const page = data.pages[data.currentPageIndex || 0];

  // Проверка: есть ли страницы вообще?
  if (!data.pages || data.pages.length === 0) {
    container.innerHTML = `
      <div class="body-empty">
        <p>No pages found. Please create a page first.</p>
      </div>
    `;
    return;
  }

  // Проверка: существует ли текущая страница?
  if (!page) {
    container.innerHTML = `
      <div class="body-empty">
        <p>Current page not found.</p>
      </div>
    `;
    return;
  }

  // Заголовок страницы (по центру) + иконка редактирования
  mountPageTitleBar(container, {
    name: page.name,
    index: data.currentPageIndex || 0,
  });

  // Создаём кнопку "Добавить секцию" (будет внизу, после всех секций)
  const addSectionBtn = document.createElement("button");
  addSectionBtn.className = "add-section";
  addSectionBtn.id = "addSectionBtn";
  addSectionBtn.textContent = "+ Add section";
  addSectionBtn.addEventListener("click", () => {
    eventBus.emit("section:add");
  });

  // Рендерим все секции страницы (через модуль sections.js)
  renderSections(container, { query: currentSearchQuery });

  // Добавляем кнопку "+ Add section" в конец
  container.appendChild(addSectionBtn);

  console.log(`[pages] Rendered page ${data.currentPageIndex + 1}`);
}

// =============================================================================
// ПЕРЕКЛЮЧЕНИЕ МЕЖДУ СТРАНИЦАМИ
// =============================================================================
/**
 * Переключиться на указанную страницу
 * @param {number} pageIndex - Индекс страницы (начиная с 0)
 */
export function switchPage(pageIndex) {
  const data = storage.get();

  // Проверка: валидный ли индекс?
  if (pageIndex < 0 || pageIndex >= data.pages.length) {
    eventBus.emit("ui:toast", {
      type: "error",
      message: "Page not found!",
    });
    return;
  }

  // Обновляем текущий индекс страницы
  storage.update((data) => {
    data.currentPageIndex = pageIndex;
  });

  // Перерисовываем содержимое
  renderCurrentPage();

  // Уведомляем систему о переключении страницы
  eventBus.emit("pages:switched", { pageIndex });

  console.log(`[pages] Switched to page ${pageIndex + 1}`);
}

// =============================================================================
// ДОБАВЛЕНИЕ НОВОЙ СТРАНИЦЫ
// =============================================================================
/**
 * Добавить новую страницу с дефолтной секцией и кнопкой
 */
export function addNewPage() {
  const data = storage.get();

  // Генерируем уникальные ID для новой страницы, секции и кнопки
  const timestamp = Date.now();
  const newPageId = `page-${timestamp}`;
  const newSectionId = `section-${timestamp}`;
  const newButtonId = `button-${timestamp}`;

  // Создаём структуру новой страницы
  const newPage = {
    id: newPageId,
    name: `Page ${data.pages.length + 1}`,
    sections: {
      [newSectionId]: {
        text: "New Section",
        buttons: [
          {
            id: newButtonId,
            text: "New button",
            href: "",
          },
        ],
      },
    },
  };

  // Добавляем страницу в данные
  storage.update((data) => {
    data.pages.push(newPage);
    // Переключаемся на новую страницу
    data.currentPageIndex = data.pages.length - 1;
  });

  // Перерисовываем содержимое
  renderCurrentPage();

  // Уведомляем систему о добавлении страницы
  eventBus.emit("pages:added", { pageId: newPageId });

  // Показываем уведомление
  eventBus.emit("ui:toast", {
    type: "success",
    message: `Page ${data.pages.length} created!`,
  });

  console.log(`[pages] Added new page: ${newPage.name}`);
}

// =============================================================================
// УДАЛЕНИЕ ТЕКУЩЕЙ СТРАНИЦЫ
// =============================================================================
/**
 * Удалить текущую страницу
 * (ВАЖНО: не удаляем последнюю страницу — должна остаться хотя бы одна)
 */
export function deleteCurrentPage() {
  const data = storage.get();

  // Проверка: это последняя страница?
  if (data.pages.length <= 1) {
    eventBus.emit("ui:toast", {
      type: "warning",
      message: "Cannot delete the last page!",
    });
    return;
  }

  const currentIndex = data.currentPageIndex || 0;
  const page = data.pages[currentIndex];

  // Подтверждение удаления
  eventBus.emit("modal:confirm:open", {
    title: "Delete Page?",
    message: `Are you sure you want to delete "${page.name}"? All sections and buttons will be lost.`,
    onConfirm: () => {
      // Удаляем страницу
      storage.update((data) => {
        data.pages.splice(currentIndex, 1);

        // Если удалили последнюю страницу — переходим на предыдущую
        if (data.currentPageIndex >= data.pages.length) {
          data.currentPageIndex = data.pages.length - 1;
        }
      });

      // Перерисовываем содержимое
      renderCurrentPage();

      // Уведомляем систему об удалении
      eventBus.emit("pages:deleted", { pageIndex: currentIndex });

      // Показываем уведомление
      eventBus.emit("ui:toast", {
        type: "info",
        message: "Page deleted",
      });
    },
  });
}

export function deletePageAt(index) {
  const data = storage.get();
  if (data.pages.length <= 1) {
    eventBus.emit("ui:toast", {
      type: "warning",
      message: "Cannot delete the last page!",
    });
    return;
  }
  if (index < 0 || index >= data.pages.length) {
    eventBus.emit("ui:toast", { type: "error", message: "Page not found!" });
    return;
  }
  const page = data.pages[index];

  eventBus.emit("modal:confirm:open", {
    title: "Delete Page?",
    message: `Are you sure you want to delete "${page.name}"? All sections and buttons will be lost.`,
    onConfirm: () => {
      storage.update((d) => {
        d.pages.splice(index, 1);
        if (d.currentPageIndex >= d.pages.length) {
          d.currentPageIndex = d.pages.length - 1;
        }
      });
      renderCurrentPage();
      eventBus.emit("pages:deleted", { pageIndex: index });
      eventBus.emit("ui:toast", { type: "info", message: "Page deleted" });
    },
  });
}

export function renameCurrentPage() {
  const data = storage.get();
  const currentIndex = data.currentPageIndex || 0;
  const page = data.pages[currentIndex];

  if (!page) {
    eventBus.emit("ui:toast", {
      type: "error",
      message: "Current page not found",
    });
    return;
  }

  const oldName =
    typeof page.name === "string" && page.name.trim()
      ? page.name.trim()
      : `Page ${currentIndex + 1}`;

  const input = prompt("Page name:", oldName);
  if (input === null) return; // cancel

  const newName = input.trim();
  if (!newName) {
    eventBus.emit("ui:toast", {
      type: "warning",
      message: "Name cannot be empty",
    });
    return;
  }

  storage.update((d) => {
    d.pages[currentIndex].name = newName;
  });

  // перерендерим текущую страницу (и пагинатор обновится через storage:updated)
  renderCurrentPage();

  eventBus.emit("ui:toast", { type: "success", message: "Page renamed" });
  console.log(`[pages] Renamed page ${currentIndex + 1} → "${newName}"`);
}

// =============================================================================
// ИНИЦИАЛИЗАЦИЯ МОДУЛЯ
// =============================================================================
/**
 * Инициализировать обработчики событий для работы со страницами
 */
export function initPages() {
  // Слушаем изменения в storage — перерисовываем страницу
  eventBus.on("storage:updated", () => {
    renderCurrentPage();
  });

  // Слушаем событие переключения страницы
  eventBus.on("page:switch", ({ pageIndex }) => {
    switchPage(pageIndex);
  });

  // Слушаем событие добавления новой страницы
  eventBus.on("page:add", addNewPage);

  // Слушаем событие удаления текущей страницы
  eventBus.on("page:delete", deleteCurrentPage);

  // Первичный рендер при загрузке
  renderCurrentPage();

  console.log("✅ Pages module initialized");

  eventBus.on("search:query", ({ q }) => {
    currentSearchQuery = (q || "").trim();
    renderCurrentPage();
  });

  eventBus.on("page:deleteAt", ({ pageIndex }) => deletePageAt(pageIndex));

  eventBus.on("search:clear", () => {
    currentSearchQuery = "";
    renderCurrentPage();
  });
}
