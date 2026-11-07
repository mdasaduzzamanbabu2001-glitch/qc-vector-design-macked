const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    startTask: (data) => ipcRenderer.send('start-automation', data),
    toggleView: (show) => ipcRenderer.send('toggle-view', show),
    refreshGallery: () => ipcRenderer.send('refresh-gallery'),
    startReset: () => ipcRenderer.send('start-reset'),

    onGalleryData: (callback) => {
        ipcRenderer.removeAllListeners('gallery-data');
        ipcRenderer.on('gallery-data', (_event, data) => callback(data));
    },
    onProgressUpdate: (callback) => {
        ipcRenderer.removeAllListeners('progress-update');
        ipcRenderer.on('progress-update', (_event, data) => callback(data));
    },
    onStatusUpdate: (callback) => {
        ipcRenderer.removeAllListeners('status-update');
        ipcRenderer.on('status-update', (_event, message) => callback(message));
    }
});