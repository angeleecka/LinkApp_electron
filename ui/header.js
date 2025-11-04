// ui/header.js
import { eventBus } from "../core/event-bus.js";
import { storage } from "../core/storage.js";
import { headerHTML } from "./header.view.js";

export function initHeader() {
  const el = document.getElementById("app-header");
  if (!el) {
    console.error("initHeader: #app-header not found");
    return;
  }

  el.innerHTML = headerHTML();
  // ЛОГО → модалка «О приложении»
  el.querySelector(".logo-btn")?.addEventListener("click", () => {
    eventBus.emit("ui:about:open");
  });

  // ===== Helpers =====
  const esc = (s = "") =>
    String(s).replace(
      /[&<>"]/g,
      (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch])
    );

  function openSaveAsModal(defaultName = "") {
    const body = `
      <div class="modal-form">
        <label for="saveAsName">Name</label>
        <input id="saveAsName" type="text" placeholder="e.g. My links" value="${esc(
          defaultName
        )}"/>
        <div class="actions">
          <button class="btn" data-act="cancel">Cancel</button>
          <button class="btn save" data-act="ok">Save</button>
        </div>
      </div>`;
    eventBus.emit("modal:custom:open", {
      title: "Save As…",
      bodyHTML: body,
      onMount: (root) => {
        const input = root.querySelector("#saveAsName");
        input?.focus();
        input?.select();
        const submit = () => {
          const name = (input?.value || "").trim();
          if (!name) return;

          // 1) создаём/переключаемся на новый набор
          const maybePromise = storage.saves.upsert(name);

          // 2) если upsert вдруг асинхронный — дождёмся, затем эмит
          if (maybePromise && typeof maybePromise.then === "function") {
            maybePromise.then(() => {
              eventBus.emit("storage:saved", { at: Date.now(), by: "saveAs" });
              eventBus.emit("modal:close");
            });
          } else {
            // синхронный случай
            eventBus.emit("storage:saved", { at: Date.now(), by: "saveAs" });
            eventBus.emit("modal:close");
          }
        };

        root
          .querySelector('[data-act="ok"]')
          ?.addEventListener("click", submit);
        root
          .querySelector('[data-act="cancel"]')
          ?.addEventListener("click", () => eventBus.emit("modal:close"));
        input?.addEventListener("keydown", (e) => {
          if (e.key === "Enter") submit();
        });
      },
    });
  }

  // Возвращает «полосу» внутри header, учитывая внутренние отступы .header-inner
  function getHeaderStripeRect() {
    const header = document.getElementById("app-header");
    const inner =
      header?.querySelector(".header-inner") || header || document.body;

    const r = inner.getBoundingClientRect();
    const cs = getComputedStyle(inner);
    const pl = parseFloat(cs.paddingLeft) || 0;
    const pr = parseFloat(cs.paddingRight) || 0;

    // Контентная «полоса» внутри header
    const left = Math.round(r.left + pl);
    const width = Math.max(0, Math.round(r.width - pl - pr));

    // Верх — сразу под низом шапки
    const headerBottom = header?.getBoundingClientRect().bottom || r.bottom;

    return { top: Math.round(headerBottom), left, width };
  }

  function openSnapshotModal() {
    const body = `
      <div class="modal-form">
        <label for="snapshotName">Snapshot name</label>
        <input id="snapshotName" type="text" placeholder="e.g. Backup – ${new Date().toLocaleString()}"/>
        <div class="actions">
          <button class="btn" data-act="cancel">Cancel</button>
          <button class="btn save" data-act="ok">Create</button>
        </div>
      </div>`;
    eventBus.emit("modal:custom:open", {
      title: "Create Snapshot",
      bodyHTML: body,
      onMount: (root) => {
        const input = root.querySelector("#snapshotName");
        input?.focus();
        const submit = () => {
          const name = (input?.value || "").trim();
          storage.sessions.save(name);
          eventBus.emit("modal:close");
        };
        root
          .querySelector('[data-act="ok"]')
          ?.addEventListener("click", submit);
        root
          .querySelector('[data-act="cancel"]')
          ?.addEventListener("click", () => eventBus.emit("modal:close"));
        input?.addEventListener("keydown", (e) => {
          if (e.key === "Enter") submit();
        });
      },
    });
  }

  const burgerBtn = el.querySelector(".burger-btn");
  const burgerPop = el.querySelector(".header-burger-popover");
  const qaInput = el.querySelector("#quickAddInput");
  const qaBtn = el.querySelector(".qa-go");
  const searchInput = el.querySelector("#searchInput");
  const searchClear = el.querySelector(".search-clear");
  const searchTrigger = el.querySelector(".search-trigger");
  const searchPop = el.querySelector(".header-search-popover");
  const searchInputMobile = el.querySelector("#searchInputMobile");

  // Мобильный поиск (поповер)
  const emitSearchValue = (val) =>
    eventBus.emit("search:query", { q: (val || "").trim() });

  // Возвращает прямоугольник «доступной области LinkApp» с учётом панели
  // Возвращает прямоугольник «полосы LinkApp» (учитывая панель и page gutter)
  // Прямоугольник «полосы LinkApp» (по #app-body), с учётом внутренних отступов
  // Прямоугольник «полосы LinkApp», устойчиво к панели
  // Прямоугольник «полосы LinkApp», с учётом панели И видимой ширины (clientWidth)
  function getLinkAppViewportRect() {
    const headerBottom =
      document.getElementById("app-header")?.getBoundingClientRect().bottom ||
      0;

    // где реально рисуем контент
    const host =
      document.getElementById("app-body") ||
      document.getElementById("linkapp-root") ||
      document.body;

    const hostRect = host.getBoundingClientRect();

    // ширина с вычетом вертикального скроллбара (если он есть)
    const visible = host.clientWidth || hostRect.width;

    // внутренние поля полосы
    const cs = getComputedStyle(document.documentElement);
    const gutter = parseInt(cs.getPropertyValue("--page-gutter")) || 12;

    const left = Math.round(hostRect.left) + gutter;
    const width = Math.max(0, visible - gutter * 2);

    return { top: Math.round(headerBottom), left, width };
  }

  // helpers рядом с другими утилитами в initHeader (выше обработчика)
  function getHeaderStripRect() {
    const host =
      document.querySelector("#app-header .header-inner") ||
      document.getElementById("app-header");
    const r = host.getBoundingClientRect();
    const GAP_LR = 8;
    return {
      top: Math.round(r.bottom),
      left: Math.round(r.left) + GAP_LR,
      width: Math.max(0, Math.round(r.width) - GAP_LR * 2),
    };
  }
  function getScrollbarWidthOf(el) {
    if (!el) return 0;
    return Math.max(0, el.offsetWidth - el.clientWidth);
  }

  searchTrigger?.addEventListener("click", () => {
    if (searchPop && searchPop.parentElement !== document.body) {
      document.body.appendChild(searchPop);
    }

    const rect = getHeaderStripRect();
    const scrollHost =
      document.getElementById("app-body") ||
      document.querySelector("#linkapp-root") ||
      document.body;
    const sbw = getScrollbarWidthOf(scrollHost);
    const SIDE_PAD = 8;

    const maxW = rect.width - (SIDE_PAD * 2 + sbw);
    const w = Math.max(240, Math.min(420, maxW));

    let leftPx = Math.round(rect.left + (rect.width - w) / 2);
    const leftClamp = rect.left;
    const rightClamp = rect.left + rect.width - w - sbw;
    if (leftPx < leftClamp) leftPx = leftClamp;
    if (leftPx > rightClamp) leftPx = rightClamp;

    Object.assign(searchPop.style, {
      position: "fixed",
      boxSizing: "border-box",
      width: w + "px",
      left: leftPx + "px",
      top: Math.round(rect.top + 8) + "px",
      right: "auto",
      transform: "none",
      paddingLeft: SIDE_PAD + "px",
      paddingRight: SIDE_PAD + sbw + "px",
    });

    searchPop.hidden = !searchPop.hidden;
    if (!searchPop.hidden) {
      searchInputMobile?.focus();
      searchInputMobile?.select();
    }
  });

  searchInputMobile?.addEventListener("input", (e) =>
    emitSearchValue(e.target.value)
  );
  searchInputMobile?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      emitSearchValue(e.target.value);
      searchPop.hidden = true;
    }
    if (e.key === "Escape") {
      searchPop.hidden = true;
    }
  });

  document.addEventListener("click", (e) => {
    const clickedInsidePopover = e.target.closest(".header-search-popover");
    const clickedTrigger = e.target.closest(".search-trigger");
    if (!searchPop?.hidden && !clickedInsidePopover && !clickedTrigger) {
      searchPop.hidden = true;
    }
  });

  window.addEventListener("resize", () =>
    searchPop?.setAttribute("hidden", "")
  );

  // Основной Save
  el.querySelector(".primary-save")?.addEventListener("click", () => {
    const hasActive = !!storage.saves?.getActiveName?.();
    if (hasActive) {
      storage.saves.saveActive();
      eventBus.emit("storage:saved", { at: Date.now(), by: "toolbar" });
    } else {
      openSaveAsModal("");
    }
  });

  el.querySelector(".save-as-btn")?.addEventListener("click", () => {
    openSaveAsModal(storage.saves?.getActiveName?.() || "");
  });

  el.querySelector(".snapshot-btn")?.addEventListener(
    "click",
    openSnapshotModal
  );
  el.querySelector(".workspaces-btn")?.addEventListener("click", () =>
    eventBus.emit("ui:sessions:open")
  );

  // Toolbar-иконки
  el.querySelector('[data-action="open"]')?.addEventListener("click", () =>
    eventBus.emit("file:import")
  );
  el.querySelector('[data-action="export"]')?.addEventListener("click", () =>
    eventBus.emit("storage:exportJSON")
  );
  el.querySelector('[data-action="history"]')?.addEventListener("click", () =>
    eventBus.emit("history:open")
  );
  el.querySelector('[data-action="settings"]')?.addEventListener("click", () =>
    eventBus.emit("ui:settings:open")
  );

  // Quick Add
  const parseQuickAddValue = (raw) => {
    const s = (raw || "").trim();
    if (!s) return null;
    if (s.includes("|")) {
      const [t, u] = s.split("|");
      return { text: (t || "").trim(), href: (u || "").trim() };
    }
    try {
      const url = new URL(s.startsWith("http") ? s : `https://${s}`);
      return { text: url.hostname.replace(/^www\./, ""), href: url.href };
    } catch {
      return { text: s, href: "" };
    }
  };
  const handleQuickAdd = () => {
    const parsed = parseQuickAddValue(qaInput?.value || "");
    if (!parsed) return;
    const d = storage.get();
    const idx = d.currentPageIndex || 0;
    const pid = d.pages[idx]?.id || null;
    eventBus.emit("button:quickAdd", {
      ...parsed,
      targetPageIndex: idx,
      targetPageId: pid,
    });
    qaInput.value = "";
  };
  qaBtn?.addEventListener("click", handleQuickAdd);
  qaInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleQuickAdd();
  });

  // Поиск (десктоп)
  const emitSearch = () =>
    eventBus.emit("search:query", { q: (searchInput?.value || "").trim() });
  searchInput?.addEventListener("input", emitSearch);
  searchClear?.addEventListener("click", () => {
    if (!searchInput) return;
    searchInput.value = "";
    eventBus.emit("search:clear");
    searchInput.focus();
  });

  // Бургер
  if (burgerPop && burgerPop.parentElement !== document.body) {
    document.body.appendChild(burgerPop);
  }
  burgerBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const headerRect = document
      .getElementById("app-header")
      ?.getBoundingClientRect();
    const btnRect = burgerBtn.getBoundingClientRect();
    burgerPop.style.position = "fixed";
    burgerPop.style.top =
      (headerRect ? Math.round(headerRect.bottom + 8) : 64) + "px";
    burgerPop.style.right =
      Math.max(12, window.innerWidth - btnRect.right) + "px";
    burgerPop.style.left = "auto";
    burgerPop.hidden = !burgerPop.hidden;
  });
  document.addEventListener("click", (e) => {
    if (
      !burgerPop.hidden &&
      !burgerPop.contains(e.target) &&
      !burgerBtn.contains(e.target)
    ) {
      burgerPop.hidden = true;
    }
  });
  window.addEventListener("resize", () => {
    burgerPop.hidden = true;
  });
  burgerPop?.addEventListener("mousedown", (e) => e.stopPropagation());

  // Команды поповера бургера
  burgerPop?.addEventListener("click", async (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    burgerPop.hidden = true;

    if (act === "save") {
      const hasActive = !!storage.saves?.getActiveName?.();
      if (hasActive) {
        storage.saves.saveActive();
        eventBus.emit("storage:saved", { at: Date.now(), by: "toolbar" });
      } else {
        openSaveAsModal(storage.saves?.getActiveName?.() || "");
      }
      return;
    }
    if (act === "saveAs") {
      openSaveAsModal(storage.saves?.getActiveName?.() || "");
      return;
    }
    if (act === "snapshot") {
      openSnapshotModal();
      return;
    }
    if (act === "workspaces") {
      eventBus.emit("ui:sessions:open");
      return;
    }
    if (act === "open") {
      eventBus.emit("file:import");
      return;
    }
    if (act === "export") {
      eventBus.emit("storage:exportJSON");
      return;
    }
    if (act === "history") {
      eventBus.emit("history:open");
      return;
    }
    if (act === "settings") {
      eventBus.emit("ui:settings:open");
      return;
    }

    if (act === "openData") {
      if (window.desktop?.platform?.openDataFolder) {
        await window.desktop.platform.openDataFolder();
      } else {
        eventBus.emit("ui:toast", { type: "info", message: "Desktop only" });
      }
      return;
    }
    if (act === "revealState") {
      if (window.desktop?.platform?.revealStateFile) {
        await window.desktop.platform.revealStateFile();
      } else {
        eventBus.emit("ui:toast", { type: "info", message: "Desktop only" });
      }
      return;
    }
  });

  // Скрыть desktop-only команды, если не Electron
  const isDesktop = !!window.desktop?.platform;
  if (!isDesktop) {
    burgerPop?.querySelector('[data-act="openData"]')?.remove();
    burgerPop?.querySelector('[data-act="revealState"]')?.remove();
  }

  // Хоткеи
  // Хоткей Save (Ctrl/Cmd+S) — надёжный, в capture-режиме и через e.code
  function onGlobalSaveHotkey(e) {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const mod = isMac ? e.metaKey : e.ctrlKey;

    if (mod && !e.shiftKey && !e.altKey && e.code === "KeyS") {
      e.preventDefault();
      e.stopPropagation(); // защищаемся от чужих слушателей

      const hasActive = !!storage.saves?.getActiveName?.();
      if (hasActive) {
        const maybe = storage.saves?.saveActive?.();
        Promise.resolve(maybe).then(() => {
          eventBus.emit("storage:saved", { at: Date.now(), by: "hotkey" });
        });
      } else {
        openSaveAsModal("");
      }
    }
  }
  window.addEventListener("keydown", onGlobalSaveHotkey, true); // capture=true

  // Быстрый фокус: "/" → поиск, Ctrl/Cmd+Shift+N → Quick Add
  window.addEventListener("keydown", (e) => {
    const t = e.target;
    const typing =
      t &&
      (t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.isContentEditable);
    if (!typing && e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      searchInput?.focus();
    }
    if (!typing) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (cmdOrCtrl && e.shiftKey && (e.key === "N" || e.key === "n")) {
        e.preventDefault();
        qaInput?.focus();
      }
    }
  });

  console.log("✅ Header initialized");
}

