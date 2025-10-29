/** platform/launcher-web.js
 * LinkApp — Web Launcher (временный адаптер платформы)
 * ----------------------------------------------------
 * Роль: единая точка открытия ссылок из приложения.
 * В веб-режиме мы можем только открыть URL в новой вкладке.
 * В desktop-хосте (Electron/Tauri) этот файл будет заменён
 * на реализацию, которая открывает ссылку в выбранном браузере системы.
 *
 * Публичный API:
 *   - launcher.openUrl(url, browser?)
 *   - launcher.detectInstalledBrowsers()
 *
 * Где используется:
 *   - main.js → подписка на событие "link:open"
 */

export const launcher = {
  /**
   * Открыть ссылку. В вебе игнорируем выбор браузера и открываем в новой вкладке.
   * @param {string} url — абсолютный или относительный URL
   * @param {'system'|'chrome'|'firefox'|'edge'|'custom'} [browser='system'] — запрошенный браузер (в вебе — не используется)
   */
  openUrl(url, browser = "system") {
    // Безопасные флаги для новой вкладки
    window.open(url, "_blank", "noopener,noreferrer");
  },

  /**
   * Определить установленные браузеры.
   * В вебе — вернуть только «system», т.к. проверка недоступна.
   * В desktop-версии здесь появится реальный детект.
   * @returns {Promise<Array<{id:string,name:string}>>}
   */
  async detectInstalledBrowsers() {
    return [{ id: "system", name: "System default" }];
  },
};
