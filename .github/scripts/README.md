# GitHub Workflow Scripts

## prepare-version.js

This script is used in the GitHub Actions workflow to detect and prepare version updates before building the application.

### Purpose

The script performs the following tasks:

1. **Version Detection**: Runs `semantic-release` in dry-run mode to determine if a new version should be released based on commit messages
2. **Version Update**: Updates version numbers in the following files:
   - `tock-ui/package.json`
   - `tock-ui/src-tauri/Cargo.toml`
   - `tock-ui/src-tauri/tauri.conf.json`
3. **Autoupdate JSON Generation**: Creates `latest.json` for the Tauri updater plugin

### How It Works

1. The script uses semantic-release's dry-run mode to analyze commits and determine the next version
2. If a new version is detected, it updates all version files
3. It generates the `latest.json` file with download URLs for the new version
4. The script outputs the following information for GitHub Actions:
   - `has_new_version`: Whether a new version was detected
   - `version`: The new version number
   - `update_json_path`: Path to the generated `latest.json` file

### Workflow Integration

The script is called in the `prepare-version` job, which runs before the build:

```yaml
- name: Detect version and update files
  id: version-check
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: node .github/scripts/prepare-version.js
```

Updated version files are then uploaded as artifacts and downloaded by the build jobs to ensure the built application has the correct version.

### Requirements

- Node.js runtime
- `semantic-release` and its plugins installed in `tock-ui` directory
- `GITHUB_TOKEN` environment variable for semantic-release

### Output

The script sets GitHub Actions outputs that can be used in subsequent jobs:

```yaml
needs.prepare-version.outputs.has_new_version
needs.prepare-version.outputs.version
needs.prepare-version.outputs.update_json_path
```
