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
        <button type="button" data-act="snapshot">
    <span class="label">Snapshot</span>
    <span class="mi" aria-hidden="true">
      <!-- layers -->
      <svg viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5 9-5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M21 12l-9 5-9-5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M21 16l-9 5-9-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>
    </span>
  </button>
  <button type="button" data-act="workspaces">
    <span class="label">Workspaces</span>
    <span class="mi" aria-hidden="true">
      <!-- brain -->
      <svg viewBox="0 0 24 24"><path d="M8 7a3 3 0 0 1 6 0m4 3a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 10a4 4 0 1 0 0 8h3v-2M18 10a4 4 0 1 1 0 8h-3v-2" fill="none" stroke="currentColor" stroke-width="2"/></svg>
    </span>
  </button>
  <hr/>
  <button type="button" data-act="open">
    <span class="label">Open…</span>
    <span class="mi" aria-hidden="true">
      <!-- folder -->
      <svg viewBox="0 0 24 24"><path d="M3 7h6l2 2h10v10H3z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
    </span>
  </button>
  <button type="button" data-act="export">
    <span class="label">Export JSON</span>
    <span class="mi" aria-hidden="true">
      <!-- export -->
      <svg viewBox="0 0 24 24"><path d="M12 3v12m0 0l-4-4m4 4l4-4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 21h14" fill="none" stroke="currentColor" stroke-width="2"/></svg>
    </span>
  </button>
  <button type="button" data-act="history">
    <span class="label">Trash / History</span>
    <span class="mi" aria-hidden="true">
      <!-- trash -->
      <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6v-2h8v2M6 6l1 14h10l1-14" fill="none" stroke="currentColor" stroke-width="2"/></svg>
    </span>
  </button>
  <button type="button" data-act="settings">
    <span class="label">Settings</span>
    <span class="mi" aria-hidden="true">
      <!-- gear -->
      <svg viewBox="0 0 24 24"><path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm8 4l2 1-2 1-.5 2.2-2.2.5L15 19l-1 2-1-2-3.3-.3-2.2-.5L6 16l-2-1 2-1 .5-2.2 2.2-.5L9 5l1-2 1 2 3.3.3 2.2.5L18 8z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
    </span>
  </button>
      </div>
    </div>
  `;

  const headerRight = el.querySelector(".header-right");
  const burgerBtn = el.querySelector(".burger-btn");
  const burgerPop = el.querySelector(".header-burger-popover");

  // --- helpers: экспорт / импорт JSON ---
  function downloadJSON(json, name = "LinkApp-data.json") {
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function openImportDialog() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.addEventListener("change", () => {
      const f = input.files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const ok = storage.importJSON(String(reader.result || ""));
        if (ok) storage.saves.setActiveName(""); // сбросим активное имя
      };
      reader.readAsText(f);
    });
    input.click();
  }

  // вынести поповер из хедера в body — так он не попадёт в чужие stacking contexts
  if (burgerPop && burgerPop.parentElement !== document.body) {
    document.body.appendChild(burgerPop);
  }

  // ЛОГО → «О программе»
  el.querySelector(".logo-btn")?.addEventListener("click", () => {
    eventBus.emit("ui:about:open");
  });

  // ОСНОВНОЙ SAVE возле логотипа
  el.querySelector(".primary-save")?.addEventListener("click", () => {
    if (!storage.saves?.saveActive?.()) {
      const name = prompt(
        "Save as name:",
        storage.saves?.getActiveName?.() || ""
      );
      if (name !== null) storage.saves?.upsert?.(name);
    }
  });

  // Snapshot (иконка «слои»)
  el.querySelector(".snapshot-btn")?.addEventListener("click", () => {
    const name = prompt("Snapshot name:", "");
    storage.sessions.save(name || "");
  });

  // Workspaces (иконка «мозг»)
  el.querySelector(".workspaces-btn")?.addEventListener("click", () => {
    eventBus.emit("ui:sessions:open");
  });

  // Иконки Open / Export / History / Settings
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

  // === Quick Add ===
  const qaInput = el.querySelector("#quickAddInput");
  const qaBtn = el.querySelector(".qa-go");

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
  qaBtn?.addEventListener("click", handleQuickAdd);
  qaInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleQuickAdd();
  });

  // === Search (+ крестик) ===
  const searchInput = el.querySelector("#searchInput");
  const searchClear = el.querySelector(".search-clear");
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

  // Хоткей Save (Ctrl/Cmd+S)
  document.addEventListener("keydown", (e) => {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const mod = isMac ? e.metaKey : e.ctrlKey;
    if (mod && !e.shiftKey && !e.altKey && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      if (!storage.saves?.saveActive?.()) {
        const name = prompt(
          "Save as name:",
          storage.saves?.getActiveName?.() || ""
        );
        if (name !== null) storage.saves?.upsert?.(name);
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

  // === BURGER MENU ===
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

  // Команды меню
  burgerPop?.addEventListener("click", (e) => {
    e.stopPropagation();

    const btn = e.target.closest("button[data-act]");
    if (!btn) return;

    const act = btn.dataset.act;
    burgerPop.hidden = true;

    if (act === "snapshot") {
      const n = prompt("Snapshot name:", "");
      if (n !== null) storage.sessions.save(n.trim());
      return;
    }
    if (act === "workspaces") {
      eventBus.emit("ui:sessions:open");
      return;
    }
    if (act === "open") {
      openImportDialog();
      return;
    }
    if (act === "export") {
      const j = storage.exportJSON();
      if (j) downloadJSON(j);
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
  });
}
