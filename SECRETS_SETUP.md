# GitHub Secrets Setup for Auto-Update and Code Signing

This document explains how to set up the required GitHub secrets for auto-update functionality and code signing in the Tock UI application.

## Required Secrets

### 1. TAURI_PRIVATE_KEY and TAURI_KEY_PASSWORD

These secrets are required for signing the auto-update files so that the updater can verify the integrity of downloaded updates.

#### Generate the keys:

```bash
cd tock-ui
npx @tauri-apps/cli signer generate -w ~/.tauri/myapp.key
```

This will prompt you for a password and generate:
- A private key (saved to the specified file)
- A public key (displayed in the terminal)

#### Add to GitHub Secrets:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add `TAURI_PRIVATE_KEY`:
   - Copy the entire content of the private key file (e.g., `~/.tauri/myapp.key`)
   - Paste it as the secret value
3. Add `TAURI_KEY_PASSWORD`:
   - Enter the password you used when generating the key

### 2. TAURI_PUBLIC_KEY

This is the public key counterpart to the private key, used by the application to verify update signatures.

#### Add to GitHub Secrets:

1. Copy the public key that was displayed when you generated the private key
2. Go to your repository → Settings → Secrets and variables → Actions
3. Add `TAURI_PUBLIC_KEY`:
   - Paste the public key string

**Example public key format** (this is just an example, use your actual generated key):
```
untrusted comment: minisign public key: 1234567890ABCDEF
RWQxYzIwMWQxZjcwOGE4ZGVmYWJjZGVmMTIzNDU2Nzg5MGFiY2RlZg==
```

### 3. WINDOWS_CERTIFICATE and WINDOWS_CERTIFICATE_PASSWORD (Optional)

These secrets are required for code signing Windows installers, which is recommended for production releases to avoid Windows SmartScreen warnings.

#### Obtain a code signing certificate:

You need to purchase a code signing certificate from a trusted Certificate Authority (CA) such as:
- DigiCert
- Sectigo (formerly Comodo)
- GlobalSign

#### Prepare the certificate:

1. Export your certificate as a PFX/P12 file (includes both certificate and private key)
2. Convert it to base64:

**On Linux/macOS:**
```bash
base64 -i certificate.pfx -o certificate.base64
```

**On Windows (PowerShell):**
```powershell
$bytes = [System.IO.File]::ReadAllBytes("certificate.pfx")
$base64 = [System.Convert]::ToBase64String($bytes)
$base64 | Out-File certificate.base64
```

#### Add to GitHub Secrets:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add `WINDOWS_CERTIFICATE`:
   - Copy the content of `certificate.base64`
   - Paste it as the secret value
3. Add `WINDOWS_CERTIFICATE_PASSWORD`:
   - Enter the password for the PFX file

**Note:** Windows code signing is optional. If these secrets are not set, the workflow will skip code signing, but the installers will still be built.

## Verifying Secrets

After setting up the secrets, you can verify they work by:

1. Triggering a workflow run (push to main or manual workflow dispatch)
2. Check the workflow logs for:
   - "Public key injected into tauri.conf.json"
   - "Certificate imported successfully" (Windows only, if certificate is set)
   - Signature files (*.sig) being created during the build
   - `latest.json` containing non-empty signature fields

## Security Notes

- **Never commit** private keys, certificates, or passwords to your repository
- Keep your private key backup in a secure location
- Use different keys for development and production if needed
- Rotate your code signing certificate before it expires
- The TAURI_PRIVATE_KEY is used only in CI/CD and should never be shared
- The TAURI_PUBLIC_KEY is safe to share and will be embedded in the application

## Troubleshooting

### Auto-update not working

1. Verify `TAURI_PUBLIC_KEY` matches the private key
2. Check that signature files (.sig) are generated during build
3. Ensure `latest.json` has non-empty signature fields
4. Verify the updater endpoints in `tauri.conf.json` are correct

### Windows SmartScreen warnings

1. If you don't have a code signing certificate, Windows will show SmartScreen warnings
2. To avoid this, obtain a valid code signing certificate
3. Extended Validation (EV) certificates provide immediate reputation with SmartScreen

### Build fails with "signature verification failed"

1. Check that TAURI_KEY_PASSWORD matches the password used when generating the key
2. Verify TAURI_PRIVATE_KEY contains the complete key content

## References

- [Tauri Updater Documentation](https://tauri.app/v1/guides/distribution/updater)
- [Tauri Code Signing Guide](https://tauri.app/v1/guides/distribution/sign-windows)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
