import React, { useState, useEffect } from 'react';
import { tockCommands } from '../api';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { ApiRoute, ReportSettings } from '../types';

interface ReportApiSenderProps {
  showMessage: (type: 'success' | 'error', text: string) => void;
}

export const ReportApiSender: React.FC<ReportApiSenderProps> = ({ showMessage }) => {
  const [routes, setRoutes] = useState<ApiRoute[]>([]);
  const [settings, setSettings] = useState<ReportSettings>({
    auto_send_enabled: false,
    selected_api_route_id: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Load API routes
    const routesResult = await tockCommands.getAllApiRoutes();
    if (routesResult.success) {
      try {
        const parsedRoutes: ApiRoute[] = JSON.parse(routesResult.output);
        setRoutes(parsedRoutes);
      } catch (e) {
        console.error('Failed to parse API routes response:', e);
      }
    }
    
    // Load report settings
    const settingsResult = await tockCommands.getReportSettings();
    if (settingsResult.success) {
      try {
        const parsedSettings: ReportSettings = JSON.parse(settingsResult.output);
        setSettings(parsedSettings);
      } catch (e) {
        console.error('Failed to parse report settings response:', e);
      }
    }
    
    setLoading(false);
  };

  const handleAutoSendToggle = async (enabled: boolean) => {
    const result = await tockCommands.updateReportSettings(
      enabled,
      settings.selected_api_route_id
    );
    
    if (result.success) {
      setSettings({ ...settings, auto_send_enabled: enabled });
      showMessage('success', enabled ? 'Auto-send enabled' : 'Auto-send disabled');
    } else {
      showMessage('error', result.error || 'Failed to update settings');
    }
  };

  const handleApiRouteChange = async (routeId: number | undefined) => {
    const result = await tockCommands.updateReportSettings(
      settings.auto_send_enabled,
      routeId
    );
    
    if (result.success) {
      setSettings({ ...settings, selected_api_route_id: routeId });
      showMessage('success', 'API route updated');
    } else {
      showMessage('error', result.error || 'Failed to update settings');
    }
  };

  const handleSendReport = async () => {
    if (!settings.selected_api_route_id) {
      showMessage('error', 'Please select an API route first');
      return;
    }
    
    setSending(true);
    const result = await tockCommands.sendMonthlyReportToApi(settings.selected_api_route_id);
    setSending(false);
    
    if (result.success) {
      showMessage('success', result.output);
    } else {
      showMessage('error', result.error || 'Failed to send report');
    }
  };

  const enabledRoutes = routes.filter(r => r.enabled);
  const selectedRoute = routes.find(r => r.id === settings.selected_api_route_id);

  return (
    <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 mt-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Monthly Report API Sender</h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex gap-2">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>About Monthly Reports:</strong> This feature sends your current month's activity report 
              to a selected API endpoint. The report includes all tracked activities for the current month.
            </p>
            <p className="text-xs text-blue-700 mt-2">
              The API will receive a POST request with JSON containing: year, month, report (text), and generated_at (timestamp).
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4 text-slate-500">Loading...</div>
      ) : (
        <div className="space-y-4">
          {/* API Route Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select API Route for Reports
            </label>
            {enabledRoutes.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                No enabled API routes available. Please add and enable an API route in the section below.
              </div>
            ) : (
              <select
                value={settings.selected_api_route_id || ''}
                onChange={(e) => handleApiRouteChange(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="">-- Select an API route --</option>
                {enabledRoutes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name} ({route.url})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Auto-send checkbox */}
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200">
            <input
              type="checkbox"
              id="auto-send-checkbox"
              checked={settings.auto_send_enabled}
              onChange={(e) => handleAutoSendToggle(e.target.checked)}
              disabled={!settings.selected_api_route_id}
              className="w-5 h-5 text-slate-700 border-slate-300 rounded focus:ring-2 focus:ring-slate-500"
            />
            <label 
              htmlFor="auto-send-checkbox" 
              className={`text-sm font-medium ${!settings.selected_api_route_id ? 'text-slate-400' : 'text-slate-700 cursor-pointer'}`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className={settings.auto_send_enabled ? 'text-green-600' : 'text-slate-400'} />
                Enable automatic monthly report sending
              </div>
              <p className="text-xs text-slate-500 mt-1">
                When enabled, reports will be automatically sent to the selected API route monthly.
                {!settings.selected_api_route_id && ' (Select an API route first)'}
              </p>
            </label>
          </div>

          {/* Manual send button */}
          <div>
            <button
              onClick={handleSendReport}
              disabled={sending || !settings.selected_api_route_id}
              className="w-full px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {sending ? (
                'Sending...'
              ) : (
                <>
                  <Send size={20} />
                  Send Monthly Report Now
                </>
              )}
            </button>
            {selectedRoute && (
              <p className="text-xs text-slate-500 mt-2 text-center">
                Report will be sent to: {selectedRoute.name} ({selectedRoute.url})
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
