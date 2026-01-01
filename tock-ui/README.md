# Tock UI - Cross-Platform Time Tracker

A beautiful, cross-platform desktop application for the [Tock](https://github.com/kriuchkov/tock) CLI time tracking tool, built with Rust, Tauri, and React.

## Features

- 🚀 **Cross-Platform** - Works on Windows, macOS, and Linux
- ⚡ **Fast & Lightweight** - Built with Rust and Tauri for optimal performance
- 🎨 **Modern UI** - Beautiful React-based interface with dark mode support
- 🔄 **Full Tock Integration** - Access all Tock CLI features through a GUI
- 📊 **Activity Management** - Start, stop, and track activities with ease
- 📈 **Reports & Analytics** - View daily and historical reports
- 💾 **Native Feel** - Uses native system APIs for a true desktop experience

## Prerequisites

Before using Tock UI, you need to have the Tock CLI installed:

### Installing Tock CLI

**Homebrew (macOS):**
```bash
brew tap kriuchkov/tap
brew install tock
```

**Go Install:**
```bash
go install github.com/kriuchkov/tock/cmd/tock@latest
```

**Build from Source:**
```bash
git clone https://github.com/kriuchkov/tock
cd tock
go build -o tock ./cmd/tock
```

**Download Binary:**
Download the latest release from the [Tock Releases page](https://github.com/kriuchkov/tock/releases).

## Installation

### Download Prebuilt Binaries

Download the latest version for your platform from the [Releases](../../releases) page:

- **Windows**: `Tock-UI_x.x.x_x64_en-US.msi`
- **macOS**: `Tock-UI_x.x.x_aarch64.dmg` or `Tock-UI_x.x.x_x64.dmg`
- **Linux**: `tock-ui_x.x.x_amd64.deb` or `tock-ui_x.x.x_amd64.AppImage`

### Build from Source

#### Prerequisites for Building

1. **Node.js** (v18 or later)
2. **Rust** (latest stable)
3. **Platform-specific dependencies:**

**Linux:**
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

**macOS:**
```bash
xcode-select --install
```

**Windows:**
- Install [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- Install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

#### Build Steps

1. Clone this repository:
```bash
git clone https://github.com/DiiageCUCDB/tockApplicationCRA.git
cd tockApplicationCRA/tock-ui
```

2. Install dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

## Development

### Running in Development Mode

```bash
npm run tauri dev
```

This will start the Vite dev server and launch the Tauri application in development mode with hot-reload enabled.

### Project Structure

```
tock-ui/
├── src/                    # React frontend source
│   ├── App.tsx            # Main application component
│   ├── App.css            # Styles
│   ├── api.ts             # Tauri command API wrapper
│   ├── types.ts           # TypeScript type definitions
│   └── ...
├── src-tauri/             # Rust backend source
│   ├── src/
│   │   ├── lib.rs         # Tauri commands and logic
│   │   └── main.rs        # Application entry point
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── package.json           # Node dependencies
└── README.md
```

## Usage

### Starting an Activity

1. Click on the **Start Activity** tab
2. Enter the project name and description
3. Optionally specify a start time (HH:MM format)
4. Click **Start Activity**

### Stopping an Activity

1. Click on the **Stop Activity** tab
2. Optionally specify an end time
3. Click **Stop Activity**

### Adding Past Activities

1. Click on the **Add Past Activity** tab
2. Fill in project, description, and start time
3. Optionally add end time or duration
4. Click **Add Activity**

### Viewing Current Activity

Click on the **Current Activity** tab to see what's currently being tracked.

### Recent Activities

Click on the **Recent Activities** tab to view your last 10 activities.

### Reports

Click on the **Reports** tab and select:
- **Today** - View today's activity report
- **Yesterday** - View yesterday's activity report

## Features in Detail

### Tab Navigation
- **Start Activity** - Begin tracking a new task
- **Stop Activity** - Stop the current activity
- **Add Past Activity** - Manually log past activities
- **Current Activity** - View what's currently being tracked
- **Recent Activities** - Browse recent activity history
- **Reports** - Generate daily reports

### Cross-Platform Support

The application is built with Tauri, which uses:
- **Windows**: WebView2 (Edge)
- **macOS**: WebKit
- **Linux**: WebKitGTK

This ensures native performance and a small application size (~5-10 MB).

### Dark Mode Support

The application automatically detects and supports your system's dark mode preference.

## Configuration

Tock UI uses the same configuration as the Tock CLI:

### Storage Backends

**Flat File (Default):**
```bash
export TOCK_FILE="$HOME/.tock.txt"
```

**TimeWarrior:**
```bash
export TOCK_BACKEND="timewarrior"
export TIMEWARRIORDB="/path/to/timewarrior/data"
```

## Building for Distribution

### Windows
```bash
npm run tauri build -- --target x86_64-pc-windows-msvc
```

### macOS (Universal Binary)
```bash
npm run tauri build -- --target universal-apple-darwin
```

### Linux
```bash
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

## Troubleshooting

### "Tock CLI not found" Error

Make sure:
1. Tock CLI is installed
2. The `tock` command is in your system PATH
3. You can run `tock --version` in your terminal

### Build Errors on Linux

Install all required dependencies:
```bash
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

### macOS Code Signing

For distribution on macOS, you'll need an Apple Developer account and certificate. See [Tauri's macOS signing guide](https://tauri.app/v1/guides/distribution/sign-macos).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the GPL-3.0-or-later License - see the LICENSE file for details.

## Acknowledgments

- [Tock CLI](https://github.com/kriuchkov/tock) - The excellent command-line time tracker this UI is built for
- [Tauri](https://tauri.app/) - The framework that makes cross-platform desktop apps with web technologies possible
- [React](https://react.dev/) - The UI library used for the frontend
- [Bartib](https://github.com/nikolassv/bartib) - The original inspiration for Tock

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

