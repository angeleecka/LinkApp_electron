// ui/header.js
import { eventBus } from "../core/event-bus.js";
import { storage } from "../core/storage.js";

export function initHeader() {
  const el = document.getElementById("app-header");
  if (!el) {
    console.error("initHeader: #app-header not found");
    return;
  }

  el.innerHTML = `
    <div class="header-inner">
      <div class="header-left">
        <button class="logo-btn" title="О приложении">
          <span class="app-title">LinkApp</span>
        </button>

        <!-- Основной SAVE (сохранение текущих данных) -->
        <button class="icon-btn primary-save" title="Save (Ctrl/Cmd+S)" aria-label="Save">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M5 3h10l4 4v14H5z" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M7 3v6h8V3" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M7 21v-7h10v7" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>

      <div class="header-right">
        <!-- Save As… -->
        <button class="icon-btn save-as-btn" title="Save As…" aria-label="Save As">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M5 3h10l4 4v14H5z" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M7 3v6h8V3" fill="none" stroke="currentColor" stroke-width="2"/>
            <!-- Зелёный кружок с плюсом -->
            <circle cx="16.5" cy="18.5" r="5" fill="currentColor" opacity="0.9"/>
            <path d="M16.5 16v5M14 18.5h5" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>

        <!-- Quick Add -->
        <div class="quick-add input-wrap">
          <input id="quickAddInput" type="text" placeholder='Paste URL or "Title | URL"' title="Quick Save" />
          <button type="button" class="input-suffix qa-go" title="Add" aria-label="Add">+</button>
        </div>

        <!-- Search -->
        <div class="search-box input-wrap">
          <input id="searchInput" type="text" placeholder="Search title or URL" />
          <button type="button" class="input-suffix search-clear" title="Clear" aria-label="Clear">✕</button>
        </div>

        <!-- Действия (иконки, без текста) -->
        <button class="icon-btn snapshot-btn" title="Snapshot (save copy)" aria-label="Snapshot">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M12 3l9 5-9 5-9-5 9-5z" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M21 12l-9 5-9-5" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M21 16l-9 5-9-5" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>

        <button class="icon-btn workspaces-btn" title="Workspaces" aria-label="Workspaces">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M8 7a3 3 0 0 1 6 0m4 3a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M6 10a4 4 0 1 0 0 8h3v-2M18 10a4 4 0 1 1 0 8h-3v-2" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>

        <button class="icon-btn" data-action="data-folder" title="Data Folder" aria-label="Data Folder">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M3 7h6l2 2h10v10H3z" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>

        <button class="icon-btn" data-action="open" title="Open…" aria-label="Open">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M3 7h6l2 2h10v10H3z" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>

        <button class="icon-btn" data-action="export" title="Export JSON" aria-label="Export">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M5 21h14" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>

        <button class="icon-btn" data-action="history" title="Trash / History" aria-label="Trash">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M3 6h18M8 6v-2h8v2M6 6l1 14h10l1-14" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>

        <button class="icon-btn" data-action="settings" title="Settings" aria-label="Settings">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm8 4l2 1-2 1-.5 2.2-2.2.5L15 19l-1 2-1-2-3.3-.3-2.2-.5L6 16l-2-1 2-1 .5-2.2 2.2-.5L9 5l1-2 1 2 3.3.3 2.2.5L18 8z" fill="none" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>

        <!-- Бургер (узкие экраны) -->
        <button class="icon-btn burger-btn" aria-label="Menu" title="Menu">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>

      <!-- Popover бургер-меню -->
      <div class="header-burger-popover" hidden>
        <button type="button" data-act="saveAs">
          <span class="label">Save As…</span>
          <span class="mi" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M5 3h10l4 4v14H5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 3v6h8V3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          </span>
        </button>

        <button type="button" data-act="snapshot">
          <span class="label">Snapshot</span>
          <span class="mi" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5 9-5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M21 12l-9 5-9-5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M21 16l-9 5-9-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          </span>
        </button>

        <button type="button" data-act="workspaces">
          <span class="label">Workspaces</span>
          <span class="mi" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M8 7a3 3 0 0 1 6 0m4 3a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 10a4 4 0 1 0 0 8h3v-2M18 10a4 4 0 1 1 0 8h-3v-2" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          </span>
        </button>

        <hr/>

        <button type="button" data-act="open">
          <span class="label">Open…</span>
          <span class="mi" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M3 7h6l2 2h10v10H3z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          </span>
        </button>

        <button type="button" data-act="export">
          <span class="label">Export JSON</span>
          <span class="mi" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 3v12m0 0l-4-4m4 4l4-4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 21h14" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          </span>
        </button>

        <button type="button" data-act="history">
          <span class="label">Trash / History</span>
          <span class="mi" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6v-2h8v2M6 6l1 14h10l1-14" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          </span>
        </button>

        <button type="button" data-act="settings">
          <span class="label">Settings</span>
          <span class="mi" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm8 4l2 1-2 1-.5 2.2-2.2.5L15 19l-1 2-1-2-3.3-.3-2.2-.5L6 16l-2-1 2-1 .5-2.2 2.2-.5L9 5l1-2 1 2 3.3.3 2.2.5L18 8z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
          </span>
        </button>

        <hr/>

        <button type="button" data-act="openData">
          <span class="label">Data folder</span>
          <span class="mi" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M3 7h6l2 2h10v10H3z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          </span>
        </button>

        <button type="button" data-act="revealState">
          <span class="label">Reveal state.json</span>
          <span class="mi" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          </span>
        </button>
      </div>
    </div>
  `;

  // ============================================================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (определяем ДО использования!)
  // ============================================================================

  function esc(s = "") {
    return String(s).replace(
      /[&<>"]/g,
      (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch])
    );
  }

  function openSaveAsModal(defaultName = "") {
    const body = `
      <div class="form-row" style="display:grid;gap:8px;">
        <label for="saveAsName">Name</label>
        <input id="saveAsName" type="text" placeholder="e.g. My links"
               value="${esc(defaultName)}"
               style="padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--surface-1);color:var(--text);"/>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px;">
          <button class="btn" data-act="cancel">Cancel</button>
          <button class="btn save" data-act="ok">Save</button>
        </div>
      </div>
    `;
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
          storage.saves.upsert(name);
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

  function openSnapshotModal() {
    const body = `
      <div class="form-row" style="display:grid;gap:8px;">
        <label for="snapshotName">Snapshot name</label>
        <input id="snapshotName" type="text" placeholder="e.g. Backup – ${new Date().toLocaleString()}"
               style="padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--surface-1);color:var(--text);"/>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px;">
          <button class="btn" data-act="cancel">Cancel</button>
          <button class="btn save" data-act="ok">Create</button>
        </div>
      </div>
    `;
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

  function parseQuickAddValue(raw) {
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
  }

  function handleQuickAdd() {
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
  }

  // ============================================================================
  // ПОЛУЧЕНИЕ ЭЛЕМЕНТОВ
  // ============================================================================

  const headerRight = el.querySelector(".header-right");
  const burgerBtn = el.querySelector(".burger-btn");
  const burgerPop = el.querySelector(".header-burger-popover");
  const qaInput = el.querySelector("#quickAddInput");
  const qaBtn = el.querySelector(".qa-go");
  const searchInput = el.querySelector("#searchInput");
  const searchClear = el.querySelector(".search-clear");

  // Вынести поповер из хедера в body — так он не попадёт в чужие stacking contexts
  if (burgerPop && burgerPop.parentElement !== document.body) {
    document.body.appendChild(burgerPop);
  }

  // ============================================================================
  // ОБРАБОТЧИКИ СОБЫТИЙ КНОПОК
  // ============================================================================

  // ЛОГО → «О программе»
  el.querySelector(".logo-btn")?.addEventListener("click", () => {
    eventBus.emit("ui:about:open");
  });

  // ОСНОВНОЙ SAVE (без prompt; если активное имя есть — просто сохранить)
  el.querySelector(".primary-save")?.addEventListener("click", () => {
    console.log("🔵 PRIMARY SAVE CLICKED!");
    const hasActive = !!storage.saves?.getActiveName?.();
    if (hasActive) {
      storage.saves.saveActive();
      eventBus.emit("ui:toast", { type: "success", message: "Saved" });
    } else {
      openSaveAsModal("");
    }
  });

  // Иконка Save As… в шапке (широкие экраны)
  el.querySelector(".save-as-btn")?.addEventListener("click", () => {
    console.log("🔵 SAVE AS CLICKED!");
    openSaveAsModal(storage.saves?.getActiveName?.() || "");
  });

  el.querySelector(".snapshot-btn")?.addEventListener("click", () => {
    console.log("🔵 SNAPSHOT CLICKED!");
    openSnapshotModal();
  });

  // Workspaces (иконка «мозг»)
  el.querySelector(".workspaces-btn")?.addEventListener("click", () => {
    eventBus.emit("ui:sessions:open");
  });

  // Иконки Open / Export / History / Settings / Data Folder
  el.querySelector('[data-action="data-folder"]')?.addEventListener(
    "click",
    async () => {
      if (window.desktop?.platform?.openDataFolder) {
        await window.desktop.platform.openDataFolder();
      } else {
        eventBus.emit("ui:toast", { type: "info", message: "Desktop only" });
      }
    }
  );

  el.querySelector('[data-action="open"]')?.addEventListener("click", () => {
    eventBus.emit("file:import");
  });

  el.querySelector('[data-action="export"]')?.addEventListener("click", () => {
    eventBus.emit("storage:exportJSON");
  });

  el.querySelector('[data-action="history"]')?.addEventListener("click", () => {
    eventBus.emit("history:open");
  });

  el.querySelector('[data-action="settings"]')?.addEventListener(
    "click",
    () => {
      eventBus.emit("ui:settings:open");
    }
  );

  // ============================================================================
  // QUICK ADD
  // ============================================================================

  qaBtn?.addEventListener("click", handleQuickAdd);
  qaInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleQuickAdd();
  });

  // ============================================================================
  // SEARCH (+ крестик)
  // ============================================================================

  function emitSearch() {
    eventBus.emit("search:query", { q: (searchInput?.value || "").trim() });
  }

  searchInput?.addEventListener("input", emitSearch);
  searchClear?.addEventListener("click", () => {
    if (!searchInput) return;
    searchInput.value = "";
    eventBus.emit("search:clear");
    searchInput.focus();
  });

  // ============================================================================
  // BURGER MENU
  // ============================================================================

  burgerBtn?.addEventListener("click", (e) => {
    e.stopPropagation();

    // Переносим поповер в body один раз (чтобы он точно был поверх всего)
    if (burgerPop && burgerPop.parentElement !== document.body) {
      document.body.appendChild(burgerPop);
    }

    // Позиционирование под шапкой и у правого края кнопки
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

  // Закрыть при клике вне поповера
  document.addEventListener("click", (e) => {
    if (
      !burgerPop.hidden &&
      !burgerPop.contains(e.target) &&
      !burgerBtn.contains(e.target)
    ) {
      burgerPop.hidden = true;
    }
  });

  // Закрыть при ресайзе (чтоб не «висел»)
  window.addEventListener("resize", () => {
    burgerPop.hidden = true;
  });

  // Не даём клику внутри поповера «пробиться» наружу
  burgerPop?.addEventListener("mousedown", (e) => e.stopPropagation());

  // Команды в поповере бургера
  burgerPop?.addEventListener("click", async (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    burgerPop.hidden = true;

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
    }
    if (act === "revealState") {
      if (window.desktop?.platform?.revealStateFile) {
        await window.desktop.platform.revealStateFile();
      } else {
        eventBus.emit("ui:toast", { type: "info", message: "Desktop only" });
      }
    }
  });

  // ============================================================================
  // ХОТКЕИ
  // ============================================================================

  // Хоткей Save (Ctrl/Cmd+S)
  document.addEventListener("keydown", (e) => {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const mod = isMac ? e.metaKey : e.ctrlKey;
    if (mod && !e.shiftKey && !e.altKey && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      const hasActive = !!storage.saves?.getActiveName?.();
      if (hasActive) {
        storage.saves.saveActive();
        eventBus.emit("ui:toast", { type: "success", message: "Saved" });
      } else {
        openSaveAsModal("");
      }
    }
  });

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
