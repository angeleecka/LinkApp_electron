// core/platform.js
// Единая платформа: хранение состояния + открытие ссылок.
// В ВЕБЕ: НИЧЕГО не пишем в localStorage (этим занимается storage.js).
// В ELECTRON: работаем через window.electronAPI из preload.
//
// Требуемые методы на preload-API:
// - readText(file), writeText(file, text)
// - openExternal(url)
// - detectBrowsers()            (опционально)
// - getUserDataPath()           (опционально)

import { launcher } from "../platform/launcher-web.js";

export const isElectron = typeof window !== "undefined" && !!window.electronAPI;

export const platform = {
  env() {
    return isElectron ? "electron" : "browser";
  },

  // ===================== ХРАНЕНИЕ СОСТОЯНИЯ =====================
  // storage.init() сначала грузит localStorage, затем
  // вызывает platform.loadAppState() "на догрузку/override".
  // В браузере возвращаем null => ничего не переопределяем.
  async loadAppState() {
    if (isElectron && window.electronAPI?.readText) {
      try {
        return await window.electronAPI.readText("state.json");
      } catch (e) {
        console.warn("[platform] readText failed:", e);
        return null;
      }
    }
    // Веб: не трогаем localStorage — он уже обслуживается в storage.js
    return null;
  },

  async saveAppState(jsonText) {
    if (isElectron && window.electronAPI?.writeText) {
      try {
        await window.electronAPI.writeText("state.json", jsonText);
      } catch (e) {
        console.warn("[platform] writeText failed:", e);
      }
    }
    // Веб: no-op. storage.save() уже записал в localStorage ("linkapp-data").
  },

  // ===================== ОТКРЫТИЕ ССЫЛОК =====================
  openExternal(url) {
    if (isElectron && window.electronAPI?.openExternal) {
      return window.electronAPI.openExternal(url);
    }
    // Браузер: открываем в новой вкладке через адаптер
    return launcher.openUrl(url);
  },

  // (опционально) детект установленных браузеров в desktop-хосте
  async detectInstalledBrowsers() {
    if (isElectron && window.electronAPI?.detectBrowsers) {
      try {
        return await window.electronAPI.detectBrowsers();
      } catch (e) {
        console.warn("[platform] detectBrowsers failed:", e);
      }
    }
    // Веб: только "system"
    return launcher.detectInstalledBrowsers();
  },

  // (опционально) путь к userData (веб — null)
  async getUserDataPath() {
    if (isElectron && window.electronAPI?.getUserDataPath) {
      try {
        return await window.electronAPI.getUserDataPath();
      } catch {
        /* ignore */
      }
    }
    return null;
  },
};
