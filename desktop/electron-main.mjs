// desktop/electron-main.mjs
import { app, BrowserWindow, ipcMain, shell, nativeImage } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATE_FILE = () => path.join(app.getPath("userData"), "state.json");

// корректный AppID для иконки и таскбара (Windows)
app.setAppUserModelId("com.angevicka.linkapp");

// выбираем иконку под платформу
function appIcon() {
  const p =
    process.platform === "win32"
      ? path.join(__dirname, "assets", "icon.ico")
      : process.platform === "darwin"
      ? path.join(__dirname, "assets", "icon.icns")
      : path.join(__dirname, "assets", "icon.png");
  return nativeImage.createFromPath(p);
}

// ---- единственная версия createWindow ----
async function createWindow() {
  const preloadPath = path.join(__dirname, "preload.cjs");
  console.log("[main] preload =", preloadPath);

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    icon: appIcon(), // важное отличие: своя иконка окна/таскбара
    webPreferences: {
      preload: preloadPath, // CommonJS прелоад
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  win.once("ready-to-show", () => win.show());

  // грузим ваш index.html из корня проекта
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
  } catch {
    // Windows мог держать handle — fallback на прямую запись
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
    shell.showItemInFolder(f); // подсветит файл в проводнике
    return true;
  }
  await shell.openPath(path.dirname(f)); // fallback
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
