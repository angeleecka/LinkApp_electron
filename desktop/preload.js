const { contextBridge, ipcRenderer } = require("electron");

// Открываем маленький безопасный API в окне (renderer)
contextBridge.exposeInMainWorld("desktop", {
  platform: {
    saveAppState: (text) => ipcRenderer.invoke("platform:saveAppState", text),
    loadAppState: () => ipcRenderer.invoke("platform:loadAppState"),
    openExternal: (url) => ipcRenderer.invoke("platform:openExternal", url),
  },
});
