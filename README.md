![GitHub release (latest by date)](https://img.shields.io/github/v/release/liviu-hariton/gpt-client)
![GitHub issues](https://img.shields.io/github/issues/liviu-hariton/gpt-client)
![GitHub pull requests](https://img.shields.io/github/issues-pr/liviu-hariton/gpt-client)
![GitHub](https://img.shields.io/github/license/liviu-hariton/gpt-client)

# ChatGPT client

A simple application (built with Electron) that loads the [ChatGPT](https://chatgpt.com/) website and can be toggled using a global hotkey for easy access. The app supports persistent sessions (cookies and local storage) so that users remain logged in or remembered between sessions.

**NOTE:** the app stores any cookies or private data only locally, on your own computer or on the OpenAI servers (accordingly with their _modus operandi_).

This app is intended for those who don't have an Apple Silicon device (as the official [ChatGPT app](https://openai.com/chatgpt/download/) is intended only for those with Apple Silicon (M1 or better) devices).

## Features

* **Global Hotkey:** Toggle the app's visibility using a global hotkey (default is `⌥ (Option) + Space`).
* **System Tray** Support - Minimizes to tray instead of quitting
* **Auto-Launch** on Startup - Optional setting in Preferences
* **Customizable Global Shortcut** - Set your own keys combination
* **Dark Mode** & Theme Awareness
* **Network Aware** - Offline detection & fallback page
* **Persistent Sessions:** Utilizes a persistent partition for session data to keep cookies and local storage between app launches.

## Usage

### Launching the App

* Open the app manually from the system menu
* Use the global shortcut (Alt+Space by default) to open it instantly
* The app will minimize to the system tray instead of closing
* Right-click the tray icon to access Settings or Quit

### Offline Mode

* If your internet connection is lost, the app displays an offline page instead of breaking.
* The page will automatically reload when connectivity is restored.

### Keyboard Shortcuts

* Open App: `⌥ (Option) + Space` (default, configurable in settings)
* Quit App: `⌘ (Cmd) + Q`

### Settings

* Access settings via the tray icon or the app menu:
* Change Keyboard Shortcut
* Enable/Disable Auto-Launch on Startup
* Switch Between Dark & Light Mode (Automatically follows system settings)

### Build it yourself

1. Clone the Repository

```bash
git clone https://github.com/liviu-hariton/gpt-client.git
cd gpt-client
```
2. Build it with

```bash
npx electron-packager . ChatGPTClient --platform=darwin --arch=x64 --icon=assets/icons/gpt-client.icns --out=dist --overwrite
```

### License
This application and it's code are licensed under the MIT License. See the [LICENSE](LICENSE.md) file for more details.

### Disclaimer
This tool, **ChatGTP client**, is provided "as is" and is intended for use by developers on macOS with Intel chips for using their ChatGPT account outside the web browser. See the [DISCLAIMER](DISCLAIMER.md) file for more details.