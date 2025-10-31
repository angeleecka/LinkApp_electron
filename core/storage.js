// =============================================================================
// CORE/STORAGE.JS — Хранилище данных приложения (localStorage + platform)
// =============================================================================
// Что здесь:
// - Инициализация данных (двухфазная: localStorage → затем platform override)
// - Сохранение (localStorage + platform.saveAppState)
// - get / update / exportJSON / importJSON / reset
// - Workspaces/Snapshots: sessions + «дружественная» обёртка saves
// - События для UI: storage:loaded, storage:updated, sessions:updated,
//   saves:activeChanged, тосты об успехах/ошибках
// =============================================================================

import { eventBus } from "./event-bus.js";
import { platform } from "./platform.js";

// --- ключи локального стора
const SESSIONS_KEY = "linkapp-sessions";
const ACTIVE_SAVE_KEY = "linkapp-active-save-name";

// --- утилиты/константы
const deepClone = (x) => JSON.parse(JSON.stringify(x));
const KIND_WORKSPACE = "workspace";
const KIND_SNAPSHOT = "snapshot";

// =============================================================================
// ДАННЫЕ ПО УМОЛЧАНИЮ
// =============================================================================
const DEFAULT_DATA = {
  currentPageIndex: 0,
  pages: [
    {
      id: "page-1",
      name: "Page 1",
      sections: {
        "section-1": {
          text: "New Section",
          buttons: [{ id: "button-1", text: "New button", href: "" }],
        },
      },
    },
    {
      id: "page-2",
      name: "Page 2",
      sections: {
        "section-2": {
          text: "New Section",
          buttons: [{ id: "button-2", text: "New button", href: "" }],
        },
      },
    },
    {
      id: "page-3",
      name: "Page 3",
      sections: {
        "section-3": {
          text: "New Section",
          buttons: [{ id: "button-3", text: "New button", href: "" }],
        },
      },
    },
  ],
  deletedItemsHistory: [],
};

