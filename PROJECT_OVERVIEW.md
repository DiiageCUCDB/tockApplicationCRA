# Project Overview - Tock UI

## What is Tock UI?

Tock UI is a cross-platform desktop application that provides a graphical user interface for the [Tock CLI](https://github.com/kriuchkov/tock) time tracking tool. Built with Rust (Tauri) and React, it offers a modern, lightweight alternative to command-line time tracking.

## Technology Stack

### Backend
- **Tauri 2.0** - Cross-platform desktop framework
- **Rust** - Systems programming language for performance
- **Serde** - Serialization/deserialization for data handling

### Frontend
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **CSS3** - Modern styling with dark mode

### Build Tools
- **npm** - Package management
- **Cargo** - Rust package manager
- **GitHub Actions** - CI/CD automation

## Architecture

### Component Structure

```
┌─────────────────────────────────────────┐
│           User Interface (React)        │
│  ┌─────────────────────────────────┐   │
│  │  App.tsx                        │   │
│  │  - Tab Navigation               │   │
│  │  - State Management             │   │
│  │  - User Interactions            │   │
│  └─────────────────────────────────┘   │
│              ▼                          │
│  ┌─────────────────────────────────┐   │
│  │  api.ts                         │   │
│  │  - Tauri Command Wrappers       │   │
│  │  - Type Definitions             │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
              ▼ IPC
┌─────────────────────────────────────────┐
│       Backend (Rust/Tauri)              │
│  ┌─────────────────────────────────┐   │
│  │  lib.rs                         │   │
│  │  - Tauri Commands               │   │
│  │  - CLI Execution                │   │
│  │  - Error Handling               │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│         Tock CLI (External)             │
│  - Time tracking logic                  │
│  - File storage                         │
│  - TimeWarrior integration              │
└─────────────────────────────────────────┘
```

### Data Flow

1. User interacts with React UI
2. React calls Tauri command via `invoke()`
3. Rust backend receives command
4. Rust executes Tock CLI with arguments
5. CLI output returned to Rust
6. Rust sends result back to React
7. React updates UI with result

## Key Features

### 1. Activity Management
- **Start/Stop**: Begin and end time tracking
- **Add Past**: Retroactively log activities
- **Continue**: Resume previous tasks
- **Current**: View active activity
- **Recent**: Browse activity history

### 2. Reporting
- Daily reports (today/yesterday)
- Time breakdown by project
- Formatted output display

### 3. User Experience
- Tab-based navigation
- Real-time feedback
- Loading states
- Error messages
- Dark mode support

### 4. Cross-Platform
- Windows (MSI installer)
- macOS (DMG, universal binary)
- Linux (DEB, AppImage)

## File Organization

```
tockApplicationCRA/
├── .github/
│   └── workflows/
│       └── build.yml          # CI/CD workflow
├── tock-ui/
│   ├── src/
│   │   ├── App.tsx           # Main React component
│   │   ├── App.css           # Styling
│   │   ├── api.ts            # Tauri API wrapper
│   │   ├── types.ts          # TypeScript types
│   │   └── main.tsx          # React entry point
│   ├── src-tauri/
│   │   ├── src/
│   │   │   ├── lib.rs        # Tauri commands
│   │   │   └── main.rs       # App entry point
│   │   ├── icons/            # App icons
│   │   ├── Cargo.toml        # Rust dependencies
│   │   └── tauri.conf.json   # Tauri config
│   ├── public/               # Static assets
│   ├── package.json          # Node dependencies
│   └── README.md             # Detailed docs
├── README.md                  # Main documentation
├── QUICKSTART.md             # Quick start guide
├── BUILD.md                  # Build instructions
├── EXAMPLES.md               # Usage examples
├── CONTRIBUTING.md           # Contribution guide
└── LICENSE                   # MIT License
```

## Development Workflow

### Local Development
```bash
cd tock-ui
npm install
npm run tauri dev
```

### Building
```bash
npm run tauri build
```

### Testing
- TypeScript: `npx tsc --noEmit`
- Frontend: `npm run build`
- Rust: `cargo check` (in src-tauri/)

## Security Considerations

### Data Privacy
- All data stored locally
- No network requests (except updates)
- Uses Tock CLI's security model

### Command Execution
- Validates Tock CLI installation
- Structured error handling
- Safe command argument passing

### Updates
- Manual update check
- GitHub Releases distribution
- Verified signatures (when configured)

## Performance

### Bundle Size
- **Frontend**: ~200KB (gzipped: ~62KB)
- **Application**: ~5-10MB (platform-specific)
- **Memory**: ~50-100MB runtime

### Startup Time
- **Cold start**: < 2 seconds
- **Warm start**: < 1 second

### Responsiveness
- UI updates: Immediate
- CLI execution: < 100ms typical
- Tab switching: Instant

## Browser Engines by Platform

- **Windows**: WebView2 (Chromium-based)
- **macOS**: WebKit
- **Linux**: WebKitGTK 4.1

## Distribution

### Release Process
1. Tag version: `git tag v1.0.0`
2. Push tag: `git push origin v1.0.0`
3. GitHub Actions builds for all platforms
4. Artifacts uploaded to GitHub Releases
5. Users download platform-specific installer

### Update Strategy
- Check GitHub Releases for updates
- Download and install new version
- User data preserved (uses Tock CLI files)

## Extensibility

### Adding New Commands
1. Add Rust command in `lib.rs`
2. Add TypeScript wrapper in `api.ts`
3. Update UI in `App.tsx`
4. Test functionality

### Customization
- Styling: Edit `App.css`
- Window size: Modify `tauri.conf.json`
- Commands: Add to `lib.rs`

## Future Enhancements

Potential features for future versions:
- Calendar view integration
- Export to CSV/JSON
- Custom report date ranges
- Activity templates
- Keyboard shortcuts
- System tray integration
- Notifications for long-running tasks
- Statistics and charts
- Multi-language support

## Dependencies

### Frontend
- react: ^19.1.0
- @tauri-apps/api: ^2
- vite: ^7.0.4
- typescript: ~5.8.3

### Backend
- tauri: 2
- serde: 1
- serde_json: 1

## Documentation

- **README.md**: Project overview and quick start
- **QUICKSTART.md**: Fast setup guide
- **BUILD.md**: Detailed build instructions
- **EXAMPLES.md**: Usage scenarios
- **CONTRIBUTING.md**: Contribution guidelines
- **tock-ui/README.md**: Detailed app documentation
- **tock-ui/INTERFACE.md**: UI overview

## License

MIT License - Free and open source

## Maintainers

Community-maintained project. See CONTRIBUTING.md for how to help.

## Support

- GitHub Issues: Bug reports and feature requests
- Discussions: Questions and community support
- Tock CLI Docs: CLI-specific questions

## Related Projects

- [Tock CLI](https://github.com/kriuchkov/tock) - The underlying time tracker
- [Bartib](https://github.com/nikolassv/bartib) - Original inspiration
- [TimeWarrior](https://timewarrior.net/) - Alternative time tracking
