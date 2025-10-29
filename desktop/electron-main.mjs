// desktop/electron-main.mjs
import { app, BrowserWindow, ipcMain, shell } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATE_FILE = () => path.join(app.getPath("userData"), "state.json");

async function createWindow() {
  const preloadPath = path.join(__dirname, "preload.cjs");
  console.log("[main] preload =", preloadPath);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: preloadPath, // ВАЖНО: preload.cjs (CommonJS)
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  win.once("ready-to-show", () => win.show());

  // грузим index.html из корня проекта
  await win.loadFile(path.join(__dirname, "..", "index.html"));

  // внешние ссылки — в системном браузере
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

/* ---------- IPC мост ---------- */

ipcMain.handle("platform:saveAppState", async (_e, text) => {
  const file = STATE_FILE();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file + ".tmp", String(text ?? ""), "utf8");
  try {
    await fs.rename(file + ".tmp", file);
  } catch (e) {
    // Windows может держать handle — fallback на прямую запись
    await fs.writeFile(file, String(text ?? ""), "utf8");
  }
  return true;
});

ipcMain.handle("platform:loadAppState", async () => {
  try {
    return await fs.readFile(STATE_FILE(), "utf8");
  } catch {
    return null;
  }
});

ipcMain.handle("platform:openExternal", async (_e, url) => {
  if (url) await shell.openExternal(String(url));
  return true;
});

ipcMain.handle("platform:getUserDataPath", async () => app.getPath("userData"));

ipcMain.handle("platform:openPath", async (_e, target) => {
  const p = String(target || "");
  if (!p) return "";
  return await shell.openPath(p);
});

ipcMain.handle("platform:openDataFolder", async () => {
  const p = app.getPath("userData");
  await shell.openPath(p);
  return true;
});

ipcMain.handle("platform:revealStateFile", async () => {
  const f = STATE_FILE();
  if (typeof shell.showItemInFolder === "function") {
    shell.showItemInFolder(f);
    return true;
  }
  await shell.openPath(path.dirname(f));
  return true;
});

/* ---------- lifecycle ---------- */

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
