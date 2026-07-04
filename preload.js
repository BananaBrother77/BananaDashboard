const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dashboardAPI', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getResources: () => ipcRenderer.invoke('get-resources'),
  setTab: (tab) => ipcRenderer.invoke('set-presence-tab', tab),
  getRpcStatus: () => ipcRenderer.invoke('get-rpc-status'),
  reconnectRpc: () => ipcRenderer.invoke('reconnect-rpc'),
  setRpcEnabled: (val) => ipcRenderer.invoke('set-rpc-enabled', val),
  onRpcStatus: (callback) => {
    ipcRenderer.on('rpc-status', (_, data) => callback(data));
    ipcRenderer.invoke('get-rpc-status').then((data) => callback(data));
  },
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (_, data) => callback(data));
  },
});
