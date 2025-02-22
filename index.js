const { app, BrowserWindow, globalShortcut, Menu, shell, nativeTheme, Tray, nativeImage, ipcMain } = require('electron');
const path = require('path');
const https = require('https');
const AutoLaunch = require('auto-launch');

let store; // Electron Store (loaded dynamically)
let mainWindow;
let settingsWindow;
let tray = null;
let wasOffline = false;

// Auto-launch setup
const autoLauncher = new AutoLaunch({ name: 'ChatGPT Client', path: app.getPath('exe') });

// **Load Electron Store Dynamically**
async function loadStore() {
    if (!store) {
        const ElectronStore = (await import('electron-store')).default;
        store = new ElectronStore();
    }
}

// **Create the main application window**
async function createWindow() {
    await loadStore(); // Ensure electron-store is loaded before use

    const windowBounds = store.get('windowBounds', { width: 1024, height: 768 });

    mainWindow = new BrowserWindow({
        ...windowBounds,
        icon: path.join(__dirname, 'assets', 'icons', 'gpt-client.png'),
        webPreferences: {
            nodeIntegration: false,
            partition: 'persist:ChatGPTClientSession',
        },
        show: false // Start hidden until ready
    });

    mainWindow.loadURL('https://chatgpt.com/');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('resize', () => store.set('windowBounds', mainWindow.getBounds()));
    mainWindow.on('move', () => store.set('windowBounds', mainWindow.getBounds()));

    // **Minimize instead of closing**
    mainWindow.on('close', (event) => {
        if (!app.quitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    // **Monitor network status**
    checkInternet((isOnline) => {
        if (!isOnline) {
            wasOffline = true;
            loadOfflinePage();
        }
    });

    setInterval(() => {
        checkInternet((isOnline) => {
            if (isOnline && wasOffline) {
                console.log('🔵 Internet restored! Reloading page...');
                mainWindow.loadURL('https://chatgpt.com/');
                wasOffline = false;
            } else if (!isOnline && !wasOffline) {
                console.log('🔴 Internet lost. Loading offline page.');
                wasOffline = true;
                loadOfflinePage();
            }
        });
    }, 5000);
}

// **Create the settings window**
function createSettingsWindow() {
    if (settingsWindow) {
        settingsWindow.focus();
        return;
    }

    settingsWindow = new BrowserWindow({
        width: 400,
        height: 300,
        title: "Settings",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    settingsWindow.loadFile('settings.html');

    settingsWindow.on('closed', () => {
        settingsWindow = null;
    });
}

// **Create the system tray**
function createTray() {
    let trayIconPath = process.platform === 'darwin'
        ? path.join(__dirname, 'assets', 'icons', 'gpt-client-template.png')
        : path.join(__dirname, 'assets', 'icons', 'gpt-client.png');

    let trayIcon = nativeImage.createFromPath(trayIconPath);

    if (trayIcon.isEmpty()) {
        console.error("Error: Tray icon not found at", trayIconPath);
        trayIcon = nativeImage.createFromBuffer(Buffer.alloc(0)); // Prevents errors
    }

    tray = new Tray(trayIcon);
    tray.setToolTip('ChatGPT Client');

    const trayMenu = Menu.buildFromTemplate([
        { label: 'Show App', click: () => {
            if (!mainWindow) createWindow();

            mainWindow.show();
        }},
        { label: 'Settings', click: createSettingsWindow },
        { type: 'separator' },
        { 
            label: 'Quit', 
            click: () => {
                app.quitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(trayMenu);

    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

// **Handle Auto-Launch Toggle**
ipcMain.handle('toggle-auto-launch', async (_, enable) => {
    await loadStore();
    if (enable) {
        await autoLauncher.enable();
    } else {
        await autoLauncher.disable();
    }
    store.set('autoLaunch', enable);
});

// **Handle Custom Shortcut Registration**
ipcMain.handle('set-shortcut', async (_, shortcut) => {
    await loadStore();
    globalShortcut.unregisterAll();
    const ret = globalShortcut.register(shortcut, () => {
        mainWindow.show();
        mainWindow.focus();
    });

    if (ret) {
        store.set('shortcut', shortcut);
        return true;
    }
    return false;
});

// **Ensure Electron is Ready Before Initializing**
app.whenReady().then(async () => {
    await loadStore(); // Load electron-store before using it
    createTray();
    await createWindow();

    // **Create the custom menu**
    const menu = Menu.buildFromTemplate([
    {
        label: app.name,
        submenu: [
            { role: 'about' },
            { label: 'Settings', click: createSettingsWindow },
            { type: 'separator' },
            { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
        ]
    },
    {
        label: 'Help',
        submenu: [
            { label: 'License', click: () => shell.openExternal('https://github.com/liviu-hariton/gpt-client/blob/main/LICENSE.md') },
            { label: 'Disclaimer', click: () => shell.openExternal('https://github.com/liviu-hariton/gpt-client/blob/main/DISCLAIMER.md') },
            { label: 'Author GitHub', click: () => shell.openExternal('https://github.com/liviu-hariton') }
        ]
    }
]);

    Menu.setApplicationMenu(menu);

    // **Register saved shortcut**
    const savedShortcut = store.get('shortcut', 'Alt+Space');
    globalShortcut.register(savedShortcut, () => {
        if (!mainWindow) createWindow();
        mainWindow.show();

        mainWindow.focus();
    });

    // Listen for theme changes and notify settings window
    nativeTheme.on('updated', () => {
        if (settingsWindow) {
            settingsWindow.webContents.send('theme-updated', nativeTheme.shouldUseDarkColors);
        }
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('before-quit', () => {
    app.quitting = true;
});

// **Check internet connection**
const dns = require('dns');

let isCurrentlyOnline = null; // Stores the last known state

function checkInternet(callback) {
    dns.lookup('google.com', (err) => {
        const isOnline = !err;

        // Prevent unnecessary status changes
        if (isCurrentlyOnline !== isOnline) {
            isCurrentlyOnline = isOnline;
            callback(isOnline);
        }
    });
}

// **Offline page**
function loadOfflinePage() {
    if (!mainWindow) return; // Prevents crash if mainWindow is undefined

    const isDark = nativeTheme.shouldUseDarkColors;
    const offlineHTML = `
        <html>
        <head>
            <title>Offline</title>
            <style>
                body {
                    text-align: center;
                    font-family: sans-serif;
                    padding: 20px;
                    background-color: ${isDark ? '#121212' : '#FFFFFF'};
                    color: ${isDark ? '#FFFFFF' : '#000000'};
                }
                button {
                    background: ${isDark ? '#333' : '#DDD'};
                    color: ${isDark ? '#FFF' : '#000'};
                    padding: 10px 20px;
                    border: none;
                    cursor: pointer;
                    margin-top: 20px;
                }
                button:hover {
                    background: ${isDark ? '#444' : '#CCC'};
                }
            </style>
        </head>
        <body>
            <h2>You're Offline</h2>
            <p>Please check your Internet connection and try again.</p>
            <button onclick="location.reload()">Retry</button>
        </body>
        </html>
    `;

    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(offlineHTML)}`);
}
