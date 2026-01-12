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
  
  // Check if file exists
  if (!fs.existsSync(cargoTomlPath)) {
    error(`Cargo.toml not found at: ${cargoTomlPath}`);
    throw new Error(`Cargo.toml not found at: ${cargoTomlPath}`);
  }
  
  let content = fs.readFileSync(cargoTomlPath, 'utf-8');
  log(`Original Cargo.toml content (first few lines):`);
  console.log(content.split('\n').slice(0, 10).join('\n'));
  
  // Update version line
  const updatedContent = content.replace(/^version = ".*"/m, `version = "${version}"`);
  
  if (content === updatedContent) {
    error('Failed to update version in Cargo.toml');
    error(`Content before: ${content.match(/^version = ".*"/m)}`);
    error(`Expected: version = "${version}"`);
    throw new Error('Failed to update version in Cargo.toml');
  }
  
  fs.writeFileSync(cargoTomlPath, updatedContent);
  log(`Successfully updated Cargo.toml to version ${version}`);
  
  // Verify the update
  const verifyContent = fs.readFileSync(cargoTomlPath, 'utf-8');
  const versionLine = verifyContent.match(/^version = ".*"/m);
  log(`Verified Cargo.toml version line: ${versionLine}`);
}

/**
 * Update tauri.conf.json with new version
 */
function updateTauriConfig(version) {
  const tauriConfigPath = path.join(TOCK_UI_DIR, 'src-tauri', 'tauri.conf.json');
  log(`Updating ${tauriConfigPath} to version ${version}`);
  
  // Check if file exists
  if (!fs.existsSync(tauriConfigPath)) {
    error(`tauri.conf.json not found at: ${tauriConfigPath}`);
    throw new Error(`tauri.conf.json not found at: ${tauriConfigPath}`);
  }
  
  const config = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf-8'));
  log(`Original tauri.conf.json version: ${config.version}`);
  
  config.version = version;
  fs.writeFileSync(tauriConfigPath, JSON.stringify(config, null, 2) + '\n');
  log(`Successfully updated tauri.conf.json to version ${version}`);
  
  // Verify the update
  const verifyConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf-8'));
  log(`Verified tauri.conf.json version: ${verifyConfig.version}`);
}

/**
 * Generate latest.json for Tauri updater
 */
function generateUpdateJson(version) {
  log(`Generating latest.json for version ${version}`);
  
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) {
    throw new Error('GITHUB_REPOSITORY environment variable is not set');
  }
  
  const [repoOwner, repoName] = repository.split('/');
  
  // Note: The actual URLs will need to match the artifact names produced by Tauri build
  // For Tauri updater, the files should be the signed update bundles (.tar.gz or .zip)
  // These are generated by Tauri when TAURI_PRIVATE_KEY is set
  const updateJson = {
    version: `v${version}`,
    notes: `Release v${version}`,
    pub_date: new Date().toISOString(),
    platforms: {
      "windows-x86_64": {
        signature: "",
        url: `https://github.com/${repoOwner}/${repoName}/releases/download/v${version}/Tock-UI_${version}_x64-setup.nsis.zip`
      },
      "linux-x86_64": {
        signature: "",
        url: `https://github.com/${repoOwner}/${repoName}/releases/download/v${version}/tock-ui_${version}_amd64.AppImage.tar.gz`
      },
      "darwin-x86_64": {
        signature: "",
        url: `https://github.com/${repoOwner}/${repoName}/releases/download/v${version}/Tock-UI_x64.app.tar.gz`
      },
      "darwin-aarch64": {
        signature: "",
        url: `https://github.com/${repoOwner}/${repoName}/releases/download/v${version}/Tock-UI_aarch64.app.tar.gz`
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
  log(`Note: URLs in latest.json are placeholders and may need adjustment based on actual Tauri build artifacts`);
  
  return outputPath;
}

/**
 * Set GitHub Actions output
 */
function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `${name}=${value}\n`);
  } else {
    // Fallback for local testing
    log(`Output: ${name}=${value}`);
  }
}
/**
 * Main execution
 */
function main() {
  try {
    log('Starting version preparation...');
    log(`Working directory: ${TOCK_UI_DIR}`);
    
    // List files to verify structure
    log('Directory structure:');
    try {
      const files = fs.readdirSync(TOCK_UI_DIR);
      console.log(files);
      
      if (fs.existsSync(path.join(TOCK_UI_DIR, 'src-tauri'))) {
        const tauriFiles = fs.readdirSync(path.join(TOCK_UI_DIR, 'src-tauri'));
        console.log('src-tauri contents:', tauriFiles);
      }
    } catch (err) {
      log(`Error listing files: ${err.message}`);
    }
    
    const nextVersion = getNextVersion();
    
    if (!nextVersion) {
      log('No version update needed');
      setOutput('has_new_version', 'false');
      setOutput('version', '');
      return;
    }
    
    log(`Next version detected: ${nextVersion}`);
    
    // Update all version files with verification
    updatePackageJson(nextVersion);
    updateCargoToml(nextVersion);
    updateTauriConfig(nextVersion);
    
    // Verify all files after update
    log('=== Final verification ===');
    const finalPackageJson = JSON.parse(fs.readFileSync(path.join(TOCK_UI_DIR, 'package.json'), 'utf-8'));
    log(`package.json version: ${finalPackageJson.version}`);
    
    const cargoContent = fs.readFileSync(path.join(TOCK_UI_DIR, 'src-tauri', 'Cargo.toml'), 'utf-8');
    const cargoVersion = cargoContent.match(/^version = "(.*)"/m);
    log(`Cargo.toml version: ${cargoVersion ? cargoVersion[1] : 'NOT FOUND'}`);
    
    const tauriConfig = JSON.parse(fs.readFileSync(path.join(TOCK_UI_DIR, 'src-tauri', 'tauri.conf.json'), 'utf-8'));
    log(`tauri.conf.json version: ${tauriConfig.version}`);
    
    // Generate autoupdate JSON
    const updateJsonPath = generateUpdateJson(nextVersion);
    
    // Set outputs for GitHub Actions
    setOutput('has_new_version', 'true');
    setOutput('version', nextVersion);
    setOutput('update_json_path', updateJsonPath);
    
    log(`Version preparation complete: v${nextVersion}`);
  } catch (err) {
    error(`Version preparation failed: ${err.message}`);
    error(err.stack);
    process.exit(1);
  }
}

main();
