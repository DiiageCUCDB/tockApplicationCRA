# Version Detection and Autoupdate Implementation

## Overview

This document describes the implementation of automated version detection and autoupdate JSON generation in the GitHub Actions workflow for the Tock UI application.

## Problem Statement

The original workflow built the application first, then ran semantic-release to create releases. This meant:
- Build artifacts had outdated version numbers
- No autoupdate manifest (latest.json) was generated for Tauri updater
- Version detection happened after the build was complete

## Solution

A new three-phase workflow that:
1. **Detects version** before building
2. **Updates version files** before building
3. **Generates autoupdate JSON** for Tauri updater
4. **Builds** with correct version numbers
5. **Creates release** with all artifacts

## Implementation Details

### New Workflow Structure

```
prepare-version (ubuntu-latest, Node 22)
  ↓
build-and-release (multi-platform, Node 20)
  ↓
semantic-release (ubuntu-latest, Node 22)
```

### 1. Prepare Version Job

**Purpose**: Detect if a new version should be released and prepare version files

**Steps**:
1. Checkout repository with full history
2. Setup Node.js 22 (required by semantic-release)
3. Install dependencies
4. Run `prepare-version.js` script
5. Upload updated version files as artifacts
6. Upload generated `latest.json` as artifact

**Outputs**:
- `has_new_version`: Boolean indicating if a new version was detected
- `version`: The new version number (e.g., "1.1.0")
- `update_json_path`: Path to the generated latest.json

### 2. Build and Release Job

**Purpose**: Build the application with updated version numbers

**Steps**:
1. Checkout repository
2. Download updated version files from prepare-version job
3. Verify version files are correct
4. Setup build environment (Node.js, Rust, dependencies)
5. Build Tauri application (versions are now correct in artifacts)
6. Upload build artifacts

**Matrix Strategy**: Builds for multiple platforms
- Linux (ubuntu-22.04)
- Windows (windows-latest)

### 3. Semantic Release Job

**Purpose**: Create GitHub release with all artifacts

**Conditions**:
- Only runs on push to main/master
- Only runs if new version was detected
- Waits for both prepare-version and build-and-release jobs

**Steps**:
1. Checkout repository
2. Setup Node.js 22
3. Install semantic-release dependencies
4. Download updated version files
5. Download build artifacts
6. Download autoupdate JSON
7. Run semantic-release to create GitHub release

## Key Files

### `.github/scripts/prepare-version.js`

Node.js script that:
- Runs semantic-release in dry-run mode
- Parses output to detect next version
- Updates version in:
  - `tock-ui/package.json`
  - `tock-ui/src-tauri/Cargo.toml`
  - `tock-ui/src-tauri/tauri.conf.json`
- Generates `tock-ui/dist/latest.json` for Tauri updater
- Sets GitHub Actions outputs

### `tock-ui/.releaserc.json`

Semantic-release configuration updated to:
- Include `@semantic-release/npm` plugin (with `npmPublish: false`)
- Include `@semantic-release/git` to commit version changes
- Include `@semantic-release/github` to create releases
- Upload `latest.json` to GitHub releases

### `tock-ui/package.json`

Added semantic-release plugins as devDependencies:
- `@semantic-release/changelog`
- `@semantic-release/commit-analyzer`
- `@semantic-release/git`
- `@semantic-release/github`
- `@semantic-release/npm`
- `@semantic-release/release-notes-generator`

## Autoupdate JSON Format

The `latest.json` file follows Tauri's updater format:

```json
{
  "version": "v1.1.0",
  "notes": "Release v1.1.0",
  "pub_date": "2026-01-12T06:00:00.000Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "",
      "url": "https://github.com/OWNER/REPO/releases/download/v1.1.0/..."
    },
    "linux-x86_64": { ... },
    "darwin-x86_64": { ... },
    "darwin-aarch64": { ... }
  }
}
```

## Version Detection Logic

The script uses semantic-release's conventional commits analysis:
- `feat:` commits trigger minor version bump
- `fix:` commits trigger patch version bump
- `BREAKING CHANGE:` triggers major version bump
- Other commits (docs, chore, etc.) don't trigger releases

## Benefits

1. **Correct Versioning**: Build artifacts have the correct version before being built
2. **Automated Updates**: Tauri updater can check for new versions via latest.json
3. **Single Source of Truth**: Semantic-release determines version once
4. **Proper Workflow Order**: Version → Build → Release
5. **No Manual Updates**: All version files updated automatically

## Testing

The workflow will:
- Run on every push to main/master
- Skip version detection on pull requests (build-only)
- Skip release creation if no version bump is needed
- Use conventional commits to determine version

## Future Improvements

Potential enhancements:
- Add signature generation for autoupdate JSON
- Support macOS builds in the matrix
- Add version bump preview in PRs
- Cache semantic-release analysis results
