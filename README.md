# Tock Application - Cross-Platform Time Tracker UI
 
A beautiful, cross-platform desktop GUI application for the [Tock CLI](https://github.com/kriuchkov/tock) time tracking tool.

Built with **Rust**, **Tauri**, and **React** for maximum performance and minimal resource usage.

## 🚀 Quick Start

**Just want to get started?** Check out the [Quick Start Guide](QUICKSTART.md)!

### Download & Install

1. **Download** the latest release for your platform:
   - [Windows Installer](../../releases) (.msi)
   - [macOS Application](../../releases) (.dmg)
   - [Linux Package](../../releases) (.deb, .AppImage)

2. **Install Tock CLI** (required):
   ```bash
   # macOS
   brew tap kriuchkov/tap
   brew install tock
   
   # or using Go
   go install github.com/kriuchkov/tock/cmd/tock@latest
   ```

3. **Run the application** and start tracking your time!

## 📸 Screenshots

The Tock UI provides an intuitive interface for all Tock CLI features:
- Start/Stop activity tracking
- Add past activities
- View current and recent activities
- Generate daily reports
- Full dark mode support

## ✨ Features

- 🖥️ **Cross-Platform** - Windows, macOS, and Linux support
- ⚡ **Lightweight** - Small binary size (~5-10 MB) with native performance
- 🎨 **Modern Interface** - Beautiful React UI with responsive design
- 🌙 **Dark Mode** - Automatic system theme detection
- 🔄 **Full Tock Integration** - All CLI features accessible via GUI
- 📊 **Activity Management** - Easy time tracking and reporting
- 🔒 **Privacy First** - All data stored locally using Tock's file format

## 🛠️ Development

See the [Build Instructions](BUILD.md) for detailed build information.

### Quick Development Setup

```bash
cd tock-ui
npm install
npm run tauri dev
```

## 📚 Documentation
 
- [Quick Start Guide](QUICKSTART.md) - Get up and running in minutes
- [User Guide](./tock-ui/README.md#usage) - How to use the application
- [Build Instructions](BUILD.md) - Detailed build guide for all platforms
- [Secrets Setup Guide](SECRETS_SETUP.md) - Configure auto-update and code signing (for maintainers)
- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Tock CLI Documentation](https://github.com/kriuchkov/tock) - CLI reference

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

This application is a GUI wrapper for the excellent [Tock CLI](https://github.com/kriuchkov/tock) by kriuchkov.

Special thanks to:
- The [Tauri](https://tauri.app/) team for the amazing framework
- The [React](https://react.dev/) team for the UI library
- The Rust community for excellent tooling

