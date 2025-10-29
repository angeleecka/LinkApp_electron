// core/app.js

import { eventBus } from "./event-bus.js";
import { storage } from "./storage.js";
import { initLayout } from "../ui/layout.js";

export const app = {
  init() {
    console.log("🔹 Initializing Linkapp core...");

    initLayout();
    //initHeader(); -- убрать

    // load data
    // storage.init();

    // subscribe to storage events
    eventBus.on("storage:loaded", (data) => {
      console.log("✅ Storage loaded:", data);
      this.render(data);
    });

    eventBus.on("storage:updated", (data) => {
      console.log("💾 Storage updated:", data);
      this.render(data);
    });
  },

  render(data) {
    // placeholder: UI will listen to storage events and render itself.
    console.log("📦 app.render()", data);
  },
};
