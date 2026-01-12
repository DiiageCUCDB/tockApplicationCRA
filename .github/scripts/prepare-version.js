#!/usr/bin/env node

/**
 * This script uses semantic-release to determine the next version,
 * then updates version files and generates the autoupdate JSON.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = process.env.GITHUB_WORKSPACE || process.cwd();
const TOCK_UI_DIR = path.join(WORKSPACE_ROOT, 'tock-ui');

function log(message) {
  console.log(`[prepare-version] ${message}`);
}

function error(message) {
  console.error(`[prepare-version ERROR] ${message}`);
}

/**
 * Get the next version from semantic-release dry-run
 */
function getNextVersion() {
  log('Running semantic-release in dry-run mode to detect next version...');
  
  try {
    const output = execSync('npx semantic-release --dry-run', {
      cwd: TOCK_UI_DIR,
      encoding: 'utf-8',
      env: {
        ...process.env,
        GITHUB_ACTIONS: 'true'
      }
    });
    
    log('Semantic-release output:');
    console.log(output);
    
    // Parse semantic-release output to find the next version
    const versionMatch = output.match(/Published release (\d+\.\d+\.\d+)/i) ||
                         output.match(/next release version is (\d+\.\d+\.\d+)/i) ||
                         output.match(/The next release version is (\d+\.\d+\.\d+)/i) ||
                         output.match(/Release version (\d+\.\d+\.\d+)/i);
    
    if (versionMatch) {
      return versionMatch[1];
    }
    
    // Check if there are no new commits requiring a release
    if (output.includes('There are no relevant changes') || 
        output.includes('no release') ||
        output.includes('skip release')) {
      log('No new version to release - no relevant changes found');
      return null;
    }
    
    throw new Error('Could not determine next version from semantic-release output');
  } catch (err) {
    // Check if error output contains version info
    const errorOutput = err.stderr?.toString() || err.stdout?.toString() || err.message || '';
    
    log('Error output from semantic-release:');
    console.log(errorOutput);
    
    const versionMatch = errorOutput.match(/Published release (\d+\.\d+\.\d+)/i) ||
                         errorOutput.match(/next release version is (\d+\.\d+\.\d+)/i) ||
                         errorOutput.match(/The next release version is (\d+\.\d+\.\d+)/i) ||
                         errorOutput.match(/Release version (\d+\.\d+\.\d+)/i);
    
    if (versionMatch) {
      return versionMatch[1];
    }
    
    if (errorOutput.includes('There are no relevant changes') || 
        errorOutput.includes('no release') ||
        errorOutput.includes('skip release')) {
      log('No new version to release - no relevant changes found');
      return null;
    }
    
    error(`Failed to get next version: ${err.message}`);
    throw err;
  }
}

/**
 * Update package.json with new version
 */
function updatePackageJson(version) {
  const packageJsonPath = path.join(TOCK_UI_DIR, 'package.json');
  log(`Updating ${packageJsonPath} to version ${version}`);
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  packageJson.version = version;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

/**
 * Update Cargo.toml with new version
 */
function updateCargoToml(version) {
  const cargoTomlPath = path.join(TOCK_UI_DIR, 'src-tauri', 'Cargo.toml');
  log(`Updating ${cargoTomlPath} to version ${version}`);
  
  let content = fs.readFileSync(cargoTomlPath, 'utf-8');
  content = content.replace(/^version = ".*"/m, `version = "${version}"`);
  fs.writeFileSync(cargoTomlPath, content);
}

/**
 * Update tauri.conf.json with new version
 */
function updateTauriConfig(version) {
  const tauriConfigPath = path.join(TOCK_UI_DIR, 'src-tauri', 'tauri.conf.json');
  log(`Updating ${tauriConfigPath} to version ${version}`);
  
  const config = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf-8'));
  config.version = version;
  fs.writeFileSync(tauriConfigPath, JSON.stringify(config, null, 2) + '\n');
}

/**
 * Generate latest.json for Tauri updater
 */
function generateUpdateJson(version) {
  log(`Generating latest.json for version ${version}`);
  
  const repoOwner = process.env.GITHUB_REPOSITORY?.split('/')[0] || 'DiiageCUCDB';
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'tockApplicationCRA';
  
  const updateJson = {
    version: `v${version}`,
    notes: `Release v${version}`,
    pub_date: new Date().toISOString(),
    platforms: {
      "windows-x86_64": {
        signature: "",
        url: `https://github.com/${repoOwner}/${repoName}/releases/download/v${version}/tock-ui_${version}_x64_en-US.msi.zip`
      },
      "linux-x86_64": {
        signature: "",
        url: `https://github.com/${repoOwner}/${repoName}/releases/download/v${version}/tock-ui_${version}_amd64.AppImage.tar.gz`
      },
      "darwin-x86_64": {
        signature: "",
        url: `https://github.com/${repoOwner}/${repoName}/releases/download/v${version}/tock-ui_${version}_x64.app.tar.gz`
      },
      "darwin-aarch64": {
        signature: "",
        url: `https://github.com/${repoOwner}/${repoName}/releases/download/v${version}/tock-ui_${version}_aarch64.app.tar.gz`
      }
    }
  };
  
  const outputDir = path.join(TOCK_UI_DIR, 'dist');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, 'latest.json');
  fs.writeFileSync(outputPath, JSON.stringify(updateJson, null, 2) + '\n');
  log(`Created ${outputPath}`);
  
  return outputPath;
}

/**
 * Set GitHub Actions output
 */
function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `${name}=${value}\n`);
  }
  console.log(`::set-output name=${name}::${value}`);
}

/**
 * Main execution
 */
function main() {
  try {
    log('Starting version preparation...');
    
    const nextVersion = getNextVersion();
    
    if (!nextVersion) {
      log('No version update needed');
      setOutput('has_new_version', 'false');
      setOutput('version', '');
      return;
    }
    
    log(`Next version detected: ${nextVersion}`);
    
    // Update all version files
    updatePackageJson(nextVersion);
    updateCargoToml(nextVersion);
    updateTauriConfig(nextVersion);
    
    // Generate autoupdate JSON
    const updateJsonPath = generateUpdateJson(nextVersion);
    
    // Set outputs for GitHub Actions
    setOutput('has_new_version', 'true');
    setOutput('version', nextVersion);
    setOutput('update_json_path', updateJsonPath);
    
    log(`Version preparation complete: v${nextVersion}`);
  } catch (err) {
    error(`Version preparation failed: ${err.message}`);
    process.exit(1);
  }
}

main();
