import { eventBus } from "../../core/event-bus.js";
import { openModal } from "../modal-service.js";
import { applyTheme, getTheme } from "../../core/theme.js";
import { config } from "../../core/config.js";
import { storage } from "../../core/storage.js";

let currentModal = null;

function openSettingsModal() {
  const curTheme = getTheme();
  const restorePolicy = config.get("restorePolicy") || "ask";

  const bodyHTML = `
    <div class="settings-group">
      <h3>Theme</h3>
      <label><input type="radio" name="theme" value="system" ${
        curTheme === "system" ? "checked" : ""
      }/> System</label><br/>
      <label><input type="radio" name="theme" value="light"  ${
        curTheme === "light" ? "checked" : ""
      }/> Light</label><br/>
      <label><input type="radio" name="theme" value="sea"    ${
        curTheme === "sea" ? "checked" : ""
      }/> Sea</label><br/>
      <label><input type="radio" name="theme" value="dark"   ${
        curTheme === "dark" ? "checked" : ""
      }/> Dark</label>
    </div>

    <div class="settings-group" style="margin-top:12px">
      <h3>Restore policy (when parent container is missing)</h3>
      <label><input type="radio" name="restorePolicy" value="ask"      ${
        restorePolicy === "ask" ? "checked" : ""
      }/> Ask every time</label><br/>
      <label><input type="radio" name="restorePolicy" value="recreate" ${
        restorePolicy === "recreate" ? "checked" : ""
      }/> Recreate parents</label><br/>
      <label><input type="radio" name="restorePolicy" value="restored" ${
        restorePolicy === "restored" ? "checked" : ""
      }/> Send to “Restored”</label>
    </div>

    <div class="modal-actions" style="margin-top:16px">
      <button class="btn" id="settingsSaveBtn">Save</button>
      <button class="btn cancel" id="settingsCancelBtn">Cancel</button>
      <button class="btn delete" id="settingsResetBtn" title="Reset all data to defaults">Reset data</button>
    </div>
  `;

  currentModal = openModal({
    title: "Settings",
    bodyHTML,
    onClose: () => (currentModal = null),
  });

  // Save
  document.getElementById("settingsSaveBtn")?.addEventListener("click", () => {
    const themeEl = /** @type {HTMLInputElement|null} */ (
      document.querySelector('input[name="theme"]:checked')
    );
    const rpEl = /** @type {HTMLInputElement|null} */ (
      document.querySelector('input[name="restorePolicy"]:checked')
    );

    const nextTheme = themeEl?.value || "system";
    applyTheme(nextTheme);

    const nextPolicy = rpEl?.value || "ask";
    if (nextPolicy === "ask") {
      // очищаем, чтобы спрашивать каждый раз
      config.set("restorePolicy", "ask");
    } else {
      config.set("restorePolicy", nextPolicy);
    }

    eventBus.emit("ui:toast", { type: "success", message: "Settings saved" });
    currentModal?.close();
  });

  // Cancel
  document
    .getElementById("settingsCancelBtn")
    ?.addEventListener("click", () => {
      currentModal?.close();
    });

  // Reset data
  document.getElementById("settingsResetBtn")?.addEventListener("click", () => {
    eventBus.emit("modal:confirm:open", {
      title: "Reset data?",
      message: "All pages, sections and buttons will be reset to defaults.",
      confirmText: "Reset",
      cancelText: "Cancel",
      onConfirm: () => {
        storage.reset();
        eventBus.emit("ui:toast", { type: "info", message: "Data reset" });
        currentModal?.close();
      },
    });
  });
}

export function initSettingsModal() {
  eventBus.on("ui:settings:open", openSettingsModal);
  console.log("✅ Settings Modal initialized");
}
