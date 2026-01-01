# Quick Start Guide - Tock UI

This guide will help you get started with Tock UI in just a few minutes.

## Step 1: Install Tock CLI

Tock UI requires the Tock CLI to be installed. Choose one of the following methods:

### macOS (Recommended)
```bash
brew tap kriuchkov/tap
brew install tock
```

### Using Go
```bash
go install github.com/kriuchkov/tock/cmd/tock@latest
```

### Verify Installation
```bash
tock --version
```

## Step 2: Download Tock UI

Download the appropriate installer for your platform from the [Releases page](../../releases):

- **Windows**: Download and run the `.msi` installer
- **macOS**: Download the `.dmg` file, open it, and drag Tock UI to Applications
- **Linux**: 
  - `.deb` package: `sudo dpkg -i tock-ui_*.deb`
  - `.AppImage`: Make executable and run: `chmod +x *.AppImage && ./tock-ui_*.AppImage`

## Step 3: Launch Tock UI

- **Windows**: Search for "Tock UI" in the Start menu
- **macOS**: Open from Applications folder or Launchpad
- **Linux**: Run from your applications menu or command line

## Step 4: Start Tracking

1. **Start a new activity**:
   - Click on "Start Activity" tab
   - Enter your project name (e.g., "My Project")
   - Enter a description (e.g., "Working on feature X")
   - Click "Start Activity"

2. **Stop the activity when done**:
   - Click on "Stop Activity" tab
   - Click "Stop Activity" button

3. **View your time**:
   - Click on "Reports" tab
   - Click "Today" to see today's report

## Common Use Cases

### Logging Past Work
If you forgot to start tracking:
1. Go to "Add Past Activity" tab
2. Fill in project, description, and start time (e.g., "14:00")
3. Add end time or duration
4. Click "Add Activity"

### Continuing Previous Work
To resume a previous task:
1. Go to "Recent Activities" to see your history
2. Note which activity you want to continue
3. Use the "Start Activity" tab with the same project/description

### Viewing Reports
1. Click "Reports" tab
2. Choose "Today" or "Yesterday"
3. View your time breakdown

## Tips

- Keep the app open while working - it's lightweight
- Use descriptive project names for better organization
- Review your "Current Activity" regularly to ensure tracking is active
- Check "Recent Activities" to quickly restart common tasks

## Troubleshooting

### "Tock CLI not found" error
- Ensure Tock CLI is installed: `tock --version`
- Make sure `tock` is in your system PATH
- Restart Tock UI after installing Tock CLI

### Application won't start
- Check system requirements
- On Linux, ensure required libraries are installed
- On macOS, allow the app in Security & Privacy settings

## Next Steps

- Read the [full README](README.md) for advanced features
- Configure Tock CLI storage backend if needed
- Set up shell completion for CLI usage alongside the UI

## Need Help?

- [Open an issue](../../issues) for bugs or questions
- Check the [Tock CLI documentation](https://github.com/kriuchkov/tock) for CLI-specific features
