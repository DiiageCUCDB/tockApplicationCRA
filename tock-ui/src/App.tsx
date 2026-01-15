import { useState, useEffect } from "react";
import { tockCommands } from "./api";
import "./App.css";
import { TabSelector } from "./components/TabSelector";
import { ActivityTab } from "./components/ActivityTab";
import { HistoryTab } from "./components/HistoryTab";
import { SettingsTab } from "./components/SettingsTab";

function App() {
  const INSTALLATION_CHECK_DELAY = 2000; // ms - delay before rechecking installation after auto-install
  
  const [activeTab, setActiveTab] = useState<string>("activity");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tockInstalled, setTockInstalled] = useState<boolean | null>(null);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  useEffect(() => {
    checkInstallation();
    syncApiProjectsOnStartup();
    checkAndSendAutoReport();
  }, []);

  const checkInstallation = async () => {
    const result = await tockCommands.checkTockInstalled();
    setTockInstalled(result.success);
    if (!result.success) {
      setMessage({ type: "error", text: result.error || "Tock CLI not found" });
    }
  };
  
  const syncApiProjectsOnStartup = async () => {
    // Silently sync all API projects in the background
    try {
      await tockCommands.syncAllApiProjects();
    } catch (error) {
      console.error('Failed to sync API projects on startup:', error);
    }
  };

  const checkAndSendAutoReport = async () => {
    // Silently check and send auto report in the background
    try {
      await tockCommands.checkAndSendAutoReport();
    } catch (error) {
      console.error('Failed to check and send auto report on startup:', error);
    }
  };

  const handleAutoInstall = async () => {
    setIsInstalling(true);
    setMessage({ type: "success", text: "Installing Tock CLI... This may take a few moments." });
    
    try {
      const result = await tockCommands.autoInstallTock();
      if (result.success) {
        setMessage({ type: "success", text: result.output || "Tock installed successfully!" });
        // Wait a moment then check installation again
        setTimeout(async () => {
          await checkInstallation();
        }, INSTALLATION_CHECK_DELAY);
      } else {
        setMessage({ type: "error", text: result.error || "Installation failed" });
      }
    } catch (error) {
      setMessage({ type: "error", text: `Installation error: ${error}` });
    } finally {
      setIsInstalling(false);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  if (tockInstalled === false) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
          <h1 className="text-3xl font-bold text-red-600 mb-4">⚠️ Tock CLI Not Found</h1>
          <p className="text-lg text-slate-700 mb-6">
            Tock CLI is not installed on your system. You can install it automatically or manually.
          </p>

          {/* Auto-install section */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mb-6">
            <h3 className="text-xl font-semibold text-slate-800 mb-3">🚀 Automatic Installation</h3>
            <p className="text-sm text-slate-600 mb-4">
              Click the button below to automatically install Tock CLI for your operating system.
            </p>
            <button 
              onClick={handleAutoInstall}
              disabled={isInstalling}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isInstalling ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Installing...
                </>
              ) : (
                <>
                  ⚡ Auto-Install Tock CLI
                </>
              )}
            </button>
            <p className="text-xs text-slate-500 mt-3">
              • macOS: Installs via Homebrew (requires Homebrew)<br/>
              • Windows: Installs via Go (requires Go)<br/>
              • Linux: Installs via Go (requires Go)
            </p>
          </div>

          {/* Manual installation section */}
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">📋 Manual Installation</h3>
            <pre className="bg-slate-800 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
              {`# Homebrew (macOS)
              brew tap kriuchkov/tap
              brew install tock

              # Go Install (windows)
              https://go.dev/doc/install
              go install github.com/kriuchkov/tock/cmd/tock@latest

              # Build from source
              git clone https://github.com/kriuchkov/tock
              cd tock
              go build -o tock ./cmd/tock`}
            </pre>
          </div>
          <button 
            onClick={checkInstallation}
            className="mt-6 w-full px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">⏱️ Tock Time Tracker</h1>
          <p className="text-slate-600">A modern GUI for Tock CLI time tracking</p>
        </header>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 px-6 py-4 rounded-lg font-medium ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-red-100 text-red-800 border border-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tab Selector */}
        <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-lg p-6 min-h-[500px]">
          {activeTab === "activity" && <ActivityTab showMessage={showMessage} />}
          {activeTab === "history" && <HistoryTab />}
          {activeTab === "settings" && <SettingsTab showMessage={showMessage} />}
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 text-slate-600 text-sm">
          Built with Tauri + React | Tock CLI Interface
        </footer>
      </div>
    </div>
  );
}

export default App;
