const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dashboardAPI', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getResources: () => ipcRenderer.invoke('get-resources'),
});
