# Building Tock UI from Source

This guide provides detailed instructions for building Tock UI on different platforms.

## Prerequisites

### All Platforms

1. **Node.js** (v18 or later)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify: `node --version`

2. **Rust** (latest stable)
   - Install from [rustup.rs](https://rustup.rs/)
   - Verify: `rustc --version`

3. **Git**
   - Verify: `git --version`

### Platform-Specific Dependencies

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

#### macOS

Install Xcode Command Line Tools:
```bash
xcode-select --install
```

#### Windows

1. Install [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
   - Select "Desktop development with C++" workload
   
2. Install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
   - Usually pre-installed on Windows 11
   - Download runtime if needed

## Building Steps

### 1. Clone the Repository

```bash
git clone https://github.com/DiiageCUCDB/tockApplicationCRA.git
cd tockApplicationCRA/tock-ui
```

### 2. Install Dependencies

```bash
npm install
```

This will download all Node.js dependencies. The first run may take a few minutes.

### 3. Build the Application

#### Development Build
```bash
npm run tauri dev
```
This launches the app in development mode with hot-reload.

#### Production Build
```bash
npm run tauri build
```

The built application will be located in `src-tauri/target/release/bundle/`:

- **Windows**: `msi/` and `nsis/` folders
- **macOS**: `dmg/` and `macos/` folders
- **Linux**: `deb/` and `appimage/` folders

### 4. Run the Built Application

#### Windows
```powershell
.\src-tauri\target\release\tock-ui.exe
```

#### macOS
```bash
open src-tauri/target/release/bundle/macos/Tock\ UI.app
```

#### Linux
```bash
./src-tauri/target/release/tock-ui
```

## Platform-Specific Build Instructions

### Building for macOS

#### Universal Binary (Intel + Apple Silicon)
```bash
npm run tauri build -- --target universal-apple-darwin
```

#### Intel Only
```bash
npm run tauri build -- --target x86_64-apple-darwin
```

#### Apple Silicon Only
```bash
npm run tauri build -- --target aarch64-apple-darwin
```

### Building for Windows

#### 64-bit (Recommended)
```bash
npm run tauri build -- --target x86_64-pc-windows-msvc
```

### Building for Linux

#### Standard Build
```bash
npm run tauri build
```

#### Cross-compilation
For building on different Linux architectures, see [Tauri's cross-compilation guide](https://tauri.app/v1/guides/building/cross-platform).

## Advanced Build Options

### Debug Build
```bash
npm run tauri build -- --debug
```

### Custom Output Directory
Set environment variable before building:
```bash
export TAURI_TARGET_DIR=/custom/path
npm run tauri build
```

### Building Without Bundling
```bash
cargo build --release --manifest-path=src-tauri/Cargo.toml
```

## Code Signing and Distribution

### macOS Code Signing

1. Obtain an Apple Developer certificate
2. Set environment variables:
```bash
export APPLE_CERTIFICATE="path/to/certificate.p12"
export APPLE_CERTIFICATE_PASSWORD="your-password"
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name"
export APPLE_ID="your@apple.id"
export APPLE_PASSWORD="app-specific-password"
```

3. Build with signing:
```bash
npm run tauri build
```

### Windows Code Signing

1. Obtain a code signing certificate
2. Configure in `tauri.conf.json` or use environment variables
3. See [Tauri Windows signing docs](https://tauri.app/v1/guides/distribution/sign-windows)

### Linux Packaging

For additional package formats:
```bash
# AppImage
npm run tauri build -- --bundles appimage

# Debian package
npm run tauri build -- --bundles deb

# Both
npm run tauri build -- --bundles appimage,deb
```

## Troubleshooting Build Issues

### Rust Compilation Errors

**Clear Cargo cache:**
```bash
cd src-tauri
cargo clean
cd ..
npm run tauri build
```

### Node Module Issues

**Clear npm cache:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### WebView Issues (Linux)

**Ensure webkit2gtk is installed:**
```bash
pkg-config --modversion webkit2gtk-4.1
```

### Build Fails on macOS

**Update Xcode Command Line Tools:**
```bash
sudo rm -rf /Library/Developer/CommandLineTools
xcode-select --install
```

### Windows Build Fails

**Verify MSVC is installed:**
```bash
where cl.exe
```

## Optimizing Build Size

### Release Profile (in `Cargo.toml`)
```toml
[profile.release]
opt-level = "z"
lto = true
codegen-units = 1
panic = "abort"
strip = true
```

### Frontend Optimization
Already configured in `vite.config.ts` for optimal builds.

## CI/CD Builds

The project includes GitHub Actions workflow (`.github/workflows/build.yml`) that automatically:
- Builds for Windows, macOS, and Linux
- Creates release artifacts
- Publishes to GitHub Releases on tagged commits

## Build Verification

After building, verify the application:

1. **Check file size**: Should be reasonable (~5-15 MB)
2. **Run the executable**: Ensure it launches
3. **Test basic functionality**: Start/stop activities
4. **Check Tock CLI integration**: Verify commands work

## Getting Help

If you encounter build issues:

1. Check this document for common solutions
2. Search [existing issues](../../issues)
3. Open a new issue with:
   - Your OS and version
   - Node.js version (`node --version`)
   - Rust version (`rustc --version`)
   - Complete error output
   - Steps to reproduce

## Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Rust Documentation](https://doc.rust-lang.org/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
