# Tock UI - Application Overview

## User Interface

The Tock UI application provides a clean, modern interface with the following sections:

### Header
- Application title: "⏱️ Tock Time Tracker"
- Subtitle: "A cross-platform GUI for Tock CLI"
- Purple gradient background for visual appeal

### Tab Navigation
The main interface uses a tabbed layout with 6 primary sections:

1. **Start Activity Tab**
   - Input fields:
     * Project name (required)
     * Description (required)
     * Start time (optional, HH:MM format)
   - "Start Activity" button
   - Success/error message display

2. **Stop Activity Tab**
   - Input field:
     * End time (optional, HH:MM format)
   - "Stop Activity" button
   - Stops the currently running activity

3. **Add Past Activity Tab**
   - Input fields:
     * Project name (required)
     * Description (required)
     * Start time (required, HH:MM or YYYY-MM-DD HH:MM)
     * End time (optional)
     * Duration (optional, e.g., "1h30m")
   - "Add Activity" button
   - Useful for retroactive logging

4. **Current Activity Tab**
   - Displays the currently running activity
   - Shows output from `tock current` command
   - "Refresh" button to update the display
   - Formatted code block display

5. **Recent Activities Tab**
   - Shows last 10 activities
   - Output from `tock last` command
   - "Refresh" button
   - Helps find activities to continue

6. **Reports Tab**
   - Two buttons:
     * "Today" - Generate today's report
     * "Yesterday" - Generate yesterday's report
   - Report output displayed in formatted code block
   - Shows time breakdown by project

### Visual Design

**Color Scheme:**
- Primary gradient: Purple (#667eea) to Purple-Pink (#764ba2)
- Light background: #f6f6f6
- Dark mode: #1a1a1a background with lighter text
- Success messages: Green tones
- Error messages: Red tones

**Typography:**
- Clean, sans-serif fonts
- Clear hierarchy with different sizes
- Monospace for code/output displays

**Layout:**
- Centered container (max-width: 800px)
- Responsive design for different screen sizes
- Cards with shadows for depth
- Smooth transitions and hover effects

### Dark Mode
- Automatic detection of system theme preference
- Adjusted colors for better readability in dark mode
- Maintains the purple gradient theme

### Error Handling
- Installation check on startup
- If Tock CLI not found:
  * Error screen with installation instructions
  * Support for Homebrew, Go install, and source builds
  * "Check Again" button to retry detection

### Loading States
- Loading indicators during async operations
- Disabled buttons during processing
- Clear feedback for all actions

### Message System
- Success messages (green background)
- Error messages (red background)
- Auto-dismiss after 5 seconds
- Positioned at the top of the interface

## Technical Details

**Frontend Stack:**
- React 19 with TypeScript
- Vite for fast builds
- Modern CSS with variables
- Responsive design with media queries

**Backend:**
- Rust with Tauri 2
- Direct CLI command execution
- Structured error handling
- Cross-platform compatibility

**Window Configuration:**
- Default size: 900x700px
- Minimum size: 600x500px
- Resizable window
- Native title bar

## Platform-Specific Features

**Windows:**
- MSI installer
- WebView2 integration
- Native Windows styling

**macOS:**
- DMG installer
- App bundle
- Universal binary (Intel + Apple Silicon)
- Native macOS styling

**Linux:**
- .deb and AppImage packages
- WebKitGTK integration
- Desktop file integration
