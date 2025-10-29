// ui/panel-study.js
import { eventBus } from "../core/event-bus.js";

let mounted = false;

export function initStudyPanel() {
  if (mounted) return;
  const root = document.getElementById("linkapp-root");
  if (!root) return;

  const panel = document.createElement("aside");
  panel.id = "study-panel";
  panel.className = "study-panel";
  panel.innerHTML = `
    <div class="study-panel-header">
      <span class="study-title">Study Planner</span>
      <button class="study-close ui-icon-btn ui-icon-16" title="Close">✕</button>
    </div>
    <div class="study-panel-body">
      <div class="study-monthbar">
        <button class="nav prev" title="Prev month">◀</button>
        <span class="month-label">October 2025</span>
        <button class="nav next" title="Next month">▶</button>
      </div>
      <div class="study-weekgrid">
        <!-- здесь потом будут дни с чекбоксами -->
      </div>
    </div>
  `;
  root.appendChild(panel);

  panel
    .querySelector(".study-close")
    ?.addEventListener("click", closeStudyPanel);

  // События управления
  eventBus.on("study:open", openStudyPanel);
  eventBus.on("study:close", closeStudyPanel);
  eventBus.on("study:toggle", () => {
    document.body.classList.toggle("with-study-panel");
  });

  mounted = true;
}

export function openStudyPanel() {
  document.body.classList.add("with-study-panel");
}
export function closeStudyPanel() {
  document.body.classList.remove("with-study-panel");
}