// === Global Save hotkey (Ctrl/Cmd+S), раскладка-независимо, capture ===
(function bindSaveHotkeyOnce() {
  if (window.__linkappSaveHotkeyBound) return;
  window.__linkappSaveHotkeyBound = true;

  function onGlobalSaveHotkey(e) {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const mod = isMac ? e.metaKey : e.ctrlKey;

    // Не зависит от раскладки: проверяем e.code === "KeyS"
    if (mod && !e.shiftKey && !e.altKey && e.code === "KeyS") {
      e.preventDefault();
      e.stopPropagation(); // перебиваем браузерное "Save Page As" и другие слушатели

      const hasActive = !!storage.saves?.getActiveName?.();
      if (hasActive) {
        const p = storage.saves?.saveActive?.();
        Promise.resolve(p).then(() => {
          eventBus.emit("storage:saved", { at: Date.now(), by: "hotkey" });
          eventBus.emit("ui:toast", { type: "success", message: "Saved" });
        });
      } else {
        // если имя ещё не задано — открываем твоё Save As…
        if (typeof openSaveAsModal === "function") openSaveAsModal("");
      }
    }
  }

  // capture=true, чтобы перехватить событие раньше других обработчиков
  window.addEventListener("keydown", onGlobalSaveHotkey, true);
  console.log("✅ Save hotkey bound (capture, code=KeyS)");
})();

