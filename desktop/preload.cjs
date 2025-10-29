// desktop/preload.cjs
const { contextBridge, ipcRenderer } = require("electron");

console.log(
  "[preload] loaded; contextIsolation=%s, sandboxed=%s",
  process.contextIsolated,
  process.sandboxed
);

contextBridge.exposeInMainWorld("desktop", {
  platform: {
    saveAppState: (text) => ipcRenderer.invoke("platform:saveAppState", text),
    loadAppState: () => ipcRenderer.invoke("platform:loadAppState"),
    openExternal: (url) => ipcRenderer.invoke("platform:openExternal", url),

    // нужны для меню
    getUserDataPath: () => ipcRenderer.invoke("platform:getUserDataPath"),
    openPath: (p) => ipcRenderer.invoke("platform:openPath", p),
    openDataFolder: () => ipcRenderer.invoke("platform:openDataFolder"),
    revealStateFile: () => ipcRenderer.invoke("platform:revealStateFile"),
  },

  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});
