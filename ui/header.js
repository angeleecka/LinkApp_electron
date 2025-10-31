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

<!-- [A] Иконка поиска (рядом с quick-add на мобилке) -->
<button class="icon-btn search-trigger" title="Search" aria-label="Search">
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M20 20 L16.65 16.65" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>
</button>

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

        <button class="icon-btn workspaces-btn" title="Open" aria-label="Open">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <!-- open-folder -->
    <path d="M3 7h6l2 2h10v10H3z" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M3 19l3-7h16" fill="none" stroke="currentColor" stroke-width="2" />
  </svg>
        </button>

       <!-- <button class="icon-btn" data-action="data-folder" title="Data Folder" aria-label="Data Folder">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M3 7h6l2 2h10v10H3z" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button> -->

        <button class="icon-btn" data-action="open" title="Import..." aria-label="Import">
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 21h14"/>          <!-- полка (всегда снизу) -->
    <path d="M12 3v14"/>          <!-- стержень -->
    <path d="M8 15l4 4 4-4"/>     <!-- стрелка вниз (tip = y19, чуть выше полки) -->
    </g>
  </svg>
</button>


        <button class="icon-btn" data-action="export" title="Export..." aria-label="Export">
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 21h14"/>          <!-- полка (та же, снизу) -->
    <path d="M12 19V5"/>          <!-- стержень (старт чуть выше полки) -->
    <path d="M8 9l4-4 4 4"/>      <!-- стрелка вверх (tip = y5) -->
    </g>
  </svg>
</button>


        <button class="icon-btn" data-action="history" title="Trash / History" aria-label="Trash">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M3 6h18M8 6v-2h8v2M6 6l1 14h10l1-14" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>

        <button class="icon-btn" data-action="settings" title="Settings" aria-label="Settings">
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>
      <circle cx="12" cy="12" r="8"/>
    </g>
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

      <!-- Save -->
<button type="button" data-act="save">
  <span class="label">Save</span>
  <span class="mi" aria-hidden="true">
    <svg viewBox="0 0 24 24">
      <path d="M5 3h10l4 4v14H5z" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M7 3v6h8V3" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M7 21v-7h10v7" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>
  </span>
</button>
        <!-- Save As… (добавляем плюсик к дискете) -->
<button type="button" data-act="saveAs">
  <span class="label">Save As…</span>
  <span class="mi" aria-hidden="true">
    <svg viewBox="0 0 24 24">
      <path d="M5 3h10l4 4v14H5z" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M7 3v6h8V3" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M7 21v-7h6v7" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M16 14v4m-2-2h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </span>
</button>
        <!-- [B] Popover поиска (вне потока, как и бургер) -->
        <div class="header-search-popover" hidden>
            <input id="searchInputMobile" type="text" placeholder="Search title or URL" />
        </div>

        <button type="button" data-act="snapshot">
          <span class="label">Snapshot</span>
          <span class="mi" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5 9-5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M21 12l-9 5-9-5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M21 16l-9 5-9-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          </span>
        </button>

        <button type="button" data-act="workspaces">
          <span class="label">Open</span>
          <span class="mi" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M8 7a3 3 0 0 1 6 0m4 3a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 10a4 4 0 1 0 0 8h3v-2M18 10a4 4 0 1 1 0 8h-3v-2" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          </span>
        </button>

        <hr/>

        <button type="button" data-act="open">
  <span class="label">Import…</span>
  <span class="mi" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="18" height="18">
      <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 21h14"/>          <!-- полка (всегда снизу) -->
    <path d="M12 3v14"/>          <!-- стержень -->
    <path d="M8 15l4 4 4-4"/>     <!-- стрелка вниз (tip = y19, чуть выше полки) -->
      </g>
    </svg>
  </span>
</button>


        <button type="button" data-act="export">
  <span class="label">Export JSON</span>
  <span class="mi" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="18" height="18">
      <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 21h14"/>          <!-- полка (та же, снизу) -->
    <path d="M12 19V5"/>          <!-- стержень (старт чуть выше полки) -->
    <path d="M8 9l4-4 4 4"/>      <!-- стрелка вверх (tip = y5) -->
      </g>
    </svg>
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
    <svg viewBox="0 0 24 24" width="18" height="18">
      <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>
        <circle cx="12" cy="12" r="8"/>
      </g>
    </svg>
  </span>
</button>

<!--
        <hr/>

        <button type="button" data-act="openData">
          <span class="label">Data folder</span>
          <span class="mi" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M3 7h6l2 2h10v10H3z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          </span>
        </button>

        <button type="button" data-act="revealState">
          <span class="label">Show data file</span>
          <span class="mi" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          </span>
        </button>
      </div>
    </div> -->
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
      <div class="modal-form">
        <label for="saveAsName">Name</label>
        <input id="saveAsName" type="text" placeholder="e.g. My links" value="${esc(
          defaultName
        )}"/>
        <div class="actions">
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
      <div class="modal-form">
        <label for="snapshotName">Snapshot name</label>
        <input id="snapshotName" type="text" placeholder="e.g. Backup – ${new Date().toLocaleString()}"/>
        <div class="actions">
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

  /* === SEARCH POPOVER (мобильный) === */
  const searchTrigger = el.querySelector(".search-trigger");
  const searchPop = el.querySelector(".header-search-popover");
  const searchInputMobile = el.querySelector("#searchInputMobile");

  function emitSearchValue(val) {
    eventBus.emit("search:query", { q: (val || "").trim() });
  }

  searchTrigger?.addEventListener("click", () => {
    if (searchPop && searchPop.parentElement !== document.body) {
      document.body.appendChild(searchPop);
    }
    const headerRect = el.getBoundingClientRect();
    // ширина: не шире 420, но с отступами по 12px слева/справа
    const w = Math.min(420, window.innerWidth - 24);
    searchPop.style.width = w + "px";
    searchPop.style.top = Math.round(headerRect.bottom + 8) + "px";
    searchPop.style.left = Math.round((window.innerWidth - w) / 2) + "px";
    searchPop.style.right = "auto";
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

  /* клик снаружи — закрыть */
  document.addEventListener("click", (e) => {
    if (
      !searchPop?.hidden &&
      !searchPop.contains(e.target) &&
      !searchTrigger.contains(e.target)
    ) {
      searchPop.hidden = true;
    }
  });

  /* ресайз — тоже скрыть */
  window.addEventListener("resize", () =>
    searchPop?.setAttribute("hidden", "")
  );

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

  const searchBtn =
    el.querySelector(".search-trigger") || el.querySelector(".search-toggle");

  searchBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    // тут вызывай твой показ «стикера»/оверлея поиска
  });

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

    if (act === "save") {
      if (storage.saves?.saveActive?.()) {
        storage.saves.saveActive();
        eventBus.emit("ui:toast", { type: "success", message: "Saved" });
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

    const isDesktop = !!window.desktop?.platform;
    if (!isDesktop) {
      burgerPop.querySelector('[data-act="openData"]')?.remove();
      burgerPop.querySelector('[data-act="revealState"]')?.remove();
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
    if (e.key === "Escape") burgerPop?.setAttribute("hidden", "");
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
