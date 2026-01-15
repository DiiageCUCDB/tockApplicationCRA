import React, { useState, useEffect } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { getVersion } from '@tauri-apps/api/app';

interface UpdateCheckerProps {
  showMessage: (type: 'success' | 'error', text: string) => void;
}

export const UpdateChecker: React.FC<UpdateCheckerProps> = ({ showMessage }) => {
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('');
  const [latestVersion, setLatestVersion] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Get current version from package.json
  useEffect(() => {
    const loadVersion = async () => {
      try {
        const v = await getVersion();
        setCurrentVersion(v || '');
      } catch {
        // Fallback for web/dev environment: read package.json
        try {
          const pkg = await import('../../package.json');
          setCurrentVersion((pkg as any).version || 'unknown');
        } catch {
          setCurrentVersion('unknown');
        }
      }
    };

    loadVersion();
  }, []);

  const checkForUpdates = async () => {
    setChecking(true);
    try {
      const update = await check();
      
      if (update?.available) {
        setUpdateAvailable(true);
        setLatestVersion(update.version);
        showMessage('success', `Update available: v${update.version}`);
      } else {
        setUpdateAvailable(false);
        showMessage('success', 'You are running the latest version');
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
      showMessage('error', 'Failed to check for updates');
    } finally {
      setChecking(false);
    }
  };

  const downloadAndInstall = async () => {
    setDownloading(true);
    setDownloadProgress(0);
    
    try {
      const update = await check();
      
      if (!update?.available) {
        showMessage('error', 'No update available');
        setDownloading(false);
        return;
      }

      // Download and install the update
      let totalSize = 0;
      let downloaded = 0;
      
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            setDownloadProgress(0);
            totalSize = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (totalSize > 0) {
              setDownloadProgress(Math.round((downloaded / totalSize) * 100));
            }
            break;
          case 'Finished':
            setDownloadProgress(100);
            break;
        }
      });

      showMessage('success', 'Update installed successfully. Restarting...');
      
      // Relaunch the app
      setTimeout(async () => {
        await relaunch();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to download and install update:', error);
      showMessage('error', 'Failed to install update');
      setDownloading(false);
    }
  };

  return (
    <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 mt-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Application Updates</h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex gap-2">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Auto-Update:</strong> Keep your application up to date with the latest features and security fixes.
            </p>
            <p className="text-xs text-blue-700 mt-2">
              Updates are downloaded from the official GitHub releases.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Version Information */}
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Current Version</span>
            <span className="text-sm font-mono text-slate-800">{currentVersion}</span>
          </div>
          {updateAvailable && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Latest Version</span>
              <span className="text-sm font-mono text-green-600">{latestVersion}</span>
            </div>
          )}
        </div>

        {/* Check for Updates Button */}
        <button
          onClick={checkForUpdates}
          disabled={checking || downloading}
          className="w-full px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          {checking ? (
            <>
              <RefreshCw size={20} className="animate-spin" />
              Checking for Updates...
            </>
          ) : (
            <>
              <RefreshCw size={20} />
              Check for Updates
            </>
          )}
        </button>

        {/* Download and Install Button */}
        {updateAvailable && (
          <div className="space-y-2">
            <button
              onClick={downloadAndInstall}
              disabled={downloading}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {downloading ? (
                <>
                  <Download size={20} className="animate-pulse" />
                  {downloadProgress > 0 && downloadProgress < 100
                    ? `Downloading... ${downloadProgress}%`
                    : downloadProgress === 100
                    ? 'Installing...'
                    : 'Preparing download...'}
                </>
              ) : (
                <>
                  <Download size={20} />
                  Download and Install Update
                </>
              )}
            </button>
            
            {downloading && (
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: downloadProgress > 0 ? `${downloadProgress}%` : '10%' }}
                />
              </div>
            )}
          </div>
        )}

        {/* Status Message */}
        {!updateAvailable && !checking && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-600" />
            <span className="text-sm text-green-800">You are running the latest version</span>
          </div>
        )}
      </div>
    </div>
  );
};