// =============================================================================
/** ГЛАВНОЕ ХРАНИЛИЩЕ */
// =============================================================================
export const storage = {
  /** текущее состояние приложения */
  data: null,

  // ===========================================================================
  // ИНИЦИАЛИЗАЦИЯ (двухфазная)
  // ===========================================================================
  init() {
    // Фаза A: быстрый старт из localStorage (UI оживает сразу)
    try {
      const stored = localStorage.getItem("linkapp-data");
      if (stored) {
        this.data = JSON.parse(stored);
        this.migrateData?.();
        console.log("[storage] Data loaded from localStorage");
      } else {
        this.data = deepClone(DEFAULT_DATA);
        console.log("[storage] No saved data found, using defaults");
      }
    } catch (e) {
      console.error("[storage] Failed to load data:", e);
      this.data = deepClone(DEFAULT_DATA);
    }

    // Синхронизируем и оповещаем UI
    this.save();
    eventBus.emit("storage:loaded", this.data);

    // Фаза B: догрузка из platform (например, Electron userData/state.json)
    platform
      ?.loadAppState?.()
      .then((raw) => {
        if (!raw) return;
        try {
          const fromPlatform = JSON.parse(raw);
          if (JSON.stringify(fromPlatform) !== JSON.stringify(this.data)) {
            this.data = fromPlatform;
            this.migrateData?.();
            this.save(); // записать обратно и в localStorage, и в платформу
            eventBus.emit("storage:loaded", this.data);
            console.log("[storage] Data loaded from platform (override)");
          }
        } catch (e) {
          console.warn("[storage] platform state is invalid JSON, skip.", e);
        }
      })
      .catch((err) => {
        console.warn("[storage] loadAppState failed:", err);
      });
  },

  // ===========================================================================
  // МИГРАЦИИ
  // ===========================================================================
  migrateData() {
    // pages
    if (!Array.isArray(this.data.pages)) {
      console.warn("[storage] Invalid pages structure, resetting...");
      this.data.pages = deepClone(DEFAULT_DATA.pages);
    }
    if (this.data.pages.length === 0) {
      console.warn("[storage] No pages found, creating default page...");
      this.data.pages.push(deepClone(DEFAULT_DATA.pages[0]));
    }

    // currentPageIndex
    if (typeof this.data.currentPageIndex !== "number") {
      this.data.currentPageIndex = 0;
    }
    if (this.data.currentPageIndex >= this.data.pages.length) {
      this.data.currentPageIndex = 0;
    }

    // deletedItemsHistory
    if (!Array.isArray(this.data.deletedItemsHistory)) {
      this.data.deletedItemsHistory = [];
    }

    // Нормализация страниц
    this.data.pages.forEach((p, idx) => {
      if (!p.sections) p.sections = {};
      if (!Array.isArray(p.sectionsOrder)) {
        p.sectionsOrder = Object.keys(p.sections);
      }
      if (typeof p.name !== "string" || p.name.trim() === "") {
        p.name = `Page ${idx + 1}`;
      }
    });

    // Миграция со старой плоской схемы (на всякий случай)
    if (this.data.sections && !this.data.pages[0].sections) {
      console.log("[storage] Migrating old structure...");
      this.data.pages[0].sections = this.data.sections;
      delete this.data.sections;
    }

    console.log("[storage] Data migration completed");
  },

  // ===========================================================================
  // СОХРАНЕНИЕ
  // ===========================================================================
  save() {
    try {
      const json = JSON.stringify(this.data);
      localStorage.setItem("linkapp-data", json);
      // параллельно: платформенное хранилище (в desktop-хосте)
      platform?.saveAppState?.(json);
    } catch (e) {
      console.error("[storage] Failed to save:", e);
    }
  },

  // ===========================================================================
  // GET / UPDATE
  // ===========================================================================
  get() {
    return this.data;
  },

  update(mutator) {
    try {
      mutator(this.data);
      this.save();
      eventBus.emit("storage:updated", this.data);
    } catch (e) {
      console.error("[storage] Failed to update data:", e);
      eventBus.emit("ui:toast", {
        type: "error",
        message: "Failed to update data",
      });
    }
  },

  // ===========================================================================
  // ЭКСПОРТ / ИМПОРТ / СБРОС
  // ===========================================================================
  exportJSON() {
    try {
      const json = JSON.stringify(this.data, null, 2);
      console.log("[storage] Data exported to JSON");
      return json;
    } catch (e) {
      console.error("[storage] Failed to export data:", e);
      eventBus.emit("ui:toast", {
        type: "error",
        message: "Failed to export data",
      });
      return null;
    }
  },

  importJSON(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      if (!imported.pages || !Array.isArray(imported.pages)) {
        throw new Error("Invalid data structure: 'pages' array not found");
      }
      this.data = imported;
      this.migrateData();
      this.data.currentPageIndex = 0;

      this.save();
      console.log("[storage] Data imported successfully");

      // оповещаем UI
      eventBus.emit("storage:loaded", this.data);
      eventBus.emit("storage:updated", this.data);

      eventBus.emit("ui:toast", {
        type: "success",
        message: "Data imported successfully!",
      });
      return true;
    } catch (e) {
      console.error("[storage] Failed to import data:", e);
      eventBus.emit("ui:toast", {
        type: "error",
        message: "Failed to import data: " + e.message,
      });
      return false;
    }
  },

  reset() {
    this.data = deepClone(DEFAULT_DATA);
    this.save();
    console.log("[storage] Data reset to defaults");

    eventBus.emit("storage:loaded", this.data);
    eventBus.emit("storage:updated", this.data);
    eventBus.emit("ui:toast", {
      type: "info",
      message: "Data reset to defaults",
    });
  },

  // ===========================================================================
  // SESSIONS (Workspaces + Snapshots)
  // ===========================================================================
  sessions: {
    _read() {
      try {
        const raw = localStorage.getItem(SESSIONS_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    },

    _write(obj) {
      try {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(obj));
        eventBus.emit("sessions:updated");
      } catch (e) {
        console.error("[sessions] write failed:", e);
        eventBus.emit("ui:toast", {
          type: "error",
          message: "Failed to save session list",
        });
      }
    },

    /**
     * Сохранить слепок текущего состояния
     * @param {string} name
     * @param {'workspace'|'snapshot'} kind
     */
    save(name = "", kind = KIND_SNAPSHOT) {
      const id = `sess-${Date.now()}`;
      const store = this._read();
      store[id] = {
        id,
        kind,
        name:
          String(name || "").trim() ||
          (kind === KIND_SNAPSHOT
            ? `Snapshot ${new Date().toLocaleString()}`
            : `Workspace ${new Date().toLocaleString()}`),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: deepClone(storage.data),
      };
      this._write(store);
      eventBus.emit("ui:toast", {
        type: "success",
        message:
          kind === KIND_SNAPSHOT ? "Snapshot created" : "Workspace saved",
      });
      return id;
    },

    /** Полный список */
    list() {
      const store = this._read();
      return Object.values(store).sort((a, b) => b.updatedAt - a.updatedAt);
    },

    /** Списки по типу */
    listByKind(kind) {
      const store = this._read();
      return Object.values(store)
        .filter((x) => !x.deletedAt && (x.kind || KIND_WORKSPACE) === kind)
        .sort((a, b) => b.updatedAt - a.updatedAt);
    },

    listWorkspaces() {
      return this.listByKind(KIND_WORKSPACE);
    },
    listSnapshots() {
      return this.listByKind(KIND_SNAPSHOT);
    },

    /** Переименовать */
    rename(id, newName) {
      const store = this._read();
      if (!store[id]) return false;
      store[id].name = String(newName || "").trim() || store[id].name;
      store[id].updatedAt = Date.now();
      this._write(store);
      eventBus.emit("ui:toast", { type: "info", message: "Session renamed" });
      return true;
    },

    /** Удалить */
    delete(id) {
      const store = this._read();
      if (!store[id]) return false;
      // Мягкое удаление: помечаем
      store[id].deletedAt = Date.now();
      this._write(store);
      eventBus.emit("ui:toast", { type: "info", message: "Moved to trash" });
      return true;
    },

    /**
     * Загрузить запись: заменить текущие данные приложения
     * и инициировать перерендер (storage:updated/loaded).
     */
    load(id) {
      const store = this._read();
      const snap = store[id];
      if (!snap) {
        eventBus.emit("ui:toast", {
          type: "error",
          message: "Session not found",
        });
        return false;
      }

      // заменить данные + мигрировать
      storage.data = deepClone(snap.data);
      storage.migrateData?.();

      // запомнить активное имя (для «Save»)
      storage.saves.setActiveName(snap.name);

      // сохранить и разослать события для UI
      storage.save(); // localStorage + platform
      eventBus.emit("storage:updated", storage.data); // большинство модулей слушают это
      eventBus.emit("storage:loaded", storage.data); // совместимость со старыми слушателями

      eventBus.emit("ui:toast", {
        type: "success",
        message: `Session loaded: ${snap.name}`,
      });
      return true;
    },

    /**
     * Восстановить snapshot в НОВЫЙ workspace и сразу его открыть.
     */
    restoreToWorkspace(id, newName = "") {
      const store = this._read();
      const snap = store[id];
      if (!snap) {
        eventBus.emit("ui:toast", {
          type: "error",
          message: "Snapshot not found",
        });
        return null;
      }
      const title =
        String(newName || "").trim() ||
        `${snap.name} (restored ${new Date().toLocaleDateString()})`;

      // создать новую запись типа workspace
      const newId = this.save(title, KIND_WORKSPACE);

      // заменить её данными снапшота
      const after = this._read();
      if (after[newId]) {
        after[newId].data = deepClone(snap.data);
        after[newId].createdAt = Date.now();
        after[newId].updatedAt = Date.now();
        this._write(after);

        // сделать активной и загрузить
        storage.saves.setActiveName(title);
        this.load(newId);
      }
      return newId;
    },
  },

  // ===========================================================================
  // «Дружественная» обёртка «сохранений» над sessions
  // (работаем только с WORKSPACE, снапшоты не показываем тут)
  // ===========================================================================
  saves: {
    getActiveName() {
      return localStorage.getItem(ACTIVE_SAVE_KEY) || "";
    },

    setActiveName(name) {
      const val = String(name || "").trim();
      localStorage.setItem(ACTIVE_SAVE_KEY, val);
      eventBus.emit("saves:activeChanged", { name: val });
    },

    list() {
      const store = this._read();
      return Object.values(store)
        .filter((x) => !x.deletedAt) // ← скрыть «удалённые»
        .sort((a, b) => b.updatedAt - a.updatedAt);
    },

    /**
     * Сохранить в workspace с указанным именем (создать/перезаписать).
     */
    upsert(name) {
      const target = String(name || "").trim();
      if (!target) return false;

      const store = storage.sessions._read();

      // ищем по имени среди всех (workspace/snapshot), перезапишем как workspace
      const existingId = Object.keys(store).find(
        (id) => (store[id]?.name || "").toLowerCase() === target.toLowerCase()
      );

      if (existingId) {
        const entry = store[existingId];
        entry.kind = KIND_WORKSPACE; // важный штрих
        entry.data = deepClone(storage.data);
        entry.updatedAt = Date.now();
        storage.sessions._write(store);
        storage.saves.setActiveName(target);
        eventBus.emit("ui:toast", {
          type: "success",
          message: `Saved to “${target}”`,
        });
        return true;
      } else {
        storage.sessions.save(target, KIND_WORKSPACE); // создаём новый workspace
        storage.saves.setActiveName(target);
        return true;
      }
    },

    saveActive() {
      const name = storage.saves.getActiveName();
      if (!name) return false;
      return storage.saves.upsert(name);
    },

    openByName(name) {
      const all = storage.sessions.list();
      const found = all.find(
        (s) => s.name.toLowerCase() === String(name || "").toLowerCase()
      );
      if (!found) return false;
      storage.sessions.load(found.id);
      storage.saves.setActiveName(found.name);
      return true;
    },
  },
};

// =============================================================================
// DevTools удобства (не ломают SSR/тесты)
// =============================================================================
if (typeof window !== "undefined") {
  window.storage = storage;
  window.eventBus = eventBus;
}
