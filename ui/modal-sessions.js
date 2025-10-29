// ui/modal-sessions.js
import { eventBus } from "../core/event-bus.js";
import { storage } from "../core/storage.js";
import { openModal } from "./modal-service.js";

function renderRows(list) {
  if (!list.length) {
    return `<p class="text-muted" style="opacity:.8;margin:8px 0 0;">
      No snapshots yet. Click <strong>💾 Save</strong> in the header.
    </p>`;
  }
  return `
  <div class="sessions-table" role="table" aria-label="Saved workspaces">
    ${list
      .map((s) => {
        const dt = new Date(s.updatedAt || s.createdAt);
        const when = dt.toLocaleString();
        return `
        <div class="sessions-row" role="row" data-id="${s.id}">
          <div class="cell name" role="cell" title="${s.name}">${s.name}</div>
          <div class="cell meta" role="cell">${when}</div>
          <div class="cell actions" role="cell">
            <button class="btn load" data-action="load">Load</button>
            <button class="btn rename" data-action="rename">Rename</button>
            <button class="btn delete" data-action="delete">Delete</button>
          </div>
        </div>`;
      })
      .join("")}
  </div>`;
}

function mountHandlers(root) {
  // Делегирование кликов по кнопкам
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const row = e.target.closest(".sessions-row");
    if (!row) return;
    const id = row.dataset.id;
    const action = btn.dataset.action;

    if (action === "load") {
      storage.sessions.load(id);
    } else if (action === "rename") {
      const cur = row.querySelector(".name")?.textContent?.trim() || "";
      const next = prompt("New name:", cur);
      if (next !== null) {
        storage.sessions.rename(id, next);
        // Перерисовать список в модалке
        const list = storage.sessions.list();
        const body = root;
        body.innerHTML = renderRows(list);
      }
    } else if (action === "delete") {
      if (confirm("Delete this snapshot?")) {
        storage.sessions.delete(id);
        row.remove();
      }
    }
  });
}

export function initSessionsModal() {
  eventBus.on("ui:sessions:open", () => {
    const list = storage.sessions.list();
    const bodyHTML = `
      <section class="about-block">
        <h3 style="margin:0 0 8px;">Saved workspaces</h3>
        <div id="sessions-modal-body">${renderRows(list)}</div>
      </section>
    `;
    openModal({
      title: "Workspaces",
      bodyHTML,
      showFooter: true, // оставим стандартный OK
    });
    // навесим обработчики после монтирования разметки
    const root = document.getElementById("sessions-modal-body");
    if (root) mountHandlers(root);
  });
}
