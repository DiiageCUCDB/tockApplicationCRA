import { useState, useEffect } from "react";
import { tockCommands } from "./api";
import "./App.css";
import { TabSelector } from "./components/TabSelector";
import { ActivityTab } from "./components/ActivityTab";
import { HistoryTab } from "./components/HistoryTab";
import { SettingsTab } from "./components/SettingsTab";

function App() {
  const [activeTab, setActiveTab] = useState<string>("activity");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tockInstalled, setTockInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    checkInstallation();
  }, []);

  const checkInstallation = async () => {
    const result = await tockCommands.checkTockInstalled();
    setTockInstalled(result.success);
    if (!result.success) {
      setMessage({ type: "error", text: result.error || "Tock CLI not found" });
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
          <p className="text-lg text-slate-700 mb-6">Please install Tock CLI before using this application.</p>
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Installation Options:</h3>
            <pre className="bg-slate-800 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
{`# Homebrew (macOS)
brew tap kriuchkov/tap
brew install tock

# Go Install
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
