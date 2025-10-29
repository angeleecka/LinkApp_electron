// минимальный «хост» Electron
const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs/promises");

const STATE_FILE = () => path.join(app.getPath("userData"), "state.json");

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());

  // В режиме разработки можно грузить ваш index.html из корня проекта:
  await win.loadFile(path.join(__dirname, "..", "index.html"));
  // Когда появится сборка (dist) — поменяем на dist/index.html

  // Все внешние ссылки — в системном браузере
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

// IPC-мост для platform.saveAppState / loadAppState / openExternal
ipcMain.handle("platform:saveAppState", async (_e, text) => {
  const file = STATE_FILE();
  await fs.writeFile(file + ".tmp", String(text ?? ""), "utf8");
  await fs.rename(file + ".tmp", file);
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

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