// Глобальное делегирование по data-action (надёжно при любом ререндере)
document.addEventListener(
  "click",
  (e) => {
    const actBtn = e.target.closest("[data-action]");
    if (!actBtn) return;
    switch (actBtn.dataset.action) {
      case "study-toggle":
        e.preventDefault();
        eventBus.emit("study:toggle");
        break;
      // добавляй другие data-action при необходимости
    }
  },
  true
);

// === LinkApp viewport vars for modals/popovers ===
function updateLinkAppViewportVars() {
  const host =
    document.getElementById("app-body") ||
    document.getElementById("linkapp-root") ||
    document.body;

  const r = host.getBoundingClientRect();
  const cs = getComputedStyle(document.documentElement);
  const gutter = parseInt(cs.getPropertyValue("--page-gutter")) || 12;

  const left = Math.round(r.left + gutter);
  const width = Math.max(0, Math.round(r.width - gutter * 2));

  document.documentElement.style.setProperty("--linkapp-left", left + "px");
  document.documentElement.style.setProperty("--linkapp-width", width + "px");
}

// Обновляем при загрузке и ресайзе
updateLinkAppViewportVars();
window.addEventListener("resize", updateLinkAppViewportVars);

// Когда меняется состояние панели — после её раскладки чуть позже, чтобы DOM успел переложиться
eventBus.on("study:toggle", () => {
  requestAnimationFrame(() => updateLinkAppViewportVars());
  setTimeout(updateLinkAppViewportVars, 0);
});

// Перед открытием любых наших модалок — обновим ещё раз на всякий
[
  "modal:custom:open",
  "ui:settings:open",
  "ui:sessions:open",
  "history:open",
  "ui:about:open",
].forEach((ev) =>
  eventBus.on(ev, () => {
    updateLinkAppViewportVars();
    // небольшой defer, если модалка монтируется асинхронно
    requestAnimationFrame(updateLinkAppViewportVars);
  })
);
