// =============================================================================
// CORE/STORAGE.JS — Хранилище данных приложения (localStorage + platform)
// =============================================================================
// Что здесь:
// - Инициализация данных (двухфазная: localStorage → затем platform override)
// - Сохранение (localStorage + platform.saveAppState)
// - get / update / exportJSON / importJSON / reset
// - Миграции структуры
// =============================================================================

import { eventBus } from "./event-bus.js";
import { platform } from "./platform.js";

// --- sessions store (snapshots) ---
const SESSIONS_KEY = "linkapp-sessions";
const ACTIVE_SAVE_KEY = "linkapp-active-save-name";

const deepClone = (x) => JSON.parse(JSON.stringify(x));

// =============================================================================
// СТРУКТУРА ДАННЫХ ПО УМОЛЧАНИЮ
// =============================================================================
const DEFAULT_DATA = {
  // Текущий индекс активной страницы (начиная с 0)
  currentPageIndex: 0,

  // Набор страниц
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

  // История удалений (для корзины)
  deletedItemsHistory: [],
};

// =============================================================================
// ХРАНИЛИЩЕ
// =============================================================================
export const storage = {
  // Текущие данные приложения
  data: null,

  // ===========================================================================
  // ИНИЦИАЛИЗАЦИЯ (двухфазная)
  // ===========================================================================
  init() {
    // Фаза A: быстрый старт из localStorage (чтобы UI сразу ожил)
    try {
      const stored = localStorage.getItem("linkapp-data");
      if (stored) {
        this.data = JSON.parse(stored);
        this.migrateData?.();
        console.log("[storage] Data loaded from localStorage");
      } else {
        this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
        console.log("[storage] No saved data found, using defaults");
      }
    } catch (e) {
      console.error("[storage] Failed to load data:", e);
      this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }

    // Синхронизируем на всякий случай и оповещаем UI
    this.save();
    eventBus.emit("storage:loaded", this.data);

    // Фаза B: фоновая попытка платформенного стора (Electron/Tauri и т.п.)
    platform
      .loadAppState()
      .then((raw) => {
        if (!raw) return;
        try {
          const fromPlatform = JSON.parse(raw);
          if (JSON.stringify(fromPlatform) !== JSON.stringify(this.data)) {
            this.data = fromPlatform;
            this.migrateData?.();
            this.save(); // сохраняем в оба хранилища
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
      this.data.pages = JSON.parse(JSON.stringify(DEFAULT_DATA.pages));
    }
    if (this.data.pages.length === 0) {
      console.warn("[storage] No pages found, creating default page...");
      this.data.pages.push(JSON.parse(JSON.stringify(DEFAULT_DATA.pages[0])));
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

    // Наполняем/нормализуем страницы
    this.data.pages.forEach((p, idx) => {
      if (!p.sections) p.sections = {};
      if (!Array.isArray(p.sectionsOrder)) {
        p.sectionsOrder = Object.keys(p.sections);
      }
      if (typeof p.name !== "string" || p.name.trim() === "") {
        p.name = `Page ${idx + 1}`;
      }
    });

    // Миграция со старой плоской структуры (если вдруг была)
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
      // параллельно — платформенное хранилище (в desktop-хосте)
      // В вебе platform может быть заглушкой: вызов защищаем опциональной цепочкой
      platform?.saveAppState?.(json);
    } catch (e) {
      console.error("[storage] Failed to save:", e);
    }
  },

  // ===========================================================================
  // GET
  // ===========================================================================
  get() {
    return this.data;
  },

  // ===========================================================================
  // UPDATE
  // ===========================================================================
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
  // ЭКСПОРТ
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

  // ===========================================================================
  // ИМПОРТ
  // ===========================================================================
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

      // Важно: оповестить UI
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

  // ===========================================================================
  // СБРОС
  // ===========================================================================
  reset() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.save();
    console.log("[storage] Data reset to defaults");

    eventBus.emit("storage:loaded", this.data);
    eventBus.emit("storage:updated", this.data);

    eventBus.emit("ui:toast", {
      type: "info",
      message: "Data reset to defaults",
    });
  },

  // ======================================================================
  // SESSIONS (Workspaces snapshots)
  // ======================================================================
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
     * Сохранить текущие данные как снимок (workspace)
     * @param {string} name - человекочитаемое имя снимка
     * @returns {string} id снимка
     */
    save(name = "") {
      const id = `sess-${Date.now()}`;
      const store = this._read();
      store[id] = {
        id,
        name: name.trim() || `Snapshot ${new Date().toLocaleString()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: deepClone(storage.data),
      };
      this._write(store);
      eventBus.emit("ui:toast", { type: "success", message: "Session saved" });
      return id;
    },

    /**
     * Список снимков, отсортированный по updatedAt (desc)
     */
    list() {
      const store = this._read();
      return Object.values(store).sort((a, b) => b.updatedAt - a.updatedAt);
    },

    /**
     * Переименовать снимок
     */
    rename(id, newName) {
      const store = this._read();
      if (!store[id]) return false;
      store[id].name = String(newName || "").trim() || store[id].name;
      store[id].updatedAt = Date.now();
      this._write(store);
      eventBus.emit("ui:toast", { type: "info", message: "Session renamed" });
      return true;
    },

    /**
     * Удалить снимок
     */
    delete(id) {
      const store = this._read();
      if (!store[id]) return false;
      delete store[id];
      this._write(store);
      eventBus.emit("ui:toast", { type: "info", message: "Session deleted" });
      return true;
    },

    /**
     * Загрузить снимок: заменяет текущие данные приложения
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
      // заменить данные и разослать события
      storage.data = deepClone(snap.data);
      storage.migrateData?.();
      storage.save(); // сохранит и в localStorage, и в platform (если есть)
      eventBus.emit("storage:loaded", storage.data);
      eventBus.emit("ui:toast", {
        type: "success",
        message: `Session loaded: ${snap.name}`,
      });
      return true;
    },
  },

  // ---- User-friendly "saves" facade over sessions ----

  saves: {
    getActiveName() {
      return localStorage.getItem(ACTIVE_SAVE_KEY) || "";
    },
    setActiveName(name) {
      localStorage.setItem(ACTIVE_SAVE_KEY, String(name || "").trim());
    },
    list() {
      return storage.sessions.list();
    },
    upsert(name) {
      const target = String(name || "").trim();
      if (!target) return false;

      const all = storage.sessions.list();
      const found = all.find(
        (s) => s.name.toLowerCase() === target.toLowerCase()
      );

      if (found) {
        const store = storage.sessions._read();
        const snap = store[found.id];
        if (!snap) return false;
        snap.data = deepClone(storage.data);
        snap.updatedAt = Date.now();
        storage.sessions._write(store);
        storage.saves.setActiveName(target);
        eventBus.emit("ui:toast", {
          type: "success",
          message: `Saved to “${target}”`,
        });
        return true;
      } else {
        storage.sessions.save(target);
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
}; // ← конец объекта storage

// для DevTools (по желанию)
window.storage = storage;
window.eventBus = eventBus;
