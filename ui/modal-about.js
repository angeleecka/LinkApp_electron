// /ui/modal-about.js --- изменялся!!!
import { eventBus } from "../core/event-bus.js";
import { openModal } from "./modal-service.js"; // <— только openModal

export function initAboutModal() {
  eventBus.on("ui:about:open", () => {
    const baseHTML = `
      <div class="about-content">
        <p><strong>LinkApp v2</strong> — modular links organizer.</p>
        <p>Author: <em>Angevicka Bond</em></p>
        <p>Version: 2.0.0</p>
      </div>
    `;

    const HOTKEYS_HTML = `
      <section class="about-block hotkeys">
        <h3 class="hotkeys-title">Keyboard Shortcuts</h3>
        <table class="hotkeys-table" role="table" aria-label="Keyboard Shortcuts">
          <tbody>
            <tr><td><kbd>Alt</kbd> + <kbd>←</kbd>/<kbd>→</kbd></td><td>Switch page</td></tr>
            <tr><td><kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>N</kbd></td><td>New section</td></tr>
            <tr><td><kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>N</kbd></td><td>Focus Quick Add</td></tr>
            <tr><td><kbd>/</kbd></td><td>Focus Search</td></tr>
            <tr><td><kbd>Enter</kbd></td><td>Confirm (modals, rename, Quick Add)</td></tr>
            <tr><td><kbd>Esc</kbd></td><td>Cancel / close modal</td></tr>
            <tr><td><kbd>Alt</kbd> + <kbd>T</kbd></td><td>Cycle theme</td></tr>
            <tr><td><kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>P</kbd></td><td>Go to page (focus "Go to…")</td></tr>
          </tbody>
        </table>
        <p class="hotkeys-note">
          Planned: <kbd>Ctrl/Cmd + S</kbd> (Save),
          <kbd>Alt + Shift + ↑/↓</kbd> (Reorder).
        </p>
      </section>
    `;

    openModal({
      title: "About LinkApp",
      bodyHTML: baseHTML + HOTKEYS_HTML, // <-- ключевое изменение
      showFooter: true,
    });
  });
}
