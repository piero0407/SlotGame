const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('slotBridge', {
  getWindowInfo: () => ipcRenderer.invoke('slot:get-window-info'),
  requestSpin: (options) => ipcRenderer.send('slot:request-spin', options),
  enableDebugMode: () => ipcRenderer.send('slot:enable-debug-mode'),
  toggleMaximize: () => ipcRenderer.send('slot:toggle-maximize'),
  reelStopped: (payload) => ipcRenderer.send('slot:reel-stopped', payload),
  onSpinStart: (callback) => ipcRenderer.on('slot:spin-start', (_event, payload) => callback(payload)),
  onSpinResult: (callback) => ipcRenderer.on('slot:spin-result', (_event, payload) => callback(payload)),
  onDebugModeChanged: (callback) => ipcRenderer.on('slot:debug-mode-changed', (_event, payload) => callback(payload)),
});
